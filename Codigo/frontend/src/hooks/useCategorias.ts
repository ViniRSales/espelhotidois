import { useEffect, useState } from 'react';

import { ApiError } from '@/services/api';
import { listarCategorias, type Categoria } from '@/services/categorias';

type Estado = { categorias: Categoria[]; carregando: boolean; erro: string | null };

/** Categorias vindas da API (GET /api/categorias). */
export function useCategorias(): Estado {
  const [estado, setEstado] = useState<Estado>({ categorias: [], carregando: true, erro: null });

  useEffect(() => {
    let ativo = true;
    listarCategorias()
      .then((categorias) => ativo && setEstado({ categorias, carregando: false, erro: null }))
      .catch((e: unknown) => {
        const erro = e instanceof ApiError ? e.message : 'Não foi possível carregar as categorias.';
        if (ativo) setEstado({ categorias: [], carregando: false, erro });
      });
    return () => {
      ativo = false;
    };
  }, []);

  return estado;
}
