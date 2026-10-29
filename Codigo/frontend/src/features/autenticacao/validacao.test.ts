import { describe, expect, it } from 'vitest';

import { ApiError } from '@/services/api';

import { destinoAposLogin } from './destino';
import {
  emailValido,
  errosDaApi,
  formatarTelefone,
  soDigitos,
  temErros,
  validarCadastro,
  validarLogin,
  type FormularioCadastro,
} from './validacao';

const valido: FormularioCadastro = {
  tipo: 'PESSOA_FISICA',
  nome: 'Maria da Silva',
  email: 'maria@email.com',
  telefone: '(31) 99999-8888',
  local: { bairro: 'Savassi', cidade: 'Belo Horizonte', uf: 'MG' },
  senha: '12345678',
};

describe('validarCadastro', () => {
  it('aceita um cadastro completo', () => {
    expect(validarCadastro(valido)).toEqual({});
  });

  it('exige todos os campos, com as mensagens da API', () => {
    const erros = validarCadastro({ ...valido, nome: ' ', email: '', telefone: '', local: null, senha: '' });

    expect(erros).toEqual({
      nome: 'Informe seu nome.',
      email: 'Informe um e-mail válido, como nome@email.com.',
      telefone: 'Informe o telefone com DDD.',
      local: 'Digite seu bairro e escolha uma opção da lista.',
      senha: 'A senha precisa ter pelo menos 8 caracteres.',
    });
  });

  it('senha precisa ter de 8 a 72 caracteres', () => {
    expect(validarCadastro({ ...valido, senha: '1234567' }).senha).toBe('A senha precisa ter pelo menos 8 caracteres.');
    expect(validarCadastro({ ...valido, senha: 'a'.repeat(72) }).senha).toBeUndefined();
    expect(validarCadastro({ ...valido, senha: 'a'.repeat(73) }).senha).toBe('Use no máximo 72 caracteres.');
  });

  it('o bairro escolhido precisa ter bairro e cidade com pelo menos 2 letras', () => {
    expect(validarCadastro({ ...valido, local: { bairro: ' a ', cidade: 'BH', uf: 'MG' } }).local).toBeDefined();
    expect(validarCadastro({ ...valido, local: { bairro: 'Centro', cidade: 'BH', uf: 'MG' } }).local).toBeUndefined();
  });

  it('telefone precisa de DDD (10 ou 11 dígitos)', () => {
    expect(validarCadastro({ ...valido, telefone: '99999-8888' }).telefone).toBe('Informe o telefone com DDD.');
    expect(validarCadastro({ ...valido, telefone: '(31) 3333-4444' }).telefone).toBeUndefined();
  });
});

describe('validarLogin', () => {
  it('pede e-mail e senha', () => {
    expect(validarLogin({ email: '', senha: '', manterConectado: true })).toEqual({
      email: 'Informe seu e-mail.',
      senha: 'Informe sua senha.',
    });
  });

  it('recusa e-mail mal escrito', () => {
    expect(validarLogin({ email: 'maria@', senha: 'x', manterConectado: false }).email)
      .toBe('Informe um e-mail válido, como nome@email.com.');
  });
});

describe('telefone', () => {
  it.each([
    ['', ''],
    ['3', '(3'],
    ['31', '(31'],
    ['319', '(31) 9'],
    ['3133334444', '(31) 3333-4444'],
    ['31999998888', '(31) 99999-8888'],
    ['(31) 99999-88889', '(31) 99999-8888'],
  ])('formata %s como %s', (digitado, esperado) => {
    expect(formatarTelefone(digitado)).toBe(esperado);
  });

  it('soDigitos tira a máscara', () => {
    expect(soDigitos('(31) 99999-8888')).toBe('31999998888');
  });
});

describe('auxiliares', () => {
  it('emailValido ignora espaços nas pontas', () => {
    expect(emailValido('  maria@email.com ')).toBe(true);
    expect(emailValido('maria email.com')).toBe(false);
  });

  it('temErros ignora campos já corrigidos', () => {
    expect(temErros({ email: undefined })).toBe(false);
    expect(temErros({ email: 'Erro' })).toBe(true);
  });

  it('errosDaApi transforma a lista de campos em um objeto', () => {
    const erro = new ApiError(400, 'Confira', [{ campo: 'email', mensagem: 'Inválido' }]);

    expect(errosDaApi(erro)).toEqual({ email: 'Inválido' });
  });

  it('errosDaApi junta bairro, cidade e UF no campo único de localização', () => {
    const erro = new ApiError(400, 'Confira', [{ campo: 'uf', mensagem: 'Informe o estado.' }]);

    expect(errosDaApi(erro)).toEqual({ local: 'Informe o estado.' });
  });
});

describe('destinoAposLogin', () => {
  it('volta para a tela protegida que a pessoa tentou abrir', () => {
    expect(destinoAposLogin({ de: '/adicionar/item?etapa=2' })).toBe('/adicionar/item?etapa=2');
  });

  it.each([null, undefined, {}, { de: 42 }, { de: 'https://golpe.com' }, { de: '//golpe.com' }])(
    'vai para a Home quando o destino é %j (nunca para outro site)',
    (estado) => {
      expect(destinoAposLogin(estado)).toBe('/');
    },
  );
});
