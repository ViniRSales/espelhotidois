export type LocalizacaoConta = { bairro: string; cidade: string; uf: string | null };

export type TipoConta = 'PESSOA_FISICA' | 'INSTITUICAO';

export const TIPOS_CONTA: { value: TipoConta; label: string }[] = [
  { value: 'PESSOA_FISICA', label: 'Pessoa física' },
  { value: 'INSTITUICAO', label: 'Instituição' },
];

export type Usuario = {
  id: string;
  tipo: TipoConta;
  nome: string;
  email: string;
  telefone: string;
  localizacao: LocalizacaoConta;
};

export type Sessao = {
  token: string;
  expiraEm: string;
  usuario: Usuario;
};

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

export type DadosLogin = {
  email: string;
  senha: string;
  manterConectado: boolean;
};
