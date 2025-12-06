import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2024-12-18.acacia',
})

// Criar cliente Supabase com valores padrão para evitar erro no build
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key'

const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(req: NextRequest) {
  try {
    // Verificar se as variáveis de ambiente estão configuradas em runtime
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Stripe não configurado. Configure STRIPE_SECRET_KEY nas variáveis de ambiente.' },
        { status: 500 }
      )
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'Supabase não configurado. Configure as variáveis de ambiente do Supabase.' },
        { status: 500 }
      )
    }

    const { sessionId } = await req.json()

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID é obrigatório' },
        { status: 400 }
      )
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId)

    // Se pagamento foi concluído, atualizar has_paid no Supabase
    if (session.payment_status === 'paid') {
      const customerEmail = session.customer_details?.email

      if (customerEmail) {
        // Buscar usuário pelo email
        const { data: userData, error: fetchError } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('email', customerEmail)
          .single()

        if (fetchError) {
          console.error('Erro ao buscar usuário:', fetchError)
        } else if (userData) {
          // Atualizar has_paid para true
          const { error: updateError } = await supabase
            .from('user_profiles')
            .update({ has_paid: true })
            .eq('id', userData.id)

          if (updateError) {
            console.error('Erro ao atualizar has_paid:', updateError)
          } else {
            console.log('✅ has_paid atualizado para true no Supabase')
          }
        }
      }
    }

    return NextResponse.json({
      paid: session.payment_status === 'paid',
      status: session.payment_status,
      customerEmail: session.customer_details?.email,
    })
  } catch (error: any) {
    console.error('Erro ao verificar pagamento:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao verificar pagamento' },
      { status: 500 }
    )
  }
}
