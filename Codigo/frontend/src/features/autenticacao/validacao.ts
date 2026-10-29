import type { ApiError } from '@/services/api';
import type { LocalSugerido } from '@/services/localizacao';
import type { TipoConta } from '@/types/autenticacao';

export const LIMITES = {
  nome: { minimo: 2, maximo: 100 },
  local: { minimo: 2, maximo: 60 },
  senha: { minimo: 8, maximo: 72 },
} as const;

export type FormularioCadastro = {
  tipo: TipoConta;
  nome: string;
  email: string;
  telefone: string;
  local: LocalSugerido | null;
  senha: string;
};

export const ESCOLHA_O_BAIRRO = 'Digite seu bairro e escolha uma opção da lista.';

export type FormularioLogin = {
  email: string;
  senha: string;
  manterConectado: boolean;
};

export type Erros<T> = Partial<Record<keyof T, string>>;

export function soDigitos(texto: string) {
  return texto.replace(/\D/g, '');
}

export function formatarTelefone(valor: string) {
  const digitos = soDigitos(valor).slice(0, 11);
  if (digitos.length === 0) return '';
  if (digitos.length <= 2) return `(${digitos}`;
  const ddd = digitos.slice(0, 2);
  const numero = digitos.slice(2);
  const corte = digitos.length === 11 ? 5 : 4;
  if (numero.length <= corte) return `(${ddd}) ${numero}`;
  return `(${ddd}) ${numero.slice(0, corte)}-${numero.slice(corte)}`;
}

export function emailValido(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function entre(texto: string, { minimo, maximo }: { minimo: number; maximo: number }) {
  const tamanho = texto.trim().length;
  return tamanho >= minimo && tamanho <= maximo;
}

export function validarCadastro(formulario: FormularioCadastro): Erros<FormularioCadastro> {
  const erros: Erros<FormularioCadastro> = {};
  if (!entre(formulario.nome, LIMITES.nome)) erros.nome = 'Informe seu nome.';
  if (!emailValido(formulario.email)) erros.email = 'Informe um e-mail válido, como nome@email.com.';
  const telefone = soDigitos(formulario.telefone);
  if (telefone.length < 10 || telefone.length > 11) erros.telefone = 'Informe o telefone com DDD.';
  const local = formulario.local;
  if (!local || !entre(local.bairro, LIMITES.local) || !entre(local.cidade, LIMITES.local)) erros.local = ESCOLHA_O_BAIRRO;
  const senha = erroDaSenha(formulario.senha);
  if (senha) erros.senha = senha;
  return erros;
}

export function erroDaSenha(senha: string) {
  if (senha.length < LIMITES.senha.minimo) return 'A senha precisa ter pelo menos 8 caracteres.';
  if (senha.length > LIMITES.senha.maximo) return 'Use no máximo 72 caracteres.';
  return undefined;
}

export function validarLogin(formulario: FormularioLogin): Erros<FormularioLogin> {
  const erros: Erros<FormularioLogin> = {};
  if (!formulario.email.trim()) erros.email = 'Informe seu e-mail.';
  else if (!emailValido(formulario.email)) erros.email = 'Informe um e-mail válido, como nome@email.com.';
  if (!formulario.senha) erros.senha = 'Informe sua senha.';
  return erros;
}

export function temErros(erros: object) {
  return Object.values(erros).some(Boolean);
}

const CAMPOS_AGRUPADOS: Record<string, string> = { bairro: 'local', cidade: 'local', uf: 'local' };

export function errosDaApi<T>(erro: ApiError): Erros<T> {
  return Object.fromEntries(
    erro.campos.map(({ campo, mensagem }) => [CAMPOS_AGRUPADOS[campo] ?? campo, mensagem]),
  ) as Erros<T>;
}
