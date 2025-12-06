'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User, ArrowLeft, Save, Mail } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function SettingsPage() {
  const router = useRouter()
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  })

  useEffect(() => {
    // Verificar se usuário está logado
    const authToken = localStorage.getItem('authToken')
    const userData = localStorage.getItem('user')
    
    if (!authToken || !userData) {
      router.push('/login')
      return
    }

    const parsedUser = JSON.parse(userData)
    setUserEmail(parsedUser.email)
    
    // Carregar dados DIRETO do Supabase usando email (fonte única de verdade)
    loadUserDataFromSupabase(parsedUser.email)
  }, [router])

  const loadUserDataFromSupabase = async (email: string) => {
    try {
      console.log('🔍 Carregando dados do Supabase para email:', email)
      
      // Buscar dados da tabela user_profiles usando EMAIL
      const { data: userData, error: userError } = await supabase
        .from('user_profiles')
        .select('id, name, email, role, points')
        .eq('email', email)
        .single()

      if (userError) {
        console.error('❌ Erro ao buscar user_profiles:', userError)
        throw userError
      }

      console.log('✅ Dados carregados do Supabase:', userData)

      // Salvar o ID correto do banco
      setUserId(userData.id)

      // Atualizar formulário com dados do banco
      setFormData({
        name: userData.name || '',
        email: userData.email || ''
      })

      // Atualizar localStorage com dados reais do banco
      const updatedUser = {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        points: userData.points
      }
      localStorage.setItem('user', JSON.stringify(updatedUser))
      
    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error)
      setError('Erro ao carregar dados do perfil')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSuccess(false)
    setError('')

    console.log('💾 Iniciando atualização...')
    console.log('User ID:', userId)
    console.log('Dados a atualizar:', formData)

    try {
      // Atualizar dados na tabela user_profiles
      const { data: updateData, error: updateError } = await supabase
        .from('user_profiles')
        .update({
          name: formData.name,
          email: formData.email,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()

      console.log('📊 Resposta do Supabase:', { updateData, updateError })

      if (updateError) {
        console.error('❌ Erro ao atualizar:', updateError)
        throw updateError
      }

      console.log('✅ Dados atualizados no Supabase:', updateData)

      // Atualizar localStorage APENAS após confirmação do banco
      if (updateData && updateData.length > 0) {
        const updatedUser = {
          id: updateData[0].id,
          name: updateData[0].name,
          email: updateData[0].email,
          role: updateData[0].role,
          points: updateData[0].points
        }
        localStorage.setItem('user', JSON.stringify(updatedUser))
        console.log('✅ localStorage sincronizado com banco de dados')
      }
      
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (error: any) {
      console.error('❌ Erro ao salvar:', error)
      setError(error.message || 'Erro ao salvar alterações. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (!userId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-400 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-rose-600 hover:text-rose-700 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Voltar</span>
          </Link>
          <h1 className="text-xl font-bold bg-gradient-to-r from-rose-400 to-purple-400 bg-clip-text text-transparent">
            Configurações
          </h1>
          <div className="w-20"></div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="p-6 sm:p-8 bg-white shadow-xl">
          {/* Avatar Section */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-rose-300 to-purple-300 rounded-full flex items-center justify-center mb-4">
              <User className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">{formData.name || 'Carregando...'}</h2>
            <p className="text-gray-600">{formData.email || 'Carregando...'}</p>
          </div>

          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-center">
              ✓ Dados salvos com sucesso!
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center">
              ✗ {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nome */}
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2 text-gray-700">
                <User className="w-4 h-4 text-rose-400" />
                Nome Completo
              </Label>
              <Input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="Seu nome completo"
                className="border-gray-300 focus:border-rose-400 focus:ring-rose-400"
                required
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2 text-gray-700">
                <Mail className="w-4 h-4 text-rose-400" />
                E-mail
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="seu@email.com"
                className="border-gray-300 focus:border-rose-400 focus:ring-rose-400"
                required
              />
            </div>

            {/* Botão Salvar */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-rose-300 to-purple-300 hover:from-rose-400 hover:to-purple-400 text-white py-6 text-lg"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Salvando...
                </div>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
