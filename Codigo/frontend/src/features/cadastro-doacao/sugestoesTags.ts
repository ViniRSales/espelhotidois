// Sugestões de tags por categoria (nome da categoria da API). O TagInput mostra as primeiras que ainda não foram usadas.

const SUGESTOES: Record<string, string[]> = {
  'Roupas': ['inverno', 'verão', 'infantil', 'adulto', 'unissex', 'feminino', 'masculino'],
  'Calçados': ['tênis', 'sandália', 'infantil', 'adulto', 'esporte'],
  'Acessórios': ['inverno', 'bolsa', 'cachecol', 'boné', 'unissex'],
  'Bebê e gestante': ['recém-nascido', 'enxoval', 'carrinho', 'fralda', 'gestante'],
  'Brinquedos': ['educativo', 'pelúcia', 'jogo', 'infantil', 'montar'],
  'Livros e material escolar': ['didático', 'literatura', 'caderno', 'mochila', 'infantil'],
  'Móveis': ['sala', 'quarto', 'cozinha', 'madeira', 'grande porte'],
  'Eletrodomésticos': ['cozinha', 'lavanderia', 'funcionando', '110v', '220v'],
  'Eletrônicos': ['celular', 'computador', 'funcionando', 'carregador', 'acessório'],
  'Utensílios de cozinha': ['panela', 'louça', 'talheres', 'copos', 'conjunto'],
  'Cama, mesa e banho': ['lençol', 'toalha', 'cobertor', 'casal', 'solteiro'],
  'Alimentos': ['não perecível', 'cesta básica', 'grãos', 'enlatados', 'infantil'],
  'Higiene e limpeza': ['sabonete', 'fralda', 'absorvente', 'limpeza', 'kit'],
};

export function sugestoesDeTags(categoria: string | undefined) {
  return (categoria && SUGESTOES[categoria]) || [];
}
