// Regras do cadastro de solicitações (pedidos).
// Espelham o bloco doapp.solicitacoes do application.yml e as constantes de RegrasSolicitacao:
// ao mudar um valor lá, mude aqui também.

import { DOACAO } from './doacao';

export const SOLICITACAO = {
  tituloMinimo: 3,
  tituloMaximo: 90,
  descricaoMaximo: 500,
  localMaximo: 60,
  fotos: {
    maximo: 1,
    // A foto de referência usa o mesmo armazenamento das fotos de doação, então valem o mesmo tamanho e tipos.
    tamanhoMaximoMb: DOACAO.fotos.tamanhoMaximoMb,
    tiposPermitidos: DOACAO.fotos.tiposPermitidos,
  },
} as const;
