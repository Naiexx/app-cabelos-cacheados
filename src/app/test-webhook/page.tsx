'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'

export default function TestWebhookPage() {
  const [userId, setUserId] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleTest = async () => {
    if (!userId.trim()) {
      setError('Por favor, insira um User ID válido')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/stripe-webhook/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: userId.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Erro ao testar webhook')
      } else {
        setResult(data)
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao conectar com o servidor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">🧪 Teste do Webhook do Stripe</CardTitle>
            <CardDescription>
              Simule o webhook do Stripe para testar se a atualização do banco está funcionando
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Instruções */}
            <Alert>
              <AlertDescription>
                <strong>Como obter seu User ID:</strong>
                <ol className="list-decimal list-inside mt-2 space-y-1">
                  <li>Faça login na aplicação</li>
                  <li>Abra o console do navegador (F12)</li>
                  <li>Digite: <code className="bg-gray-100 px-2 py-1 rounded">localStorage.getItem('userId')</code></li>
                  <li>Copie o ID e cole abaixo</li>
                </ol>
              </AlertDescription>
            </Alert>

            {/* Input do User ID */}
            <div className="space-y-2">
              <label htmlFor="userId" className="text-sm font-medium">
                User ID
              </label>
              <Input
                id="userId"
                type="text"
                placeholder="50a2da9c-a717-480a-87a9-5e748d1e2630"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                disabled={loading}
              />
            </div>

            {/* Botão de teste */}
            <Button
              onClick={handleTest}
              disabled={loading || !userId.trim()}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testando...
                </>
              ) : (
                '🚀 Testar Webhook'
              )}
            </Button>

            {/* Resultado de erro */}
            {error && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Erro:</strong> {error}
                </AlertDescription>
              </Alert>
            )}

            {/* Resultado de sucesso */}
            {result && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription>
                  <strong className="text-green-800">✅ Sucesso!</strong>
                  <div className="mt-2 space-y-1 text-sm text-green-700">
                    <p>User ID: {result.userId}</p>
                    <p>Subscrição válida até: {new Date(result.subscriptionEndDate).toLocaleDateString('pt-PT')}</p>
                  </div>
                  
                  {result.updates && (
                    <details className="mt-3">
                      <summary className="cursor-pointer text-sm font-medium">Ver detalhes técnicos</summary>
                      <pre className="mt-2 p-3 bg-white rounded text-xs overflow-auto">
                        {JSON.stringify(result, null, 2)}
                      </pre>
                    </details>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* Informações adicionais */}
            <div className="text-sm text-gray-600 space-y-2 pt-4 border-t">
              <p><strong>O que este teste faz:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Atualiza <code>is_subscriber</code> para <code>true</code></li>
                <li>Atualiza <code>has_paid</code> para <code>true</code></li>
                <li>Define <code>subscription_end_date</code> para daqui a 1 mês</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
