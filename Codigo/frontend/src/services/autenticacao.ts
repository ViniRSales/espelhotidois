import type { DadosCadastro, DadosLogin, Sessao, Usuario } from '@/types/autenticacao';

import { api } from './api';

/** Cria a conta e já devolve a sessão (a pessoa entra direto). */
export function cadastrar(dados: DadosCadastro) {
  return api<Sessao>('/auth/cadastro', { method: 'POST', body: dados });
}

export function entrar(dados: DadosLogin) {
  return api<Sessao>('/auth/login', { method: 'POST', body: dados });
}

/** Revoga o token atual na API. */
export function sair() {
  return api<void>('/auth/logout', { method: 'POST' });
}

/** Confere se o token salvo ainda vale e traz os dados da conta. */
export function buscarUsuarioAtual() {
  return api<Usuario>('/auth/eu');
}

/** Pede o link de redefinição. A API responde igual exista ou não a conta, para não revelar quais e-mails têm cadastro. */
export function pedirRedefinicao(email: string) {
  return api<void>('/auth/esqueci-senha', { method: 'POST', body: { email } });
}

/** Troca a senha usando o token do link enviado por e-mail. Encerra todas as sessões da conta. */
export function redefinirSenha(token: string, senha: string) {
  return api<void>('/auth/redefinir-senha', { method: 'POST', body: { token, senha } });
}
