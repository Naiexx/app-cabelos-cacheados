import { supabase } from './supabase'

export type RecommendedProduct = {
  id?: string
  user_id: string
  product_name: string
  product_description: string
  product_price: number
  product_image_url: string
  product_category: string
  recommendation_reason: string
}

export type StoreProduct = {
  id: string
  nome: string
  descricao: string
  preco: number
  imagem_url: string
  categoria: string
  estoque?: number
  ativo?: boolean
}

// Buscar produtos da loja integrada (tabela produtos_da_loja)
export async function getStoreProducts() {
  try {
    const { data, error } = await supabase
      .from('produtos_da_loja')
      .select('*')
      .eq('ativo', true) // Apenas produtos ativos
      .order('nome', { ascending: true })

    if (error) {
      console.error('Erro ao buscar produtos da loja:', error)
      return []
    }
    
    return data || []
  } catch (error) {
    console.error('Erro ao buscar produtos da loja:', error)
    return []
  }
}

// Buscar produtos recomendados para o usuário
export async function getRecommendedProducts(userId: string) {
  const { data, error } = await supabase
    .from('recommended_products')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error && error.code !== 'PGRST116') {
    console.error('Erro ao buscar produtos:', error)
    return []
  }
  
  return data || []
}

// Salvar produtos recomendados baseados na análise de IA
export async function saveRecommendedProducts(userId: string, products: Omit<RecommendedProduct, 'id' | 'user_id'>[]) {
  const productsWithUserId = products.map(product => ({
    ...product,
    user_id: userId
  }))

  const { data, error } = await supabase
    .from('recommended_products')
    .insert(productsWithUserId)
    .select()

  if (error) {
    console.error('Erro ao salvar produtos:', error)
    throw error
  }
  
  return data
}

// Gerar produtos recomendados baseados na análise capilar
export function generateProductRecommendations(analysis: any): Omit<RecommendedProduct, 'id' | 'user_id'>[] {
  const products: Omit<RecommendedProduct, 'id' | 'user_id'>[] = []

  // Produtos baseados no padrão de cacho
  if (analysis.curl_pattern) {
    products.push({
      product_name: `Creme Definidor para ${analysis.curl_pattern}`,
      product_description: `Creme especialmente formulado para realçar e definir cachos do tipo ${analysis.curl_pattern}`,
      product_price: 45.90,
      product_image_url: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=400&fit=crop',
      product_category: 'Finalização',
      recommendation_reason: `Ideal para seu padrão de cacho ${analysis.curl_pattern}`
    })
  }

  // Produtos baseados na porosidade
  if (analysis.porosity === 'Alta') {
    products.push({
      product_name: 'Máscara Hidratante Intensiva',
      product_description: 'Hidratação profunda para cabelos com alta porosidade, sela as cutículas e retém umidade',
      product_price: 52.90,
      product_image_url: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=400&h=400&fit=crop',
      product_category: 'Hidratação',
      recommendation_reason: 'Seu cabelo tem alta porosidade e precisa de hidratação intensa'
    })
  } else if (analysis.porosity === 'Baixa') {
    products.push({
      product_name: 'Leave-in Leve',
      product_description: 'Fórmula leve que penetra facilmente em cabelos de baixa porosidade',
      product_price: 38.90,
      product_image_url: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=400&h=400&fit=crop',
      product_category: 'Hidratação',
      recommendation_reason: 'Perfeito para baixa porosidade - absorve rapidamente'
    })
  }

  // Produtos baseados na textura
  if (analysis.texture === 'Fina') {
    products.push({
      product_name: 'Gel Fixador Leve',
      product_description: 'Gel sem peso que define sem deixar os fios duros ou pesados',
      product_price: 35.90,
      product_image_url: 'https://images.unsplash.com/photo-1571875257727-256c39da42af?w=400&h=400&fit=crop',
      product_category: 'Finalização',
      recommendation_reason: 'Textura fina precisa de produtos leves que não pesam'
    })
  } else if (analysis.texture === 'Grossa') {
    products.push({
      product_name: 'Manteiga Capilar Nutritiva',
      product_description: 'Nutrição intensa para fios grossos e ressecados',
      product_price: 48.90,
      product_image_url: 'https://images.unsplash.com/photo-1526045478516-99145907023c?w=400&h=400&fit=crop',
      product_category: 'Nutrição',
      recommendation_reason: 'Fios grossos precisam de nutrição mais intensa'
    })
  }

  // Produtos baseados na densidade
  if (analysis.density === 'Alta') {
    products.push({
      product_name: 'Shampoo Volumizador',
      product_description: 'Limpa profundamente sem pesar, mantém o volume natural',
      product_price: 42.90,
      product_image_url: 'https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?w=400&h=400&fit=crop',
      product_category: 'Limpeza',
      recommendation_reason: 'Densidade alta precisa de produtos que não acumulem'
    })
  }

  // Produtos para saúde geral
  if (analysis.health_score < 70) {
    products.push({
      product_name: 'Ampola de Reconstrução',
      product_description: 'Tratamento intensivo para recuperar fios danificados',
      product_price: 29.90,
      product_image_url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&h=400&fit=crop',
      product_category: 'Tratamento',
      recommendation_reason: 'Seus fios precisam de reconstrução para melhorar a saúde'
    })
  }

  // Sempre incluir proteção térmica
  products.push({
    product_name: 'Protetor Térmico',
    product_description: 'Protege os fios do calor de secadores e chapinhas',
    product_price: 36.90,
    product_image_url: 'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=400&h=400&fit=crop',
    product_category: 'Proteção',
    recommendation_reason: 'Essencial para proteger seus fios do calor'
  })

  // Óleo capilar universal
  products.push({
    product_name: 'Óleo Capilar Multifuncional',
    product_description: 'Nutre, hidrata e dá brilho aos fios',
    product_price: 44.90,
    product_image_url: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&h=400&fit=crop',
    product_category: 'Finalização',
    recommendation_reason: 'Versátil e essencial para qualquer rotina capilar'
  })

  return products
}
