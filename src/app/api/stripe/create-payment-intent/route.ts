import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
})

// 🔥 Cliente Supabase com service role para autenticação
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(7)
  console.log(`\n💳 [${requestId}] ========== CRIAR PAYMENT INTENT ==========`)
  console.log(`🌍 [${requestId}] Ambiente: ${process.env.NODE_ENV}`)
  console.log(`🔗 [${requestId}] URL: ${request.url}`)
  
  try {
    const body = await request.json()
    const { amount, userId: bodyUserId } = body
    
    console.log(`📦 [${requestId}] Body recebido:`, { amount, userId: bodyUserId })

    // 🔥 PRIORIDADE 1: userId vindo do body (mais confiável)
    let userId: string | null = bodyUserId || null
    let userEmail: string | null = null

    // 🔥 MÉTODO 2: Tentar obter userId do cookie authToken
    if (!userId) {
      const cookieHeader = request.headers.get('cookie')
      console.log(`🍪 [${requestId}] Cookies:`, cookieHeader ? 'Presentes' : 'Ausentes')

      if (cookieHeader) {
        const authTokenMatch = cookieHeader.match(/authToken=([^;]+)/)
        if (authTokenMatch) {
          const token = authTokenMatch[1]
          console.log(`🔑 [${requestId}] Token encontrado no cookie`)
          
          try {
            const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
            if (user && !error) {
              userId = user.id
              userEmail = user.email || null
              console.log(`✅ [${requestId}] Usuário via cookie:`, { userId, userEmail })
            } else {
              console.log(`⚠️ [${requestId}] Erro ao obter usuário:`, error)
            }
          } catch (err) {
            console.log(`⚠️ [${requestId}] Erro ao processar token:`, err)
          }
        }
      }
    }

    // 🔥 MÉTODO 3: Tentar obter do header Authorization
    if (!userId) {
      const authHeader = request.headers.get('authorization')
      console.log(`🔐 [${requestId}] Authorization header:`, authHeader ? 'Presente' : 'Ausente')
      
      if (authHeader) {
        const token = authHeader.replace('Bearer ', '')
        try {
          const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
          if (user && !error) {
            userId = user.id
            userEmail = user.email || null
            console.log(`✅ [${requestId}] Usuário via header:`, { userId, userEmail })
          }
        } catch (err) {
          console.log(`⚠️ [${requestId}] Erro ao processar token do header:`, err)
        }
      }
    }

    console.log(`🔑 [${requestId}] UserId FINAL:`, userId || '❌ NÃO DETECTADO')
    console.log(`📧 [${requestId}] Email FINAL:`, userEmail || '❌ NÃO DETECTADO')

    // 🔥 CRÍTICO: Se não temos userId, retornar erro
    if (!userId) {
      console.error(`❌ [${requestId}] ERRO CRÍTICO: userId não detectado`)
      console.error(`💡 [${requestId}] Envie o userId no body da requisição: { amount, userId }`)
    }

    // Criar Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount || 2499, // R$ 24,99 em centavos
      currency: 'brl',
      automatic_payment_methods: {
        enabled: true,
      },
      // 🔥 CRÍTICO: Adicionar userId e email aos metadados
      metadata: {
        userId: userId || 'unknown',
        userEmail: userEmail || 'unknown',
        environment: process.env.NODE_ENV || 'unknown',
        timestamp: new Date().toISOString(),
      },
      // 🔥 Adicionar email para recibo (se disponível)
      receipt_email: userEmail || undefined,
      // 🔥 Descrição do produto
      description: 'Análise de Cabelos com IA - Curlara',
    })

    console.log(`✅ [${requestId}] Payment Intent criado:`, {
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      metadata: paymentIntent.metadata,
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      userId: userId || 'unknown',
      warning: !userId ? 'userId não detectado - webhook pode falhar' : undefined,
    })
  } catch (error: any) {
    console.error(`❌ [${requestId}] Erro ao criar Payment Intent:`, error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
