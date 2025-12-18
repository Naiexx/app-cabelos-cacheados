'use client'

import { useState, useRef, useEffect, Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Camera, Upload, Loader2, Sparkles, CheckCircle, AlertCircle, X, ChevronRight, User } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { loadStripe } from '@stripe/stripe-js'
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js'
import { supabase } from '@/lib/supabase'

// Inicializar Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')

type AnalysisResult = {
  curl_pattern: string
  texture: string
  density: string
  porosity: string
  health_score: number
  damage_alerts: string[]
  recommendations: {
    products: string[]
    techniques: string[]
    frequency: {
      wash: string
      hydration: string
      treatment: string
    }
  }
  detailed_analysis: string
}

type QuizAnswers = {
  curlType: string
  hairDensity: string
  porosity: string
  mainConcern: string
  currentRoutine: string
}

// Componente interno que usa useSearchParams
function AnalysisContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showCheckout, setShowCheckout] = useState(false)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [hasPaid, setHasPaid] = useState(false)
  const [isCheckingPayment, setIsCheckingPayment] = useState(false)
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null)
  
  // 🔥 Estados para identificação do usuário
  const [userName, setUserName] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [showNameForm, setShowNameForm] = useState(true)
  
  // Estados do Quiz
  const [showQuiz, setShowQuiz] = useState(false)
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [quizAnswers, setQuizAnswers] = useState<QuizAnswers>({
    curlType: '',
    hairDensity: '',
    porosity: '',
    mainConcern: '',
    currentRoutine: ''
  })

  // Verificar se voltou do checkout com sucesso
  useEffect(() => {
    const success = searchParams.get('success')
    const sessionId = searchParams.get('session_id')
    
    if (success === 'true' && sessionId) {
      // Verificar pagamento no backend
      fetch('/api/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      })
        .then(res => res.json())
        .then(data => {
          if (data.paid) {
            // Atualizar status de pagamento
            setHasPaid(true)
            setQuizCompleted(true)
            setShowQuiz(false)
            
            // Atualizar no Supabase
            updatePaymentStatusInSupabase(userEmail, true)
            
            // Limpar URL
            router.replace('/analysis')
            
            // Permitir upload após pequeno delay
            setTimeout(() => {
              fileInputRef.current?.click()
            }, 500)
          }
        })
        .catch(err => console.error('Erro ao verificar pagamento:', err))
    }
  }, [searchParams, router, userEmail])

  const updatePaymentStatusInSupabase = async (email: string, paid: boolean) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ has_paid: paid })
        .eq('email', email)
      
      if (error) {
        console.log('Nota: Não foi possível atualizar no Supabase, mas continuando')
      }
    } catch (err) {
      console.log('Nota: Erro ao atualizar Supabase, mas continuando')
    }
  }

  const handleNameFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!userName.trim() || !userEmail.trim()) {
      setError('Por favor, preencha seu nome e email.')
      return
    }

    setIsCheckingPayment(true)
    setError(null)

    try {
      console.log('🔍 Verificando status de pagamento para:', userEmail)
      
      // 🔥 SEMPRE VERIFICAR NO SUPABASE
      const { data: profile, error: supabaseError } = await supabase
        .from('user_profiles')
        .select('has_paid')
        .eq('email', userEmail)
        .single()
      
      if (!supabaseError && profile?.has_paid === true) {
        // Usuário já pagou - pular quiz e permitir upload
        console.log('✅ Usuário já pagou anteriormente')
        setHasPaid(true)
        setQuizCompleted(true)
        setShowQuiz(false)
        setShowNameForm(false)
      } else {
        // Usuário não pagou - mostrar quiz
        console.log('📝 Usuário precisa fazer quiz e pagar')
        setShowNameForm(false)
        setShowQuiz(true)
      }
    } catch (err) {
      console.log('Nota: Erro ao verificar Supabase, continuando com quiz')
      // Se falhar, continuar com quiz normalmente
      setShowNameForm(false)
      setShowQuiz(true)
    } finally {
      setIsCheckingPayment(false)
    }
  }

  const quizQuestions = [
    {
      id: 'curlType',
      question: 'Qual é o seu tipo de cacho?',
      options: [
        { value: '2A-2B', label: '2A-2B (Ondulado leve)', description: 'Ondas suaves e soltas' },
        { value: '2C-3A', label: '2C-3A (Ondulado definido)', description: 'Ondas mais definidas com volume' },
        { value: '3B-3C', label: '3B-3C (Cacho médio)', description: 'Cachos em formato de mola' },
        { value: '4A-4B', label: '4A-4B (Cacho crespo)', description: 'Cachos bem definidos e fechados' },
        { value: '4C', label: '4C (Crespo)', description: 'Padrão em Z, muito volumoso' }
      ]
    },
    {
      id: 'hairDensity',
      question: 'Qual é a densidade do seu cabelo?',
      options: [
        { value: 'baixa', label: 'Baixa', description: 'Consigo ver o couro cabeludo facilmente' },
        { value: 'media', label: 'Média', description: 'Vejo o couro cabeludo com algum esforço' },
        { value: 'alta', label: 'Alta', description: 'Difícil ver o couro cabeludo' }
      ]
    },
    {
      id: 'porosity',
      question: 'Qual é a porosidade do seu cabelo?',
      options: [
        { value: 'baixa', label: 'Baixa', description: 'Demora para absorver e secar' },
        { value: 'media', label: 'Média', description: 'Absorve e seca em tempo normal' },
        { value: 'alta', label: 'Alta', description: 'Absorve rápido e seca rápido' }
      ]
    },
    {
      id: 'mainConcern',
      question: 'Qual é a sua maior preocupação?',
      options: [
        { value: 'frizz', label: 'Frizz', description: 'Cabelo arrepiado e sem definição' },
        { value: 'ressecamento', label: 'Ressecamento', description: 'Fios secos e quebradiços' },
        { value: 'volume', label: 'Falta de volume', description: 'Cabelo murcho e sem vida' },
        { value: 'definicao', label: 'Definição', description: 'Cachos sem forma definida' },
        { value: 'quebra', label: 'Quebra', description: 'Fios quebrando facilmente' }
      ]
    },
    {
      id: 'currentRoutine',
      question: 'Com que frequência você lava o cabelo?',
      options: [
        { value: 'diaria', label: 'Diariamente', description: 'Todos os dias' },
        { value: '2-3x', label: '2-3x por semana', description: 'Algumas vezes na semana' },
        { value: '1x', label: '1x por semana', description: 'Uma vez por semana' },
        { value: 'quinzenal', label: 'Quinzenal', description: 'A cada 15 dias' }
      ]
    }
  ]

  const handleQuizAnswer = (questionId: string, value: string) => {
    setQuizAnswers(prev => ({
      ...prev,
      [questionId]: value
    }))

    // Avançar para próxima pergunta
    if (currentQuestion < quizQuestions.length - 1) {
      setTimeout(() => {
        setCurrentQuestion(prev => prev + 1)
      }, 300)
    } else {
      // Quiz completo - marcar como completo
      setTimeout(() => {
        setQuizCompleted(true)
        setShowQuiz(false)
      }, 300)
    }
  }

  // 🔥 FUNÇÃO CORRIGIDA: Verificar pagamento DEPOIS de selecionar imagem
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      setError('Por favor, selecione um arquivo de imagem válido.')
      return
    }

    // Validar tamanho (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('A imagem é muito grande. Por favor, use uma imagem menor que 5MB.')
      return
    }

    console.log('📸 Imagem selecionada, verificando pagamento...')

    try {
      // 🔥 VERIFICAR PAGAMENTO NO SUPABASE APÓS SELEÇÃO
      const { data: profile, error: supabaseError } = await supabase
        .from('user_profiles')
        .select('has_paid')
        .eq('email', userEmail)
        .single()
      
      if (!supabaseError && profile?.has_paid === true) {
        // ✅ Usuário já pagou - processar imagem normalmente
        console.log('✅ Pagamento confirmado - processando imagem')
        setHasPaid(true)
        
        const reader = new FileReader()
        reader.onloadend = () => {
          setSelectedImage(reader.result as string)
          setError(null)
        }
        reader.onerror = () => {
          setError('Erro ao carregar a imagem. Tente novamente.')
        }
        reader.readAsDataURL(file)
        return
      }
      
      // ❌ Usuário NÃO pagou - guardar arquivo e mostrar checkout
      console.log('💳 Pagamento necessário - abrindo checkout')
      setPendingImageFile(file)
      
      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID || 'price_1SfUz8PIsn3cXV4Mrg89zmeY',
          customerEmail: userEmail,
          customerName: userName
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar checkout')
      }

      setClientSecret(data.clientSecret)
      setShowCheckout(true)
      
      // Limpar input para permitir nova seleção
      e.target.value = ''
      
    } catch (err: any) {
      console.error('Erro ao processar:', err)
      setError(err.message || 'Erro ao processar. Tente novamente.')
      e.target.value = ''
    }
  }

  // 🔥 FUNÇÃO SIMPLIFICADA: Apenas aciona input (SEM async)
  const triggerCamera = () => {
    console.log('📸 Abrindo câmera...')
    setError(null)
    cameraInputRef.current?.click()
  }

  // 🔥 FUNÇÃO SIMPLIFICADA: Apenas aciona input (SEM async)
  const triggerGallery = () => {
    console.log('🖼️ Abrindo galeria...')
    setError(null)
    fileInputRef.current?.click()
  }

  // 🔥 NOVA FUNÇÃO: Salvar análise no Supabase
  const saveAnalysisToSupabase = async (analysisData: AnalysisResult) => {
    try {
      console.log('💾 Salvando análise no Supabase...')
      
      const { data, error } = await supabase
        .from('hair_analyses')
        .insert({
          user_email: userEmail,
          user_name: userName,
          photo_url: selectedImage,
          curl_pattern: analysisData.curl_pattern,
          texture: analysisData.texture,
          density: analysisData.density,
          porosity: analysisData.porosity,
          health_score: analysisData.health_score,
          damage_alerts: analysisData.damage_alerts,
          recommendations: analysisData.recommendations,
          detailed_analysis: analysisData.detailed_analysis,
          quiz_answers: quizAnswers
        })
        .select()
        .single()
      
      if (error) {
        console.error('❌ Erro ao salvar no Supabase:', error)
        throw error
      }
      
      console.log('✅ Análise salva no Supabase com sucesso:', data.id)
      return data
    } catch (err) {
      console.error('❌ Erro ao salvar análise:', err)
      // Continuar mesmo se falhar - dados ficam no localStorage como fallback
    }
  }

  const analyzePhoto = async () => {
    if (!selectedImage) return

    setIsAnalyzing(true)
    setError(null)

    try {
      console.log('🔍 Verificando pagamento antes de analisar...')
      
      // 🔥 VERIFICAR PAGAMENTO NOVAMENTE ANTES DE ANALISAR
      const { data: profile, error: supabaseError } = await supabase
        .from('user_profiles')
        .select('has_paid')
        .eq('email', userEmail)
        .single()
      
      if (supabaseError || profile?.has_paid !== true) {
        setError('Pagamento não confirmado. Por favor, complete o pagamento primeiro.')
        setIsAnalyzing(false)
        return
      }
      
      console.log('✅ Pagamento confirmado - prosseguindo com análise')
      console.log('Enviando imagem para análise...')
      
      const response = await fetch('/api/analyze-hair', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          imageUrl: selectedImage,
          quizAnswers: quizAnswers,
          userName: userName,
          userEmail: userEmail
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao analisar a foto')
      }

      console.log('Análise recebida:', result)
      setAnalysis(result)

      // 🔥 SALVAR NO SUPABASE PRIMEIRO
      await saveAnalysisToSupabase(result)

      // Salvar análise no localStorage (fallback)
      const completeData = {
        userName: userName,
        userEmail: userEmail,
        questionnaire: quizAnswers,
        analysis: result,
        photoUrl: selectedImage,
        quizAnswers: quizAnswers
      }
      localStorage.setItem('hairAnalysis', JSON.stringify(completeData))

    } catch (err: any) {
      console.error('Erro na análise:', err)
      setError(err.message || 'Não foi possível analisar a foto. Tente novamente.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const goToDashboard = () => {
    router.push('/dashboard')
  }

  // Loading state enquanto verifica pagamento
  if (isCheckingPayment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Verificando seu acesso...</p>
        </div>
      </div>
    )
  }

  // 🔥 SEMPRE RENDERIZAR FORMULÁRIO DE NOME/EMAIL PRIMEIRO
  if (showNameForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 py-4 px-4 sm:py-8">
        <div className="container mx-auto max-w-md">
          <div className="mb-6 sm:mb-8 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Bem-vinda ao Curlara!
              </h1>
            </div>
            <p className="text-sm sm:text-base text-gray-600 px-4">
              Vamos começar conhecendo você
            </p>
          </div>

          <Card className="p-6 sm:p-8 bg-white shadow-xl">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2 text-center">
              Identifique-se
            </h2>
            <p className="text-sm text-gray-600 mb-6 text-center">
              Precisamos dessas informações para personalizar sua experiência
            </p>

            <form onSubmit={handleNameFormSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Seu Nome
                </label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Digite seu nome completo"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full"
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Seu Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="w-full"
                  required
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-lg py-6"
              >
                Continuar
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </form>

            <div className="mt-6 p-4 bg-purple-50 rounded-lg">
              <p className="text-xs text-purple-800 text-center">
                🔒 Seus dados são seguros e usados apenas para personalizar sua experiência
              </p>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  // Renderizar Quiz (apenas se não completou e não pagou)
  if (showQuiz && !quizCompleted && !hasPaid) {
    const currentQ = quizQuestions[currentQuestion]
    const progress = ((currentQuestion + 1) / quizQuestions.length) * 100

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 py-4 px-4 sm:py-8">
        <div className="container mx-auto max-w-2xl">
          {/* Header */}
          <div className="mb-6 sm:mb-8 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Conheça Seus Cachos
              </h1>
            </div>
            <p className="text-sm sm:text-base text-gray-600 px-4">
              Olá, {userName}! Responda algumas perguntas para personalizar sua análise
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Pergunta {currentQuestion + 1} de {quizQuestions.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-600 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Question Card */}
          <Card className="p-6 sm:p-8 bg-white shadow-xl">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6">
              {currentQ.question}
            </h2>

            <div className="space-y-3">
              {currentQ.options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleQuizAnswer(currentQ.id, option.value)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all hover:border-purple-400 hover:bg-purple-50 active:scale-98 ${
                    quizAnswers[currentQ.id as keyof QuizAnswers] === option.value
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800 mb-1">
                        {option.label}
                      </div>
                      <div className="text-sm text-gray-600">
                        {option.description}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-purple-500 flex-shrink-0 mt-1" />
                  </div>
                </button>
              ))}
            </div>

            {/* Botão Voltar (se não for primeira pergunta) */}
            {currentQuestion > 0 && (
              <Button
                variant="outline"
                onClick={() => setCurrentQuestion(prev => prev - 1)}
                className="mt-6 w-full sm:w-auto"
              >
                Voltar
              </Button>
            )}
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 py-4 px-4 sm:py-8">
      <div className="container mx-auto max-w-4xl">
        {/* Header - Mobile Optimized */}
        <div className="mb-6 sm:mb-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-600" />
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Análise com IA
            </h1>
          </div>
          <p className="text-sm sm:text-base text-gray-600 px-4">
            Olá, {userName}! Tire ou envie uma foto do seu cabelo para análise personalizada
          </p>
        </div>

        {!analysis ? (
          <Card className="p-4 sm:p-8 bg-white shadow-xl">
            {/* Upload Area */}
            {!selectedImage ? (
              <div className="space-y-4 sm:space-y-6">
                <div className="border-2 border-dashed border-emerald-300 rounded-xl p-8 sm:p-12 text-center hover:border-emerald-500 transition-colors active:border-emerald-600">
                  <Camera className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-emerald-600" />
                  <h3 className="text-lg sm:text-xl font-semibold mb-2 text-gray-800">Envie uma foto do seu cabelo</h3>
                  <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 px-2">
                    Para melhores resultados, tire uma foto com boa iluminação natural
                  </p>
                  
                  {/* 🔥 BOTÕES CORRIGIDOS - ACIONAM INPUT DIRETAMENTE */}
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button 
                      onClick={triggerCamera}
                      type="button"
                      className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 active:scale-95 transition-transform w-full sm:w-auto text-base py-6"
                    >
                      <Camera className="w-5 h-5 mr-2" />
                      {hasPaid ? 'Tirar Foto' : 'Tirar Foto - R$ 24,99'}
                    </Button>
                    
                    <Button 
                      onClick={triggerGallery}
                      type="button"
                      variant="outline"
                      className="border-emerald-500 text-emerald-700 hover:bg-emerald-50 active:scale-95 transition-transform w-full sm:w-auto text-base py-6"
                    >
                      <Upload className="w-5 h-5 mr-2" />
                      Escolher da Galeria
                    </Button>
                  </div>

                  {/* 🔥 INPUT PARA CÂMERA - OTIMIZADO MOBILE */}
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleImageUpload}
                    className="hidden"
                    aria-label="Tirar foto com câmera"
                  />

                  {/* 🔥 INPUT PARA GALERIA - OTIMIZADO MOBILE */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    aria-label="Escolher foto da galeria"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm sm:text-base text-red-800">{error}</p>
                  </div>
                )}

                {hasPaid && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 sm:p-4 flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm sm:text-base text-emerald-800">
                      ✨ Você já pagou! Pode fazer upload de fotos quantas vezes quiser.
                    </p>
                  </div>
                )}

                <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-3 sm:p-4">
                  <h4 className="font-semibold text-cyan-900 mb-2 text-sm sm:text-base">Dicas para uma boa foto:</h4>
                  <ul className="text-xs sm:text-sm text-cyan-800 space-y-1">
                    <li>✓ Use luz natural (próximo a uma janela)</li>
                    <li>✓ Mostre o cabelo solto e natural</li>
                    <li>✓ Evite filtros ou edições</li>
                    <li>✓ Capture diferentes ângulos se possível</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-6">
                {/* Preview da Imagem - Mobile Optimized */}
                <div className="relative aspect-square sm:aspect-video rounded-xl overflow-hidden bg-gray-100">
                  <Image
                    src={selectedImage}
                    alt="Foto do cabelo"
                    fill
                    className="object-cover"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm sm:text-base text-red-800">{error}</p>
                  </div>
                )}

                {/* Botões de Ação - Mobile First */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedImage(null)}
                    className="flex-1 active:scale-95 transition-transform"
                    disabled={isAnalyzing}
                  >
                    Trocar Foto
                  </Button>
                  <Button
                    onClick={analyzePhoto}
                    disabled={isAnalyzing}
                    className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 active:scale-95 transition-transform"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Analisando...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Analisar com IA
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </Card>
        ) : (
          /* Resultados da Análise - Mobile Optimized */
          <div className="space-y-4 sm:space-y-6">
            <Card className="p-4 sm:p-8 bg-white shadow-xl">
              <div className="flex items-start sm:items-center gap-3 mb-4 sm:mb-6">
                <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-600 flex-shrink-0" />
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Análise Completa!</h2>
                  <p className="text-sm sm:text-base text-gray-600">Aqui está o que descobrimos sobre seu cabelo</p>
                </div>
              </div>

              {/* Score de Saúde */}
              <div className="mb-6 sm:mb-8">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-base sm:text-lg font-semibold text-gray-800">Pontuação de Saúde</span>
                  <span className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                    {analysis.health_score}/100
                  </span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 transition-all duration-500"
                    style={{ width: `${analysis.health_score}%` }}
                  />
                </div>
              </div>

              {/* Características - Mobile Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
                <div className="bg-emerald-50 rounded-lg p-3 sm:p-4">
                  <h4 className="font-semibold text-emerald-900 mb-1 text-sm sm:text-base">Padrão de Cacho</h4>
                  <p className="text-sm sm:text-base text-emerald-700">{analysis.curl_pattern}</p>
                </div>
                <div className="bg-teal-50 rounded-lg p-3 sm:p-4">
                  <h4 className="font-semibold text-teal-900 mb-1 text-sm sm:text-base">Textura</h4>
                  <p className="text-sm sm:text-base text-teal-700">{analysis.texture}</p>
                </div>
                <div className="bg-cyan-50 rounded-lg p-3 sm:p-4">
                  <h4 className="font-semibold text-cyan-900 mb-1 text-sm sm:text-base">Densidade</h4>
                  <p className="text-sm sm:text-base text-cyan-700">{analysis.density}</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 sm:p-4">
                  <h4 className="font-semibold text-blue-900 mb-1 text-sm sm:text-base">Porosidade</h4>
                  <p className="text-sm sm:text-base text-blue-700">{analysis.porosity}</p>
                </div>
              </div>

              {/* Alertas de Dano */}
              {analysis.damage_alerts.length > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 sm:p-4 mb-6 sm:mb-8">
                  <h4 className="font-semibold text-orange-900 mb-3 flex items-center gap-2 text-sm sm:text-base">
                    <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                    Alertas de Atenção
                  </h4>
                  <ul className="space-y-2">
                    {analysis.damage_alerts.map((alert, index) => (
                      <li key={index} className="text-sm sm:text-base text-orange-800 flex items-start gap-2">
                        <span className="text-orange-600 mt-1">•</span>
                        <span>{alert}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Análise Detalhada */}
              <div className="mb-6 sm:mb-8">
                <h4 className="font-semibold text-gray-900 mb-3 text-sm sm:text-base">Análise Detalhada</h4>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed">{analysis.detailed_analysis}</p>
              </div>

              {/* Recomendações */}
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 text-sm sm:text-base">Produtos Recomendados</h4>
                  <ul className="space-y-2">
                    {analysis.recommendations.products.map((product, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm sm:text-base text-gray-700">
                        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span>{product}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 text-sm sm:text-base">Técnicas Recomendadas</h4>
                  <ul className="space-y-2">
                    {analysis.recommendations.techniques.map((technique, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm sm:text-base text-gray-700">
                        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                        <span>{technique}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg p-3 sm:p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 text-sm sm:text-base">Frequência Recomendada</h4>
                  <div className="grid gap-2">
                    <div className="flex justify-between text-sm sm:text-base">
                      <span className="text-gray-700">Lavagem:</span>
                      <span className="font-medium text-emerald-700">{analysis.recommendations.frequency.wash}</span>
                    </div>
                    <div className="flex justify-between text-sm sm:text-base">
                      <span className="text-gray-700">Hidratação:</span>
                      <span className="font-medium text-teal-700">{analysis.recommendations.frequency.hydration}</span>
                    </div>
                    <div className="flex justify-between text-sm sm:text-base">
                      <span className="text-gray-700">Tratamento:</span>
                      <span className="font-medium text-cyan-700">{analysis.recommendations.frequency.treatment}</span>
                    </div>
                  </div>
                </div>
              </div>

              <Button
                onClick={goToDashboard}
                className="w-full mt-6 sm:mt-8 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 active:scale-95 transition-transform text-base sm:text-lg py-5 sm:py-6"
              >
                IR PARA DASHBOARD
              </Button>
            </Card>
          </div>
        )}
      </div>

      {/* Modal de Checkout do Stripe Embedded */}
      {showCheckout && clientSecret && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={() => {
                setShowCheckout(false)
                setClientSecret(null)
              }}
              className="absolute top-4 right-4 z-10 text-gray-400 hover:text-gray-600 transition-colors bg-white rounded-full p-2 shadow-lg"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="p-6">
              <EmbeddedCheckoutProvider
                stripe={stripePromise}
                options={{ clientSecret }}
              >
                <EmbeddedCheckout />
              </EmbeddedCheckoutProvider>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Componente principal com Suspense boundary
export default function AnalysisPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    }>
      <AnalysisContent />
    </Suspense>
  )
}
