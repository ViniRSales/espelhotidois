/** Bairro, cidade e sigla do estado da conta (LocalizacaoConta). */
export type LocalizacaoConta = { bairro: string; cidade: string; uf: string | null };

export type TipoConta = 'PESSOA_FISICA' | 'INSTITUICAO';

export const TIPOS_CONTA: { value: TipoConta; label: string }[] = [
  { value: 'PESSOA_FISICA', label: 'Pessoa física' },
  { value: 'INSTITUICAO', label: 'Instituição' },
];

/** Dados da própria conta, como a API devolve (UsuarioResposta). Só a própria pessoa recebe. */
export type Usuario = {
  id: string;
  tipo: TipoConta;
  nome: string;
  email: string;
  telefone: string;
  localizacao: LocalizacaoConta;
};

/** Resposta do cadastro e do login (SessaoResposta). */
export type Sessao = {
  token: string;
  /** Data ISO em que o token deixa de valer. */
  expiraEm: string;
  usuario: Usuario;
};

/** Corpo do cadastro (CadastroRequisicao). O telefone vai só com dígitos. */
export type DadosCadastro = {
  tipo: TipoConta;
  nome: string;
  email: string;
  telefone: string;
  bairro: string;
  cidade: string;
  uf: string;
  senha: string;
};

/** Corpo do login (LoginRequisicao). */
export type DadosLogin = {
  email: string;
  senha: string;
  manterConectado: boolean;
};
