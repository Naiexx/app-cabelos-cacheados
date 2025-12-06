'use client'

import { useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

// Carregar Stripe com a chave pública
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

function CheckoutForm() {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsProcessing(true)
    setErrorMessage('')

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success`,
        },
        redirect: 'if_required',
      })

      if (error) {
        setErrorMessage(error.message || 'Erro ao processar pagamento')
        setPaymentStatus('error')
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        setPaymentStatus('success')
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro inesperado')
      setPaymentStatus('error')
    } finally {
      setIsProcessing(false)
    }
  }

  if (paymentStatus === 'success') {
    return (
      <Card className="p-8 text-center max-w-md mx-auto">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2 text-gray-800">Pagamento Confirmado!</h2>
        <p className="text-gray-600 mb-6">
          Seu pagamento foi processado com sucesso. Você já pode usar a análise com IA!
        </p>
        <Link href="/dashboard">
          <Button className="w-full bg-gradient-to-r from-rose-300 to-purple-300 hover:from-rose-400 hover:to-purple-400 text-white">
            Ir para Dashboard
          </Button>
        </Link>
      </Card>
    )
  }

  if (paymentStatus === 'error') {
    return (
      <Card className="p-8 text-center max-w-md mx-auto">
        <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2 text-gray-800">Erro no Pagamento</h2>
        <p className="text-gray-600 mb-4">{errorMessage}</p>
        <Button
          onClick={() => setPaymentStatus('idle')}
          className="w-full bg-gradient-to-r from-rose-300 to-purple-300 hover:from-rose-400 hover:to-purple-400 text-white"
        >
          Tentar Novamente
        </Button>
      </Card>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto">
      <Card className="p-6 sm:p-8">
        <div className="flex items-center justify-center mb-6">
          <img 
            src="https://k6hrqrxuu8obbfwn.public.blob.vercel-storage.com/temp/e1451ac7-4bbf-4b7e-af1f-e8bf3d88dd8f.png" 
            alt="Curlara Logo" 
            className="h-12 w-auto object-contain" 
          />
        </div>

        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
          Finalizar Pagamento
        </h2>

        <div className="mb-6 p-4 bg-gradient-to-r from-rose-50 to-purple-50 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-gray-700 font-medium">Análise com IA</span>
            <span className="text-2xl font-bold text-rose-500">R$ 24,99</span>
          </div>
        </div>

        <div className="mb-6">
          <PaymentElement />
        </div>

        <Button
          type="submit"
          disabled={!stripe || isProcessing}
          className="w-full bg-gradient-to-r from-rose-300 to-purple-300 hover:from-rose-400 hover:to-purple-400 text-white text-lg py-6"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Processando...
            </>
          ) : (
            'Pagar R$ 24,99'
          )}
        </Button>

        <p className="text-xs text-gray-500 text-center mt-4">
          Pagamento seguro processado pela Stripe
        </p>
      </Card>
    </form>
  )
}

export default function CheckoutPage() {
  const [clientSecret, setClientSecret] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Criar Payment Intent ao carregar a página
    fetch('/api/stripe/create-payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount: 2499 }), // R$ 24,99
    })
      .then((res) => res.json())
      .then((data) => {
        setClientSecret(data.clientSecret)
        setLoading(false)
      })
      .catch((error) => {
        console.error('Erro ao criar Payment Intent:', error)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <img 
            src="https://k6hrqrxuu8obbfwn.public.blob.vercel-storage.com/temp/e1451ac7-4bbf-4b7e-af1f-e8bf3d88dd8f.png" 
            alt="Curlara Logo" 
            className="w-12 h-12 mx-auto mb-4 animate-pulse object-contain" 
          />
          <p className="text-gray-600">Carregando checkout...</p>
        </div>
      </div>
    )
  }

  if (!clientSecret) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md mx-auto">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2 text-gray-800">Erro ao Carregar</h2>
          <p className="text-gray-600 mb-6">
            Não foi possível inicializar o checkout. Tente novamente.
          </p>
          <Link href="/">
            <Button className="w-full bg-gradient-to-r from-rose-300 to-purple-300 hover:from-rose-400 hover:to-purple-400 text-white">
              Voltar para Home
            </Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 py-12 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-rose-400 to-purple-400 bg-clip-text text-transparent mb-2">
            Checkout Seguro
          </h1>
          <p className="text-gray-600">
            Complete seu pagamento para acessar a análise com IA
          </p>
        </div>

        <Elements
          stripe={stripePromise}
          options={{
            clientSecret,
            appearance: {
              theme: 'stripe',
              variables: {
                colorPrimary: '#f472b6',
                colorBackground: '#ffffff',
                colorText: '#1f2937',
                colorDanger: '#ef4444',
                fontFamily: 'system-ui, sans-serif',
                borderRadius: '8px',
              },
            },
          }}
        >
          <CheckoutForm />
        </Elements>
      </div>
    </div>
  )
}
