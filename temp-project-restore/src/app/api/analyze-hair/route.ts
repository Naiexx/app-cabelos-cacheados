import { NextRequest, NextResponse } from 'next/server'
import { analyzeHairPhoto } from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { imageUrl } = body

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'URL da imagem é obrigatória' },
        { status: 400 }
      )
    }

    // Validar formato da imagem (deve ser base64 data URL)
    if (!imageUrl.startsWith('data:image/')) {
      return NextResponse.json(
        { error: 'Formato de imagem inválido. Use uma imagem em base64.' },
        { status: 400 }
      )
    }

    console.log('Iniciando análise da foto...')
    const analysis = await analyzeHairPhoto(imageUrl)
    console.log('Análise concluída com sucesso!')

    // SEMPRE retornar JSON válido
    return NextResponse.json(analysis, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch (error: any) {
    console.error('Erro na análise:', error)
    
    // Retornar JSON de erro, NUNCA HTML
    const errorMessage = error.message || 'Erro ao analisar a foto'
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  }
}
