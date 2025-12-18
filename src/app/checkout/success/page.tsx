'use client'

import { Suspense } from 'react'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Sparkles, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function CheckoutSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [updating, setUpdating] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    updateUserPaymentStatus()
  }, [])

  const updateUserPaymentStatus = async () => {
    try {
      setUpdating(true)
      console.log('🔄 Iniciando atualização do status de pagamento...')
      
      // Obter usuário autenticado
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        console.error('❌ Erro de autenticação:', authError)
        setError('Usuário não autenticado')
        setUpdating(false)
        return
      }

      console.log('✅ Usuário autenticado:', user.id)

      // 🔥 NOVO: Verificar se temos session_id do Stripe na URL
      const sessionId = searchParams.get('session_id')
      
      if (sessionId) {
        console.log('💳 Session ID do Stripe detectado:', sessionId)
        console.log('🔄 Chamando endpoint de confirmação do Stripe...')
        
        try {
          // Chamar o endpoint de confirmação do Stripe
          const confirmResponse = await fetch('/api/stripe-webhook/confirm', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ session_id: sessionId }),
          })

          const confirmData = await confirmResponse.json()

          if (confirmResponse.ok) {
            console.log('✅ Pagamento confirmado via Stripe:', confirmData)
          } else {
            console.error('⚠️ Erro ao confirmar via Stripe:', confirmData)
            // Continuar com atualização manual como fallback
          }
        } catch (stripeError) {
          console.error('⚠️ Erro ao chamar endpoint Stripe:', stripeError)
          // Continuar com atualização manual como fallback
        }
      } else {
        console.log('ℹ️ Session ID não encontrado na URL - usando atualização manual')
      }

      console.log('📝 Atualizando campo has_paid para true...')

      // Atualizar campo has_paid para true (fallback ou confirmação adicional)
      const { data: updateData, error: updateError } = await supabase
        .from('users')
        .update({ has_paid: true })
        .eq('id', user.id)
        .select()

      if (updateError) {
        console.error('❌ Erro ao atualizar status de pagamento:', updateError)
        console.error('Detalhes do erro:', JSON.stringify(updateError, null, 2))
        setError('Erro ao confirmar pagamento. Entre em contato com o suporte.')
        setUpdating(false)
        return
      }

      console.log('✅ Status de pagamento atualizado com sucesso!')
      console.log('📊 Dados atualizados:', updateData)

      // Verificar se a atualização foi bem-sucedida
      const { data: verifyData, error: verifyError } = await supabase
        .from('users')
        .select('has_paid')
        .eq('id', user.id)
        .single()

      if (verifyError) {
        console.error('❌ Erro ao verificar atualização:', verifyError)
      } else {
        console.log('🔍 Verificação: has_paid =', verifyData?.has_paid)
      }

      setUpdating(false)

      // Redirecionar automaticamente após 3 segundos
      console.log('⏳ Redirecionando para dashboard em 3 segundos...')
      setTimeout(() => {
        router.push('/dashboard')
      }, 3000)
    } catch (err) {
      console.error('❌ Erro ao processar pagamento:', err)
      setError('Erro inesperado. Tente novamente.')
      setUpdating(false)
    }
  }

  if (updating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 flex items-center justify-center px-4">
        <Card className="p-8 sm:p-12 text-center max-w-lg mx-auto">
          <Loader2 className="w-16 h-16 text-purple-600 mx-auto mb-4 animate-spin" />
          <h1 className="text-2xl font-bold mb-2 text-gray-800">
            Confirmando seu pagamento...
          </h1>
          <p className="text-gray-600">
            Aguarde enquanto processamos sua compra
          </p>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 flex items-center justify-center px-4">
        <Card className="p-8 sm:p-12 text-center max-w-lg mx-auto">
          <div className="mb-6">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">⚠️</span>
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold mb-4 text-red-600">
            Ops! Algo deu errado
          </h1>

          <p className="text-gray-700 mb-8">
            {error}
          </p>

          <div className="space-y-3">
            <Button 
              onClick={() => router.push('/dashboard')}
              className="w-full bg-gradient-to-r from-rose-300 to-purple-300 hover:from-rose-400 hover:to-purple-400 text-white text-lg py-6"
            >
              Tentar Acessar Dashboard
            </Button>

            <Link href="/">
              <Button variant="outline" className="w-full border-rose-200 text-rose-600 hover:bg-rose-50">
                Voltar para Home
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 flex items-center justify-center px-4">
      <Card className="p-8 sm:p-12 text-center max-w-lg mx-auto">
        <div className="mb-6">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
          <Sparkles className="w-12 h-12 text-purple-400 mx-auto animate-pulse" />
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold mb-4 bg-gradient-to-r from-rose-400 to-purple-400 bg-clip-text text-transparent">
          Pagamento Confirmado!
        </h1>

        <p className="text-lg text-gray-700 mb-2">
          Obrigada pela sua compra! 🎉
        </p>

        <p className="text-gray-600 mb-8">
          Seu pagamento foi processado com sucesso. Agora você pode usar a análise com IA 
          para descobrir tudo sobre seus cachos e receber recomendações personalizadas.
        </p>

        <div className="space-y-3">
          <Link href="/dashboard">
            <Button className="w-full bg-gradient-to-r from-rose-300 to-purple-300 hover:from-rose-400 hover:to-purple-400 text-white text-lg py-6">
              Ir para Dashboard
            </Button>
          </Link>

          <Link href="/">
            <Button variant="outline" className="w-full border-rose-200 text-rose-600 hover:bg-rose-50">
              Voltar para Home
            </Button>
          </Link>
        </div>

        <p className="text-sm text-gray-500 mt-6">
          Você será redirecionado automaticamente em alguns segundos...
        </p>
      </Card>
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 flex items-center justify-center px-4">
        <Card className="p-8 sm:p-12 text-center max-w-lg mx-auto">
          <Loader2 className="w-16 h-16 text-purple-600 mx-auto mb-4 animate-spin" />
          <h1 className="text-2xl font-bold mb-2 text-gray-800">
            Carregando...
          </h1>
        </Card>
      </div>
    }>
      <CheckoutSuccessContent />
    </Suspense>
  )
}
