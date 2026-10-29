import { describe, expect, it } from 'vitest';

import { cadastroReducer, estadoInicial, type EstadoCadastro } from './estado';
import { campoDaApi, formularioDaDoacao, rascunhoDoFormulario } from './formulario';
import { doacao, foto, formularioCompleto } from './testes/dados';

function aplicar(estado: EstadoCadastro, ...acoes: Parameters<typeof cadastroReducer>[1][]) {
  return acoes.reduce(cadastroReducer, estado);
}

describe('cadastroReducer', () => {
  it('navegar entre as etapas não perde os dados', () => {
    const estado = aplicar(
      estadoInicial,
      { tipo: 'alterar', campos: { titulo: 'Cachecol' } },
      { tipo: 'irPara', etapa: 2 },
      { tipo: 'alterar', campos: { tags: ['inverno'] } },
      { tipo: 'irPara', etapa: 4 },
      { tipo: 'irPara', etapa: 1 },
    );

    expect(estado.etapa).toBe(1);
    expect(estado.etapaMaxima).toBe(4);
    expect(estado.formulario.titulo).toBe('Cachecol');
    expect(estado.formulario.tags).toEqual(['inverno']);
  });

  it('não sai do intervalo de etapas', () => {
    expect(aplicar(estadoInicial, { tipo: 'irPara', etapa: 0 }).etapa).toBe(1);
    expect(aplicar(estadoInicial, { tipo: 'irPara', etapa: 9 }).etapa).toBe(5);
  });

  it('alterar marca como não salvo e limpa só o erro do campo mexido', () => {
    const comErros = aplicar(estadoInicial, { tipo: 'falhou', erros: { titulo: 'x', descricao: 'y' } });

    const estado = aplicar(comErros, { tipo: 'alterar', campos: { titulo: 'Cachecol' } });

    expect(estado.sujo).toBe(true);
    expect(estado.erros).toEqual({ descricao: 'y' });
  });

  it('salvo guarda o id e as fotos e limpa o "não salvo"', () => {
    const estado = aplicar(
      estadoInicial,
      { tipo: 'alterar', campos: { titulo: 'Cachecol' } },
      { tipo: 'salvando' },
      { tipo: 'salvo', doacao: doacao({ id: 'd9', fotos: [foto('f1')] }) },
    );

    expect(estado).toMatchObject({ id: 'd9', sujo: false, salvando: false });
    expect(estado.formulario.titulo).toBe('Cachecol');
    expect(estado.formulario.fotos).toHaveLength(1);
  });

  it('adiciona e remove fotos', () => {
    const estado = aplicar(
      { ...estadoInicial, erros: { fotos: 'Adicione pelo menos uma foto do item.' } },
      { tipo: 'fotoAdicionada', foto: foto('f1') },
      { tipo: 'fotoAdicionada', foto: foto('f2') },
      { tipo: 'fotoRemovida', fotoId: 'f1' },
    );

    expect(estado.formulario.fotos.map((f) => f.id)).toEqual(['f2']);
    expect(estado.erros.fotos).toBeUndefined();
  });

  it('carregar um rascunho abre na etapa pedida', () => {
    const estado = aplicar(estadoInicial, {
      tipo: 'carregar', etapa: 3, doacao: doacao({ titulo: 'Casaco', localizacao: { bairro: 'Centro', cidade: null } }),
    });

    expect(estado).toMatchObject({ id: 'd1', etapa: 3, etapaMaxima: 3, sujo: false });
    expect(estado.formulario).toMatchObject({ titulo: 'Casaco', bairro: 'Centro', cidade: '' });
  });
});

describe('conversões do formulário', () => {
  it('monta o corpo do rascunho com textos vazios como null', () => {
    const corpo = rascunhoDoFormulario(formularioCompleto({ descricao: '  ', fotos: [foto('b'), foto('a')], bairro: '', cidade: '' }));

    expect(corpo).toMatchObject({ titulo: 'Cachecol vermelho', descricao: null, ordemFotos: ['b', 'a'], localizacao: null, validade: null });
  });

  it('volta da doação da API para o formulário', () => {
    const formulario = formularioDaDoacao(doacao({ categoria: { id: 'c', nome: 'Roupas' }, validade: '2026-11-01', naoPerecivel: null }));

    expect(formulario).toMatchObject({ categoriaId: 'c', validade: '2026-11-01', naoPerecivel: false, titulo: '' });
  });

  it('traduz os nomes de campo da API', () => {
    expect(campoDaApi('localizacao.bairro')).toBe('bairro');
    expect(campoDaApi('titulo')).toBe('titulo');
    expect(campoDaApi('arquivo')).toBeNull();
  });
});
