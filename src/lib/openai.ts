import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export type HairAnalysisResult = {
  curl_pattern: string
  texture: string
  density: string
  porosity: string
  health_score: number
  damage_alerts: string[]
  recommendations: {
    products: string[]
    techniques: string[]
    frequency: {
      wash: string
      hydration: string
      treatment: string
    }
  }
  detailed_analysis: string
}

export async function analyzeHairPhoto(imageUrl: string): Promise<HairAnalysisResult> {
  try {
    // Validar se a API Key existe
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY não configurada')
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `Você é um especialista em análise capilar para cabelos cacheados e crespos. 
          Analise a foto do cabelo e forneça uma avaliação detalhada em formato JSON com:
          - curl_pattern (padrão de cacho: 2A, 2B, 2C, 3A, 3B, 3C, 4A, 4B, 4C)
          - texture (textura: fino, médio, grosso)
          - density (densidade: baixa, média, alta)
          - porosity (porosidade: baixa, média, alta)
          - health_score (pontuação de saúde de 0-100)
          - damage_alerts (array de alertas de dano como ressecamento, quebra, pontas duplas)
          - recommendations (objeto com products array, techniques array, e frequency objeto com wash, hydration, treatment)
          - detailed_analysis (análise detalhada em português)
          
          Seja preciso, profissional e empático na análise.`
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Analise esta foto de cabelo e forneça uma avaliação completa em JSON.'
            },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
                detail: 'high'
              }
            }
          ]
        }
      ],
      response_format: { type: 'json_object' },
      max_tokens: 2000,
    })

    const content = response.choices[0].message.content
    if (!content) {
      throw new Error('Resposta vazia da OpenAI')
    }

    const result = JSON.parse(content)
    
    // Validar estrutura do resultado
    if (!result.curl_pattern || !result.texture || !result.health_score) {
      throw new Error('Resposta da IA incompleta')
    }

    return result as HairAnalysisResult
  } catch (error: any) {
    console.error('Erro detalhado ao analisar foto:', error)
    
    // Mensagens de erro mais específicas
    if (error.message?.includes('API key')) {
      throw new Error('Erro de autenticação com a OpenAI. Verifique a API Key.')
    }
    if (error.message?.includes('quota')) {
      throw new Error('Limite de uso da API OpenAI atingido.')
    }
    if (error.message?.includes('invalid_image')) {
      throw new Error('Formato de imagem inválido. Tente outra foto.')
    }
    
    throw new Error('Não foi possível analisar a foto. Tente novamente.')
  }
}

export async function generatePersonalizedRoutine(
  analysis: HairAnalysisResult,
  userGoals: string
): Promise<any> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `Você é um especialista em cuidados capilares para cabelos cacheados.
          Crie uma rotina personalizada baseada na análise do cabelo e nos objetivos do usuário.
          Retorne em formato JSON com rotinas diárias, semanais e mensais.`
        },
        {
          role: 'user',
          content: `Análise do cabelo: ${JSON.stringify(analysis)}
          Objetivos: ${userGoals}
          
          Crie uma rotina completa e personalizada.`
        }
      ],
      response_format: { type: 'json_object' },
      max_tokens: 2000,
    })

    return JSON.parse(response.choices[0].message.content || '{}')
  } catch (error) {
    console.error('Erro ao gerar rotina:', error)
    throw new Error('Não foi possível gerar a rotina personalizada.')
  }
}
