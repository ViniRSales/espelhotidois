import { describe, expect, it } from 'vitest';

import { apagarSessaoSalva, lerSessaoSalva, salvarSessao } from './sessaoSalva';

const CHAVE = 'doapp.sessao';
const sessao = { token: 't1', expiraEm: '2030-01-01T00:00:00Z' };
const antes = Date.parse('2029-12-31T00:00:00Z');

describe('sessaoSalva', () => {
  it('"manter conectado" guarda no localStorage', () => {
    salvarSessao(sessao, true);

    expect(JSON.parse(localStorage.getItem(CHAVE)!)).toEqual(sessao);
    expect(sessionStorage.getItem(CHAVE)).toBeNull();
    expect(lerSessaoSalva(antes)).toEqual(sessao);
  });

  it('sem "manter conectado", guarda só nesta aba (sessionStorage)', () => {
    salvarSessao(sessao, false);

    expect(localStorage.getItem(CHAVE)).toBeNull();
    expect(lerSessaoSalva(antes)).toEqual(sessao);
  });

  it('salvar de novo troca de lugar sem deixar a sessão antiga para trás', () => {
    salvarSessao(sessao, true);
    salvarSessao({ ...sessao, token: 't2' }, false);

    expect(localStorage.getItem(CHAVE)).toBeNull();
    expect(lerSessaoSalva(antes)?.token).toBe('t2');
  });

  it('descarta a sessão vencida', () => {
    salvarSessao(sessao, true);

    expect(lerSessaoSalva(Date.parse('2030-01-01T00:00:01Z'))).toBeNull();
    expect(localStorage.getItem(CHAVE)).toBeNull();
  });

  it('descarta dados corrompidos', () => {
    localStorage.setItem(CHAVE, '{não é json');
    expect(lerSessaoSalva(antes)).toBeNull();

    localStorage.setItem(CHAVE, JSON.stringify({ token: 1 }));
    expect(lerSessaoSalva(antes)).toBeNull();
  });

  it('apagar limpa os dois storages', () => {
    localStorage.setItem(CHAVE, JSON.stringify(sessao));
    sessionStorage.setItem(CHAVE, JSON.stringify(sessao));

    apagarSessaoSalva();

    expect(localStorage.getItem(CHAVE)).toBeNull();
    expect(sessionStorage.getItem(CHAVE)).toBeNull();
  });
});
