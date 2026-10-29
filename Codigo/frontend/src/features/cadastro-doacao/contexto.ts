import { createContext } from 'react';

import type { Categoria } from '@/services/categorias';
import type { Doacao } from '@/types/doacao';

import type { EstadoCadastro } from './estado';
import type { FormularioDoacao } from './formulario';

export type CadastroDoacao = {
  estado: EstadoCadastro;
  categorias: Categoria[];
  carregandoCategorias: boolean;
  categoriaEscolhida: Categoria | undefined;
  /** A categoria escolhida exige validade. */
  ehAlimento: boolean;

  alterar: (campos: Partial<FormularioDoacao>) => void;
  /** Vai para uma etapa já alcançada (stepper, "Editar" da revisão). */
  irParaEtapa: (etapa: number) => void;
  voltar: () => void;
  /** Valida a etapa, salva o rascunho e avança. Devolve se avançou. */
  continuar: () => Promise<boolean>;
  /** Salva sem validar. Devolve se salvou. */
  salvarRascunho: () => Promise<boolean>;
  adicionarFotos: (arquivos: File[]) => Promise<void>;
  removerFoto: (fotoId: string) => Promise<void>;
  tornarCapa: (fotoId: string) => void;
  /** Valida tudo, salva e publica. Devolve a doação publicada ou `null`. */
  publicar: () => Promise<Doacao | null>;
  /** Apaga o rascunho (se já existir na API). Devolve se deu certo. */
  descartar: () => Promise<boolean>;
};

export const CadastroDoacaoContext = createContext<CadastroDoacao | null>(null);
