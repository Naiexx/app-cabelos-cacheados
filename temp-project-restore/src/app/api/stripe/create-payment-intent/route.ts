import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
})

export async function POST(request: NextRequest) {
  try {
    const { amount } = await request.json()

    // Criar Payment Intent com valor de R$ 24,99 (2499 centavos)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount || 2499, // R$ 24,99 em centavos
      currency: 'brl',
      automatic_payment_methods: {
        enabled: true,
      },
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    })
  } catch (error: any) {
    console.error('Erro ao criar Payment Intent:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
