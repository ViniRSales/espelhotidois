import type { DadosCadastro, DadosLogin, Sessao, Usuario } from '@/types/autenticacao';

import { api } from './api';

export function cadastrar(dados: DadosCadastro) {
  return api<Sessao>('/auth/cadastro', { method: 'POST', body: dados });
}

export function entrar(dados: DadosLogin) {
  return api<Sessao>('/auth/login', { method: 'POST', body: dados });
}

export function sair() {
  return api<void>('/auth/logout', { method: 'POST' });
}

export function buscarUsuarioAtual() {
  return api<Usuario>('/auth/eu');
}

export function pedirRedefinicao(email: string) {
  return api<void>('/auth/esqueci-senha', { method: 'POST', body: { email } });
}

export function redefinirSenha(token: string, senha: string) {
  return api<void>('/auth/redefinir-senha', { method: 'POST', body: { token, senha } });
}
