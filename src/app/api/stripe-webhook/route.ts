import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabase } from '@/lib/supabase'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

// 🔥 CONFIGURAÇÃO CRÍTICA: Desabilitar body parsing para webhooks
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// 🔥 GET para teste de acessibilidade - DIAGNÓSTICO COMPLETO
export async function GET(req: NextRequest) {
  console.log('🔍 GET request recebido no webhook endpoint')
  
  const diagnostics = {
    status: 'ok',
    message: '✅ Webhook endpoint está ATIVO e ACESSÍVEL',
    timestamp: new Date().toISOString(),
    environment: {
      hasWebhookSecret: !!webhookSecret,
      hasStripeKey: !!process.env.STRIPE_SECRET_KEY,
      webhookSecretPrefix: webhookSecret ? webhookSecret.substring(0, 10) + '...' : '❌ AUSENTE',
      stripeKeyPrefix: process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.substring(0, 10) + '...' : '❌ AUSENTE',
    },
    instructions: {
      step1: '📍 URL do webhook: https://curlara.lasy.pro/api/stripe-webhook',
      step2: '🔧 No painel do Stripe: Developers > Webhooks > Add endpoint',
      step3: '📋 Cole a URL acima',
      step4: '✅ Selecione o evento: payment_intent.succeeded',
      step5: '🔑 Copie o "Signing secret" (whsec_...) e adicione como STRIPE_WEBHOOK_SECRET',
      step6: '🧪 TESTE: Use /api/stripe-webhook/test para simular webhook',
      step7: '💳 Faça um pagamento de teste no Stripe',
      step8: '📊 Verifique os logs no painel do Stripe em "Webhooks > [seu webhook] > Logs"',
      note: '⚠️ IMPORTANTE: O Stripe SÓ envia webhooks quando eventos REAIS acontecem (pagamentos, etc)',
    },
    troubleshooting: {
      zeroDeliveries: 'Se o Stripe mostra "0 entregas", significa que nenhum evento foi disparado ainda. Faça um pagamento de teste.',
      testWebhook: 'Use o botão "Send test webhook" no painel do Stripe para enviar um evento de teste',
      checkLogs: 'Verifique os logs do webhook no painel do Stripe para ver se há erros de entrega',
      verifyUrl: 'Certifique-se de que a URL está correta e acessível publicamente',
    },
  }
  
  return NextResponse.json(diagnostics, { 
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, stripe-signature',
    }
  })
}

// 🔥 OPTIONS para CORS
export async function OPTIONS(req: NextRequest) {
  return NextResponse.json({}, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, stripe-signature',
    }
  })
}

export async function POST(req: NextRequest) {
  const requestId = Math.random().toString(36).substring(7)
  console.log(`\n🔔 [${requestId}] ========== WEBHOOK RECEBIDO ==========`)
  console.log(`📍 [${requestId}] URL:`, req.url)
  console.log(`🕐 [${requestId}] Timestamp:`, new Date().toISOString())
  
  try {
    const body = await req.text()
    console.log(`📦 [${requestId}] Body length:`, body.length)
    
    const signature = req.headers.get('stripe-signature')

    if (!signature) {
      console.log(`⚠️ [${requestId}] ❌ Requisição sem signature do Stripe`)
      console.log(`💡 [${requestId}] Isso significa que a requisição NÃO veio do Stripe`)
      console.log(`🔍 [${requestId}] Headers recebidos:`, Object.fromEntries(req.headers.entries()))
      
      return NextResponse.json(
        { 
          error: 'Stripe signature ausente',
          requestId,
          hint: 'Esta requisição não veio do Stripe. Verifique se o webhook está configurado corretamente no painel do Stripe.',
        },
        { status: 400 }
      )
    }

    console.log(`✅ [${requestId}] Signature presente:`, signature.substring(0, 30) + '...')

    if (!webhookSecret) {
      console.error(`❌ [${requestId}] STRIPE_WEBHOOK_SECRET não configurado`)
      return NextResponse.json(
        { 
          error: 'Webhook secret não configurado',
          requestId,
          hint: 'Configure STRIPE_WEBHOOK_SECRET nas variáveis de ambiente'
        },
        { status: 500 }
      )
    }

    console.log(`✅ [${requestId}] Webhook secret configurado`)

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
      console.log(`✅ [${requestId}] ========== EVENTO VERIFICADO ==========`)
      console.log(`📋 [${requestId}] Tipo do evento: ${event.type}`)
      console.log(`🆔 [${requestId}] Event ID: ${event.id}`)
      console.log(`🕐 [${requestId}] Event created: ${new Date(event.created * 1000).toISOString()}`)
    } catch (err: any) {
      console.error(`❌ [${requestId}] ========== ERRO NA VERIFICAÇÃO ==========`)
      console.error(`❌ [${requestId}] Erro:`, err.message)
      console.error(`💡 [${requestId}] Possíveis causas:`)
      console.error(`   1. STRIPE_WEBHOOK_SECRET incorreto`)
      console.error(`   2. Webhook secret de ambiente diferente (test vs live)`)
      console.error(`   3. Body da requisição foi modificado`)
      return NextResponse.json(
        { 
          error: `Webhook Error: ${err.message}`,
          requestId,
          hint: 'Verifique se o STRIPE_WEBHOOK_SECRET está correto e corresponde ao ambiente (test/live)'
        },
        { status: 400 }
      )
    }

    // 🔥 PROCESSAR payment_intent.succeeded (PRINCIPAL)
    if (event.type === 'payment_intent.succeeded') {
      console.log(`💳 [${requestId}] ========== PROCESSANDO PAGAMENTO ==========`)
      const paymentIntent = event.data.object as Stripe.PaymentIntent

      const userId = paymentIntent.metadata?.userId
      const customerEmail = paymentIntent.receipt_email

      console.log(`📦 [${requestId}] Dados do Payment Intent:`)
      console.log(`   - Payment Intent ID: ${paymentIntent.id}`)
      console.log(`   - User ID: ${userId}`)
      console.log(`   - Email: ${customerEmail}`)
      console.log(`   - Amount: R$ ${(paymentIntent.amount / 100).toFixed(2)}`)
      console.log(`   - Status: ${paymentIntent.status}`)
      console.log(`   - Metadata completo:`, paymentIntent.metadata)

      if (!userId || userId === 'unknown') {
        console.error(`❌ [${requestId}] userId não encontrado nos metadados do Payment Intent`)
        console.error(`💡 [${requestId}] Verifique se o userId está sendo passado ao criar o Payment Intent`)
        console.error(`📋 [${requestId}] Metadata recebido:`, paymentIntent.metadata)
        
        // Tentar atualizar por email se disponível
        if (customerEmail) {
          console.log(`🔄 [${requestId}] Tentando atualizar por email: ${customerEmail}`)
          
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id')
            .eq('email', customerEmail)
            .single()

          if (userData && !userError) {
            console.log(`✅ [${requestId}] Usuário encontrado por email:`, userData.id)
            
            // Atualizar com o userId encontrado
            const subscriptionEndDate = new Date()
            subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1)

            await supabase
              .from('user_profiles')
              .update({
                is_subscriber: true,
                has_paid: true,
                subscription_end_date: subscriptionEndDate.toISOString(),
              })
              .eq('id', userData.id)

            await supabase
              .from('users')
              .update({ has_paid: true })
              .eq('id', userData.id)

            console.log(`✅ [${requestId}] Banco atualizado via email`)
            
            return NextResponse.json({ 
              received: true,
              requestId,
              eventType: event.type,
              message: 'Pagamento processado via email'
            }, { status: 200 })
          }
        }
        
        return NextResponse.json({ 
          error: 'userId ausente',
          requestId,
          paymentIntentId: paymentIntent.id,
          hint: 'O userId deve ser passado nos metadados ao criar o Payment Intent'
        }, { status: 400 })
      }

      // Calcular data de fim da subscrição (1 mês a partir de agora)
      const subscriptionEndDate = new Date()
      subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1)

      console.log(`🔄 [${requestId}] Atualizando banco de dados...`)
      console.log(`   - User ID: ${userId}`)
      console.log(`   - Subscription end: ${subscriptionEndDate.toISOString()}`)
      
      // 1. Atualizar user_profiles (tabela original)
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
        console.error(`❌ [${requestId}] Erro ao atualizar user_profiles:`, profileError)
      } else {
        console.log(`✅ [${requestId}] user_profiles atualizado:`, profileData)
      }

      // 2. Atualizar tabela users (usada pelo middleware)
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .update({
          has_paid: true,
        })
        .eq('id', userId)
        .select()

      if (usersError) {
        console.log(`⚠️ [${requestId}] Tabela users pode não existir:`, usersError)
      } else {
        console.log(`✅ [${requestId}] Tabela users atualizada:`, usersData)
      }

      // 3. Se temos email, tentar atualizar por email também
      if (customerEmail) {
        const { data: emailData, error: emailError } = await supabase
          .from('users')
          .update({
            has_paid: true,
          })
          .eq('email', customerEmail)
          .select()
        
        if (!emailError) {
          console.log(`✅ [${requestId}] Atualização por email:`, emailData)
        }
      }

      console.log(`✅ [${requestId}] ========== PAGAMENTO PROCESSADO COM SUCESSO ==========`)
    }
    
    // Processar evento checkout.session.completed (FALLBACK)
    else if (event.type === 'checkout.session.completed') {
      console.log(`💳 [${requestId}] ========== PROCESSANDO CHECKOUT SESSION ==========`)
      const session = event.data.object as Stripe.Checkout.Session

      const userId = session.metadata?.userId
      const customerId = session.customer as string
      const customerEmail = session.customer_details?.email

      console.log(`📦 [${requestId}] Dados da sessão:`)
      console.log(`   - Session ID: ${session.id}`)
      console.log(`   - User ID: ${userId}`)
      console.log(`   - Customer ID: ${customerId}`)
      console.log(`   - Email: ${customerEmail}`)

      if (!userId) {
        console.error(`❌ [${requestId}] userId não encontrado nos metadados da sessão`)
        return NextResponse.json({ 
          error: 'userId ausente',
          requestId,
          sessionId: session.id 
        }, { status: 400 })
      }

      // Calcular data de fim da subscrição (1 mês a partir de agora)
      const subscriptionEndDate = new Date()
      subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1)

      console.log(`🔄 [${requestId}] Atualizando banco de dados...`)
      
      // 1. Atualizar user_profiles (tabela original)
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
      } else {
        console.log(`✅ [${requestId}] user_profiles atualizado com sucesso`)
      }

      // 2. Atualizar tabela users (usada pelo middleware)
      const { error: usersError } = await supabase
        .from('users')
        .update({
          has_paid: true,
        })
        .eq('id', userId)

      if (usersError) {
        console.log(`⚠️ [${requestId}] Tabela users pode não existir - continuando...`)
      } else {
        console.log(`✅ [${requestId}] Tabela users atualizada com sucesso`)
      }

      // 3. Se temos email mas não userId, tentar atualizar por email
      if (customerEmail && !profileError) {
        const { error: emailUpdateError } = await supabase
          .from('users')
          .update({
            has_paid: true,
          })
          .eq('email', customerEmail)

        if (!emailUpdateError) {
          console.log(`✅ [${requestId}] Tabela users atualizada por email: ${customerEmail}`)
        }
      }

      console.log(`✅ [${requestId}] ========== CHECKOUT PROCESSADO COM SUCESSO ==========`)
    } else {
      console.log(`ℹ️ [${requestId}] Evento ${event.type} recebido mas não processado`)
      console.log(`💡 [${requestId}] Eventos processados: payment_intent.succeeded, checkout.session.completed`)
    }

    return NextResponse.json({ 
      received: true,
      requestId,
      eventType: event.type,
      eventId: event.id,
      message: 'Evento processado com sucesso'
    }, { status: 200 })
  } catch (error: any) {
    console.error(`❌ [${requestId}] ========== ERRO NO WEBHOOK ==========`)
    console.error(`❌ [${requestId}] Erro:`, error)
    console.error(`❌ [${requestId}] Stack:`, error.stack)
    return NextResponse.json(
      { 
        error: error.message || 'Erro no webhook',
        requestId,
      },
      { status: 500 }
    )
  }
}
