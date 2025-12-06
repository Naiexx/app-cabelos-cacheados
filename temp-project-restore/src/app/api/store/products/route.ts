import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Produtos mock para quando o Supabase não estiver disponível
const mockProducts = [
  {
    id: '1',
    name: 'Shampoo Hidratante',
    description: 'Shampoo especial para cabelos cacheados com óleo de coco e argan',
    price: 45.90,
    image_url: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=400&fit=crop',
    link: 'https://example.com/produto1',
    created_at: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Condicionador Nutritivo',
    description: 'Condicionador rico em nutrientes para cachos definidos',
    price: 52.90,
    image_url: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=400&h=400&fit=crop',
    link: 'https://example.com/produto2',
    created_at: new Date().toISOString()
  },
  {
    id: '3',
    name: 'Máscara de Tratamento',
    description: 'Máscara intensiva para hidratação profunda',
    price: 68.90,
    image_url: 'https://images.unsplash.com/photo-1570554886111-e80fcca6a029?w=400&h=400&fit=crop',
    link: 'https://example.com/produto3',
    created_at: new Date().toISOString()
  },
  {
    id: '4',
    name: 'Creme para Pentear',
    description: 'Creme leave-in para definição e controle de frizz',
    price: 39.90,
    image_url: 'https://images.unsplash.com/photo-1571875257727-256c39da42af?w=400&h=400&fit=crop',
    link: 'https://example.com/produto4',
    created_at: new Date().toISOString()
  },
  {
    id: '5',
    name: 'Óleo Finalizador',
    description: 'Óleo de argan puro para brilho e maciez',
    price: 55.90,
    image_url: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&h=400&fit=crop',
    link: 'https://example.com/produto5',
    created_at: new Date().toISOString()
  },
  {
    id: '6',
    name: 'Gel Modelador',
    description: 'Gel para fixação e definição de cachos',
    price: 42.90,
    image_url: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=400&h=400&fit=crop',
    link: 'https://example.com/produto6',
    created_at: new Date().toISOString()
  }
]

export async function GET() {
  try {
    // Tentar conectar ao Supabase se as variáveis estiverem configuradas
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )

      const { data: products, error } = await supabase
        .from('store_products')
        .select('*')
        .order('created_at', { ascending: false })

      if (!error && products && products.length > 0) {
        return NextResponse.json({ products })
      }
    }

    // Retornar produtos mock se Supabase não estiver disponível ou não tiver produtos
    return NextResponse.json({ products: mockProducts })
  } catch (error) {
    console.error('Erro ao buscar produtos:', error)
    // Retornar produtos mock em caso de erro
    return NextResponse.json({ products: mockProducts })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, description, price, image_url, link } = body

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json(
        { error: 'Supabase não configurado' },
        { status: 500 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    const { data, error } = await supabase
      .from('store_products')
      .insert([{ name, description, price, image_url, link }])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, product: data })
  } catch (error) {
    console.error('Erro ao criar produto:', error)
    return NextResponse.json(
      { error: 'Erro ao criar produto' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, name, description, price, image_url, link } = body

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json(
        { error: 'Supabase não configurado' },
        { status: 500 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    const { data, error } = await supabase
      .from('store_products')
      .update({ name, description, price, image_url, link })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, product: data })
  } catch (error) {
    console.error('Erro ao atualizar produto:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar produto' },
      { status: 500 }
    )
  }
}
