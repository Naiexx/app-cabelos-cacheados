import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
})

export async function POST(req: NextRequest) {
  try {
    const { priceId } = await req.json()

    // Criar sessão de checkout com UI mode 'embedded'
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      ui_mode: 'embedded',
      payment_method_types: ['card'],
      line_items: priceId
        ? [
            {
              price: priceId,
              quantity: 1,
            },
          ]
        : [
            {
              price_data: {
                currency: 'brl',
                product_data: {
                  name: 'Análise Completa de Cachos com IA',
                  description: 'Análise detalhada, rotina personalizada e recomendações de produtos',
                  images: ['https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=400'],
                },
                unit_amount: 2499, // R$ 24,99 em centavos
              },
              quantity: 1,
            },
          ],
      mode: 'payment',
      return_url: `${req.headers.get('origin')}/analysis?success=true&session_id={CHECKOUT_SESSION_ID}`,
      metadata: {
        type: 'hair_analysis',
      },
    }

    const session = await stripe.checkout.sessions.create(sessionParams)

    return NextResponse.json({ clientSecret: session.client_secret })
  } catch (error: any) {
    console.error('Erro ao criar sessão de checkout:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao criar sessão de checkout' },
      { status: 500 }
    )
  }
}
