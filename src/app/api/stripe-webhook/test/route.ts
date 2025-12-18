import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * 🧪 ENDPOINT DE TESTE - Simula o webhook do Stripe
 * 
 * Use este endpoint para testar se a lógica de atualização do banco está funcionando
 * sem precisar fazer um pagamento real.
 * 
 * Como usar:
 * 1. Faça um POST para /api/stripe-webhook/test
 * 2. Passe o userId no body: { "userId": "seu-user-id" }
 * 3. Verifique se o banco foi atualizado corretamente
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'userId é obrigatório' },
        { status: 400 }
      )
    }

    console.log('🧪 [TEST] Simulando webhook para userId:', userId)

    // Calcular data de fim da subscrição (1 mês a partir de agora)
    const subscriptionEndDate = new Date()
    subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1)

    console.log('🔄 [TEST] Atualizando banco de dados...')
    
    // 1. Atualizar user_profiles
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .update({
        is_subscriber: true,
        has_paid: true,
        subscription_end_date: subscriptionEndDate.toISOString(),
      })
      .eq('id', userId)
      .select()

    if (profileError) {
      console.error('❌ [TEST] Erro ao atualizar user_profiles:', profileError)
      return NextResponse.json(
        { 
          error: 'Erro ao atualizar user_profiles',
          details: profileError 
        },
        { status: 500 }
      )
    }

    console.log('✅ [TEST] user_profiles atualizado:', profileData)

    // 2. Atualizar tabela users (se existir)
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .update({
        has_paid: true,
      })
      .eq('id', userId)
      .select()

    if (usersError) {
      console.log('⚠️ [TEST] Tabela users pode não existir:', usersError)
    } else {
      console.log('✅ [TEST] Tabela users atualizada:', usersData)
    }

    return NextResponse.json({
      success: true,
      message: '✅ Teste concluído com sucesso!',
      userId,
      subscriptionEndDate: subscriptionEndDate.toISOString(),
      updates: {
        user_profiles: profileData,
        users: usersData,
      },
    })
  } catch (error: any) {
    console.error('❌ [TEST] Erro:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  return NextResponse.json({
    message: '🧪 Endpoint de teste do webhook',
    instructions: {
      method: 'POST',
      body: {
        userId: 'seu-user-id-aqui',
      },
      description: 'Simula o webhook do Stripe para testar a atualização do banco',
    },
  })
}
