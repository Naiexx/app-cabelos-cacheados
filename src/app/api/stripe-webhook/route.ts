import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabase } from '@/lib/supabase'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const signature = req.headers.get('stripe-signature')!

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err: any) {
      console.error('Erro na verificação do webhook:', err.message)
      return NextResponse.json(
        { error: `Webhook Error: ${err.message}` },
        { status: 400 }
      )
    }

    // Processar evento checkout.session.completed
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session

      const userId = session.metadata?.userId
      const customerId = session.customer as string

      if (!userId) {
        console.error('userId não encontrado nos metadados da sessão')
        return NextResponse.json({ error: 'userId ausente' }, { status: 400 })
      }

      // Calcular data de fim da subscrição (1 mês a partir de agora)
      const subscriptionEndDate = new Date()
      subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1)

      // Atualizar usuário no Supabase
      const { error } = await supabase
        .from('user_profiles')
        .update({
          is_subscriber: true,
          subscription_end_date: subscriptionEndDate.toISOString(),
          stripe_customer_id: customerId,
        })
        .eq('id', userId)

      if (error) {
        console.error('Erro ao atualizar usuário:', error)
        return NextResponse.json(
          { error: 'Erro ao atualizar usuário' },
          { status: 500 }
        )
      }

      console.log(`✅ Subscrição ativada para usuário ${userId}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Erro no webhook:', error)
    return NextResponse.json(
      { error: error.message || 'Erro no webhook' },
      { status: 500 }
    )
  }
}
