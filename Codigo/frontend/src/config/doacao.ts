// Regras do cadastro de doações.
// Espelham o bloco doapp.doacoes do application.yml da API: ao mudar um valor lá, mude aqui também.

export const DOACAO = {
  diasDisponivel: 30,
  tituloMinimo: 3,
  tituloMaximo: 90,
  descricaoMaximo: 300,
  tagsMaximo: 5,
  tagMinimo: 2,
  tagMaximo: 30,
  localMinimo: 2,
  localMaximo: 60,
  fotos: {
    minimo: 1,
    maximo: 10,
    tamanhoMaximoMb: 5,
    tiposPermitidos: ['image/jpeg', 'image/png', 'image/webp'],
  },
  /** Nome da categoria que exige validade (CategoriaService.ALIMENTOS). */
  categoriaAlimentos: 'Alimentos',
} as const;
