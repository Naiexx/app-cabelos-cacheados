import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
})

export async function POST(req: NextRequest) {
  try {
    const { priceId, customerEmail, customerName } = await req.json()

    console.log('🔍 Criando checkout com Price ID:', priceId)

    // 🔥 VALIDAR PRICE ID
    if (!priceId || typeof priceId !== 'string') {
      throw new Error('Price ID inválido ou não fornecido')
    }

    // Criar sessão de checkout com UI mode 'embedded'
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      ui_mode: 'embedded',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId, // 🔥 USAR PRICE ID FORNECIDO PELO FRONTEND
          quantity: 1,
        },
      ],
      mode: 'subscription', // 🔥 CORRIGIDO: subscription para preços recorrentes
      return_url: `${req.headers.get('origin')}/analysis?success=true&session_id={CHECKOUT_SESSION_ID}`,
      customer_email: customerEmail,
      metadata: {
        type: 'hair_analysis',
        customer_name: customerName,
        customer_email: customerEmail,
      },
    }

    console.log('📝 Criando sessão Stripe com params:', {
      priceId,
      customerEmail,
      customerName
    })

    const session = await stripe.checkout.sessions.create(sessionParams)

    console.log('✅ Sessão criada com sucesso:', session.id)

    return NextResponse.json({ clientSecret: session.client_secret })
  } catch (error: any) {
    console.error('❌ Erro ao criar sessão de checkout:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao criar sessão de checkout' },
      { status: 500 }
    )
  }
}
