import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabase } from '@/lib/supabase'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
})

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// 🔥 ENDPOINT PARA CONFIRMAR PAGAMENTO MANUALMENTE
// Use este endpoint após o checkout ser concluído
export async function POST(req: NextRequest) {
  const requestId = Math.random().toString(36).substring(7)
  console.log(`\n✅ [${requestId}] Confirmação manual de pagamento iniciada`)

  try {
    const { session_id } = await req.json()

    if (!session_id) {
      return NextResponse.json(
        { error: 'session_id é obrigatório' },
        { status: 400 }
      )
    }

    console.log(`🔍 [${requestId}] Buscando sessão no Stripe: ${session_id}`)

    // Buscar a sessão no Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id)

    console.log(`📦 [${requestId}] Sessão encontrada:`, {
      id: session.id,
      status: session.status,
      payment_status: session.payment_status,
      userId: session.metadata?.userId,
    })

    // Verificar se o pagamento foi concluído
    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { 
          error: 'Pagamento não concluído',
          payment_status: session.payment_status,
        },
        { status: 400 }
      )
    }

    const userId = session.metadata?.userId
    const customerId = session.customer as string
    const customerEmail = session.customer_details?.email

    if (!userId) {
      return NextResponse.json(
        { error: 'userId não encontrado nos metadados' },
        { status: 400 }
      )
    }

    // Calcular data de fim da subscrição
    const subscriptionEndDate = new Date()
    subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1)

    console.log(`🔄 [${requestId}] Atualizando banco de dados para userId: ${userId}`)

    // Atualizar user_profiles
    const { error: profileError } = await supabase
      .from('user_profiles')
      .update({
        is_subscriber: true,
        has_paid: true,
        subscription_end_date: subscriptionEndDate.toISOString(),
        stripe_customer_id: customerId,
      })
      .eq('id', userId)

    if (profileError) {
      console.error(`❌ [${requestId}] Erro ao atualizar user_profiles:`, profileError)
      return NextResponse.json(
        { error: 'Erro ao atualizar perfil', details: profileError },
        { status: 500 }
      )
    }

    console.log(`✅ [${requestId}] user_profiles atualizado`)

    // Atualizar tabela users
    const { error: usersError } = await supabase
      .from('users')
      .update({
        has_paid: true,
      })
      .eq('id', userId)

    if (!usersError) {
      console.log(`✅ [${requestId}] Tabela users atualizada`)
    }

    // Atualizar por email se disponível
    if (customerEmail) {
      await supabase
        .from('users')
        .update({
          has_paid: true,
        })
        .eq('email', customerEmail)
    }

    console.log(`✅ [${requestId}] Pagamento confirmado com sucesso!`)

    return NextResponse.json({
      success: true,
      message: 'Pagamento confirmado e usuário atualizado',
      userId,
      subscriptionEndDate: subscriptionEndDate.toISOString(),
    })

  } catch (error: any) {
    console.error(`❌ [${requestId}] Erro:`, error)
    return NextResponse.json(
      { error: error.message || 'Erro ao confirmar pagamento' },
      { status: 500 }
    )
  }
}

// GET para instruções
export async function GET() {
  return NextResponse.json({
    message: 'Endpoint de confirmação manual de pagamento',
    usage: {
      method: 'POST',
      body: {
        session_id: 'cs_test_...',
      },
      description: 'Chame este endpoint após o checkout ser concluído para atualizar o status do usuário',
    },
    example: `
      // No seu código frontend, após o checkout:
      const response = await fetch('/api/stripe-webhook/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId })
      })
    `,
  })
}
