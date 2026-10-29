import { describe, expect, it } from 'vitest';

import {
  errosDaApi,
  errosDaEtapa,
  etapaDoPrimeiroErro,
  FORMULARIO_VAZIO,
  formularioDe,
  paraRequisicao,
  temErros,
  validar,
} from './formulario';
import { formularioCompleto, ROUPAS, solicitacao } from './testes/dados';

describe('validar', () => {
  it('aceita só os campos obrigatórios', () => {
    expect(temErros(validar(formularioCompleto()))).toBe(false);
  });

  it('exige título, categoria e urgência, e nada mais', () => {
    const erros = validar(FORMULARIO_VAZIO);

    expect(Object.keys(erros).sort()).toEqual(['categoriaId', 'titulo', 'urgencia']);
  });

  it('recusa título curto demais e textos longos demais', () => {
    expect(validar(formularioCompleto({ titulo: ' ab ' })).titulo).toMatch(/pelo menos 3 letras/);
    expect(validar(formularioCompleto({ titulo: 'a'.repeat(91) })).titulo).toMatch(/até 90/);
    expect(validar(formularioCompleto({ descricao: 'a'.repeat(501) })).descricao).toMatch(/até 500/);
    expect(validar(formularioCompleto({ bairro: 'a'.repeat(61) })).bairro).toMatch(/até 60/);
  });

  it('confere o tipo e o tamanho da foto escolhida', () => {
    const pdf = new File(['x'], 'lista.pdf', { type: 'application/pdf' });
    const grande = new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'casaco.jpg', { type: 'image/jpeg' });
    const boa = new File(['x'], 'casaco.png', { type: 'image/png' });

    expect(validar(formularioCompleto({ foto: { arquivo: pdf, url: 'blob:1' } })).foto).toMatch(/JPG, PNG ou WEBP/);
    expect(validar(formularioCompleto({ foto: { arquivo: grande, url: 'blob:2' } })).foto).toMatch(/passa de 5 MB/);
    expect(validar(formularioCompleto({ foto: { arquivo: boa, url: 'blob:3' } })).foto).toBeUndefined();
    // Uma foto já salva no pedido não é conferida de novo.
    expect(validar(formularioCompleto({ foto: { id: 'f1', url: '/api/fotos/s1/f1.jpg' } })).foto).toBeUndefined();
  });
});

describe('etapas', () => {
  it('só cobra os campos da etapa atual', () => {
    const erros = validar(FORMULARIO_VAZIO);

    expect(Object.keys(errosDaEtapa(erros, 0))).toEqual(['titulo']);
    expect(Object.keys(errosDaEtapa(erros, 1))).toEqual(['categoriaId', 'urgencia']);
    expect(errosDaEtapa(erros, 2)).toEqual({});
  });

  it('leva à primeira etapa com erro', () => {
    expect(etapaDoPrimeiroErro({ urgencia: 'Escolha' }, 2)).toBe(1);
    expect(etapaDoPrimeiroErro({ titulo: 'Conte', urgencia: 'Escolha' }, 2)).toBe(0);
    expect(etapaDoPrimeiroErro({}, 2)).toBe(2);
  });
});

describe('paraRequisicao', () => {
  it('limpa espaços e manda vazio como null', () => {
    const dados = paraRequisicao(formularioCompleto({ titulo: '  Casaco  ', descricao: '   ' }));

    expect(dados).toEqual({ titulo: 'Casaco', descricao: null, categoriaId: ROUPAS.id, urgencia: 'ALTA', localizacao: null });
  });

  it('manda a localização só quando há bairro ou cidade', () => {
    expect(paraRequisicao(formularioCompleto({ bairro: ' Ipiranga ' })).localizacao).toEqual({ bairro: 'Ipiranga', cidade: '' });
  });
});

describe('integração com a API', () => {
  it('leva os erros da API para os campos do formulário', () => {
    const erros = errosDaApi([
      { campo: 'localizacao.bairro', mensagem: 'O bairro pode ter até 60 caracteres.' },
      { campo: 'urgencia', mensagem: 'Escolha para quando você precisa.' },
      { campo: 'campoDesconhecido', mensagem: 'Ignorado' },
    ]);

    expect(erros).toEqual({ bairro: 'O bairro pode ter até 60 caracteres.', urgencia: 'Escolha para quando você precisa.' });
  });

  it('preenche o formulário de edição com o pedido', () => {
    expect(formularioDe(solicitacao({ descricao: null, localizacao: null }))).toEqual({
      titulo: 'Roupas de frio para crianças',
      descricao: '',
      foto: null,
      categoriaId: ROUPAS.id,
      urgencia: 'ALTA',
      bairro: '',
      cidade: '',
    });
  });

  it('traz a foto já salva para a edição e leva o erro da foto para o campo certo', () => {
    const foto = { id: 'f1', url: '/api/fotos/s1/f1.jpg', tipo: 'image/jpeg', tamanho: 100 };

    expect(formularioDe(solicitacao({ fotos: [foto] })).foto).toEqual({ id: 'f1', url: '/api/fotos/s1/f1.jpg' });
    expect(errosDaApi([{ campo: 'arquivo', mensagem: 'Envie fotos em JPG, PNG ou WEBP.' }])).toEqual({
      foto: 'Envie fotos em JPG, PNG ou WEBP.',
    });
  });
});
