'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { 
  Calendar, 
  Award, 
  ShoppingBag, 
  Heart,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Gift,
  RefreshCw,
  Clock,
  LogOut,
  ExternalLink,
  Search,
  Camera
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { 
  getCurrentUser, 
  getHairProfile, 
  saveHairProfile, 
  getUserTasks, 
  saveUserTasks, 
  getLoyaltyPoints, 
  saveLoyaltyPoints,
  UserHairProfile,
  UserTask
} from '@/lib/user-data'
import { 
  getRecommendedProducts, 
  saveRecommendedProducts, 
  generateProductRecommendations,
  RecommendedProduct
} from '@/lib/products'
import { supabase } from '@/lib/supabase'
import { CircularProgress } from '@/components/custom/CircularProgress'

type UserData = {
  questionnaire: any
  analysis: any
  photoUrl: string
  lastAnalysisDate?: string
}

type DailyTask = {
  id: string
  title: string
  description: string
  completed: boolean
  points: number
}

type WeeklyTask = {
  id: string
  title: string
  description: string
  steps: string[]
  completed: boolean
  points: number
  frequency: string
}

// 🔥 FUNÇÕES DE INICIALIZAÇÃO DE TASKS (MOVIDAS PARA FORA DO COMPONENTE)
const initializeDailyTasksData = (): DailyTask[] => {
  return [
    {
      id: 'morning-refresh',
      title: 'Refrescamento Matinal',
      description: 'Borrife água ou leave-in e amasse os cachos',
      completed: false,
      points: 5
    },
    {
      id: 'night-protection',
      title: 'Proteção Noturna',
      description: 'Use touca de cetim ou fronha de seda',
      completed: false,
      points: 5
    },
    {
      id: 'hydration-check',
      title: 'Verificar Hidratação',
      description: 'Observe se os fios estão ressecados',
      completed: false,
      points: 3
    }
  ]
}

const initializeWeeklyTasksData = (): WeeklyTask[] => {
  return [
    {
      id: 'wash-routine',
      title: 'Rotina de Lavagem',
      description: 'Lave os cabelos seguindo o método correto',
      steps: [
        'Co-wash ou shampoo suave',
        'Condicionador para desembaraçar',
        'Finalização com leave-in e gel'
      ],
      completed: false,
      points: 15,
      frequency: '2x por semana'
    },
    {
      id: 'deep-hydration',
      title: 'Hidratação Profunda',
      description: 'Faça uma máscara hidratante',
      steps: [
        'Aplicar máscara hidratante',
        'Deixar agir por 20-30 minutos',
        'Enxaguar com água fria',
        'Finalizar normalmente'
      ],
      completed: false,
      points: 20,
      frequency: '1x por semana'
    },
    {
      id: 'scalp-massage',
      title: 'Massagem no Couro Cabeludo',
      description: 'Estimule a circulação sanguínea',
      steps: [
        'Massageie suavemente por 5 minutos',
        'Use movimentos circulares',
        'Pode usar óleo capilar'
      ],
      completed: false,
      points: 10,
      frequency: '2-3x por semana'
    }
  ]
}

export default function DashboardPage() {
  const router = useRouter()
  const [userData, setUserData] = useState<UserData | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [loyaltyPoints, setLoyaltyPoints] = useState(150)
  
  // 🔥 INICIALIZAÇÃO GARANTIDA DAS TASKS (SEMPRE APARECEM)
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>(initializeDailyTasksData())
  const [weeklyTasks, setWeeklyTasks] = useState<WeeklyTask[]>(initializeWeeklyTasksData())
  
  const [daysSinceAnalysis, setDaysSinceAnalysis] = useState(0)
  const [showReanalysisPrompt, setShowReanalysisPrompt] = useState(false)
  const [loading, setLoading] = useState(true)
  const [recommendedProducts, setRecommendedProducts] = useState<RecommendedProduct[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [storeProducts, setStoreProducts] = useState<any[]>([])
  const [loadingStoreProducts, setLoadingStoreProducts] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // 🔥 ISOLAMENTO DE DADOS: Monitorar mudanças de autenticação
  useEffect(() => {
    // Listener para mudanças de autenticação
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 Mudança de autenticação detectada:', event)
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // Novo login ou token atualizado - recarregar dados
        console.log('✅ Novo usuário logado - limpando e recarregando dados')
        clearAllData()
        loadUserData()
      } else if (event === 'SIGNED_OUT') {
        // Logout - limpar tudo
        console.log('🚪 Usuário deslogado - limpando dados')
        clearAllData()
        router.push('/')
      }
    })

    // Carregar dados iniciais
    loadUserData()

    // Cleanup
    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  // 🔥 FUNÇÃO PARA LIMPAR TODOS OS DADOS (ISOLAMENTO)
  const clearAllData = () => {
    console.log('🧹 Limpando todos os dados do dashboard...')
    setUserData(null)
    setUserId(null)
    setUserEmail(null)
    setLoyaltyPoints(150)
    
    // 🔥 RESETAR TASKS PARA PADRÃO (SEMPRE VISÍVEIS)
    setDailyTasks(initializeDailyTasksData())
    setWeeklyTasks(initializeWeeklyTasksData())
    
    setDaysSinceAnalysis(0)
    setShowReanalysisPrompt(false)
    setRecommendedProducts([])
    setStoreProducts([])
    setSearchQuery('')
  }

  // 🔥 NOVA FUNÇÃO: Carregar análise mais recente do Supabase
  const loadLatestAnalysisFromSupabase = async (email: string) => {
    try {
      console.log('📥 Buscando análise mais recente do Supabase para:', email)
      
      const { data: analyses, error } = await supabase
        .from('hair_analyses')
        .select('*')
        .eq('user_email', email)
        .order('created_at', { ascending: false })
        .limit(1)
      
      if (error) {
        console.error('❌ Erro ao buscar análise:', error)
        return null
      }
      
      if (!analyses || analyses.length === 0) {
        console.log('⚠️ Nenhuma análise encontrada no Supabase')
        return null
      }
      
      const latestAnalysis = analyses[0]
      console.log('✅ Análise encontrada:', latestAnalysis.id)
      
      // Converter para formato esperado
      const userData: UserData = {
        questionnaire: latestAnalysis.quiz_answers || {},
        analysis: {
          curl_pattern: latestAnalysis.curl_pattern,
          texture: latestAnalysis.texture,
          density: latestAnalysis.density,
          porosity: latestAnalysis.porosity,
          health_score: latestAnalysis.health_score,
          damage_alerts: latestAnalysis.damage_alerts || [],
          recommendations: latestAnalysis.recommendations || {},
          detailed_analysis: latestAnalysis.detailed_analysis
        },
        photoUrl: latestAnalysis.photo_url || '',
        lastAnalysisDate: latestAnalysis.created_at
      }
      
      return userData
    } catch (err) {
      console.error('❌ Erro ao carregar análise do Supabase:', err)
      return null
    }
  }

  const loadUserData = async () => {
    try {
      setLoading(true)
      
      console.log('🔍 Verificando autenticação...')
      // Verificar se usuário está autenticado
      const user = await getCurrentUser()
      
      if (!user) {
        console.log('⚠️ Usuário não autenticado - carregando do localStorage')
        // Se não estiver autenticado, tentar carregar do localStorage (fallback)
        await loadFromLocalStorage()
        return
      }

      console.log('✅ Usuário autenticado:', user.id)
      
      // 🔥 ISOLAMENTO: Verificar se é um usuário diferente
      if (userId && userId !== user.id) {
        console.log('🔄 Usuário diferente detectado - limpando dados antigos')
        clearAllData()
      }
      
      setUserId(user.id)
      setUserEmail(user.email)

      // 🔥 PRIORIDADE 1: Buscar análise mais recente do Supabase
      const analysisData = await loadLatestAnalysisFromSupabase(user.email)
      
      if (analysisData) {
        console.log('✅ Dados da análise carregados do Supabase')
        setUserData(analysisData)
        
        // Calcular dias desde última análise
        const lastDate = analysisData.lastAnalysisDate || new Date().toISOString()
        const daysDiff = Math.floor((Date.now() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24))
        setDaysSinceAnalysis(daysDiff)
        
        if (daysDiff >= 30) {
          setShowReanalysisPrompt(true)
        }
      } else {
        console.log('⚠️ Nenhuma análise no Supabase - verificando localStorage...')
        // Fallback para localStorage
        await loadFromLocalStorage()
      }

      // 🔥 CARREGAR TASKS DO SUPABASE (SEM BLOQUEAR EXIBIÇÃO)
      loadTasksFromSupabase(user.id)

      // Carregar pontos do Supabase
      console.log('📥 Buscando pontos do Supabase...')
      const points = await getLoyaltyPoints(user.id)
      console.log('🎯 Pontos encontrados:', points)
      
      if (points > 0) {
        setLoyaltyPoints(points)
      } else {
        console.log('⚠️ Nenhum ponto no Supabase - salvando pontos iniciais...')
        await saveLoyaltyPoints(user.id, 150)
        setLoyaltyPoints(150)
      }

      // Carregar produtos recomendados
      if (analysisData) {
        await loadRecommendedProducts(user.id, analysisData.analysis)
      }
      
      // Carregar produtos da loja integrada
      await loadStoreProducts()
      
    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error)
      await loadFromLocalStorage()
    } finally {
      setLoading(false)
    }
  }

  // 🔥 NOVA FUNÇÃO: Carregar tasks do Supabase de forma assíncrona (não bloqueia exibição)
  const loadTasksFromSupabase = async (userId: string) => {
    try {
      console.log('📥 Buscando tasks do Supabase (assíncrono)...')
      const savedTasks = await getUserTasks(userId)
      console.log('📊 Tasks encontradas no Supabase:', savedTasks.length)
      
      if (savedTasks.length > 0) {
        // Mesclar tasks salvas com tasks padrão (manter estrutura, atualizar status)
        setDailyTasks(prev => prev.map(task => {
          const saved = savedTasks.find(t => t.task_id === task.id && t.task_type === 'daily')
          return saved ? { ...task, completed: saved.completed } : task
        }))
        
        setWeeklyTasks(prev => prev.map(task => {
          const saved = savedTasks.find(t => t.task_id === task.id && t.task_type === 'weekly')
          return saved ? { ...task, completed: saved.completed } : task
        }))
        
        console.log('✅ Tasks mescladas com sucesso')
      } else {
        console.log('⚠️ Nenhuma task no Supabase - salvando tasks padrão...')
        // Salvar tasks padrão no Supabase
        await saveTasksToSupabase(userId, dailyTasks, weeklyTasks)
      }
    } catch (error) {
      console.error('❌ Erro ao carregar tasks do Supabase:', error)
      // Manter tasks padrão mesmo se falhar (já estão visíveis)
      console.log('✅ Usando tasks padrão (fallback)')
    }
  }

  const loadRecommendedProducts = async (userId: string, analysis: any) => {
    try {
      setLoadingProducts(true)
      console.log('🛍️ Buscando produtos recomendados...')
      
      // Buscar produtos existentes no banco
      const existingProducts = await getRecommendedProducts(userId)
      
      if (existingProducts && existingProducts.length > 0) {
        console.log('✅ Produtos encontrados no banco:', existingProducts.length)
        setRecommendedProducts(existingProducts)
      } else {
        console.log('⚠️ Nenhum produto no banco - gerando recomendações...')
        // Gerar produtos baseados na análise
        const generatedProducts = generateProductRecommendations(analysis)
        
        // Salvar no banco
        try {
          const savedProducts = await saveRecommendedProducts(userId, generatedProducts)
          console.log('✅ Produtos salvos no banco:', savedProducts.length)
          setRecommendedProducts(savedProducts)
        } catch (error) {
          console.error('❌ Erro ao salvar produtos, usando gerados:', error)
          // Se falhar ao salvar, usar os gerados mesmo assim
          setRecommendedProducts(generatedProducts as any)
        }
      }
    } catch (error) {
      console.error('❌ Erro ao carregar produtos:', error)
      // Em caso de erro, gerar produtos localmente
      const generatedProducts = generateProductRecommendations(analysis)
      setRecommendedProducts(generatedProducts as any)
    } finally {
      setLoadingProducts(false)
    }
  }

  const loadStoreProducts = async () => {
    try {
      setLoadingStoreProducts(true)
      console.log('🏪 Buscando produtos da loja integrada...')
      
      // Usar a MESMA API que funciona na página inicial
      const response = await fetch('/api/store/products')
      
      if (response.ok) {
        const data = await response.json()
        const products = data.products || []
        
        if (products.length > 0) {
          console.log('✅ Produtos da loja encontrados:', products.length)
          setStoreProducts(products)
        } else {
          console.log('⚠️ Nenhum produto encontrado na loja')
          setStoreProducts([])
        }
      } else {
        console.error('❌ Erro ao buscar produtos:', response.status)
        setStoreProducts([])
      }
    } catch (error) {
      console.error('❌ Erro ao carregar produtos da loja:', error)
      setStoreProducts([])
    } finally {
      setLoadingStoreProducts(false)
    }
  }

  const handleProductClick = (product: any) => {
    // Usar a coluna "link_afiliado" para redirecionamento
    const affiliateLink = product.link_afiliado
    
    if (affiliateLink && affiliateLink.startsWith('http')) {
      // Redirecionar para o link de afiliação
      window.open(affiliateLink, '_blank', 'noopener,noreferrer')
    } else {
      // Se não houver link, mostrar alerta
      alert('Link de afiliado não configurado para este produto.')
    }
  }

  // 🔥 NOVA FUNÇÃO: Salvar tasks no Supabase com tratamento de erro robusto
  const saveTasksToSupabase = async (userId: string, daily: DailyTask[], weekly: WeeklyTask[]) => {
    try {
      console.log('💾 Salvando tasks no Supabase...')
      const allTasks: UserTask[] = [
        ...daily.map(t => ({
          user_id: userId,
          task_id: t.id,
          task_type: 'daily' as const,
          completed: t.completed
        })),
        ...weekly.map(t => ({
          user_id: userId,
          task_id: t.id,
          task_type: 'weekly' as const,
          completed: t.completed
        }))
      ]
      
      await saveUserTasks(userId, allTasks)
      console.log('✅ Tasks salvas no Supabase:', allTasks.length)
    } catch (error) {
      console.error('❌ Erro ao salvar tasks no Supabase:', error)
      // Não lançar erro - permitir que o app continue funcionando
    }
  }

  const loadFromLocalStorage = async () => {
    // 🔥 PRIORIDADE: Se tiver email, buscar do Supabase primeiro
    const localData = localStorage.getItem('hairAnalysis')
    
    if (localData) {
      const parsedData = JSON.parse(localData)
      
      // Se tiver email no localStorage, tentar buscar do Supabase
      if (parsedData.userEmail) {
        console.log('📧 Email encontrado no localStorage, buscando do Supabase...')
        const analysisData = await loadLatestAnalysisFromSupabase(parsedData.userEmail)
        
        if (analysisData) {
          console.log('✅ Dados carregados do Supabase')
          setUserData(analysisData)
          setUserEmail(parsedData.userEmail)
          
          const lastDate = analysisData.lastAnalysisDate || new Date().toISOString()
          const daysDiff = Math.floor((Date.now() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24))
          setDaysSinceAnalysis(daysDiff)
          
          if (daysDiff >= 30) {
            setShowReanalysisPrompt(true)
          }
          
          // Gerar produtos baseados na análise do Supabase
          if (analysisData.analysis) {
            const generatedProducts = generateProductRecommendations(analysisData.analysis)
            setRecommendedProducts(generatedProducts as any)
          }
          
          // Carregar produtos da loja
          await loadStoreProducts()
          return
        }
      }
      
      // Fallback: usar dados do localStorage
      console.log('📦 Usando dados do localStorage')
      setUserData(parsedData)
      
      const lastDate = parsedData.lastAnalysisDate || new Date().toISOString()
      const daysDiff = Math.floor((Date.now() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24))
      setDaysSinceAnalysis(daysDiff)
      
      if (daysDiff >= 30) {
        setShowReanalysisPrompt(true)
      }

      const savedDailyTasks = localStorage.getItem('dailyTasks')
      const savedWeeklyTasks = localStorage.getItem('weeklyTasks')
      const savedPoints = localStorage.getItem('loyaltyPoints')

      if (savedPoints) {
        setLoyaltyPoints(parseInt(savedPoints))
      }

      // 🔥 MESCLAR TASKS DO LOCALSTORAGE COM PADRÃO (GARANTIR ESTRUTURA)
      if (savedDailyTasks) {
        const saved = JSON.parse(savedDailyTasks)
        setDailyTasks(prev => prev.map(task => {
          const savedTask = saved.find((t: DailyTask) => t.id === task.id)
          return savedTask ? { ...task, completed: savedTask.completed } : task
        }))
      }

      if (savedWeeklyTasks) {
        const saved = JSON.parse(savedWeeklyTasks)
        setWeeklyTasks(prev => prev.map(task => {
          const savedTask = saved.find((t: WeeklyTask) => t.id === task.id)
          return savedTask ? { ...task, completed: savedTask.completed } : task
        }))
      }

      // Gerar produtos localmente se não estiver autenticado
      if (parsedData.analysis) {
        const generatedProducts = generateProductRecommendations(parsedData.analysis)
        setRecommendedProducts(generatedProducts as any)
      }
    }
    
    // Carregar produtos da loja mesmo sem autenticação
    await loadStoreProducts()
  }

  const syncTasksToSupabase = async (daily: DailyTask[], weekly: WeeklyTask[]) => {
    if (!userId) {
      console.log('⚠️ Não foi possível sincronizar tasks - usuário não autenticado')
      return
    }

    await saveTasksToSupabase(userId, daily, weekly)
  }

  const syncPointsToSupabase = async (points: number) => {
    if (!userId) {
      console.log('⚠️ Não foi possível sincronizar pontos - usuário não autenticado')
      return
    }

    try {
      console.log('🔄 Sincronizando pontos com Supabase:', points)
      await saveLoyaltyPoints(userId, points)
      console.log('✅ Pontos sincronizados')
    } catch (error) {
      console.error('❌ Erro ao sincronizar pontos:', error)
    }
  }

  const toggleDailyTask = (taskId: string) => {
    setDailyTasks(prev => {
      const updated = prev.map(task => {
        if (task.id === taskId) {
          const newCompleted = !task.completed
          if (newCompleted && !task.completed) {
            setLoyaltyPoints(points => {
              const newPoints = points + task.points
              localStorage.setItem('loyaltyPoints', newPoints.toString())
              syncPointsToSupabase(newPoints)
              return newPoints
            })
          } else if (!newCompleted && task.completed) {
            setLoyaltyPoints(points => {
              const newPoints = Math.max(0, points - task.points)
              localStorage.setItem('loyaltyPoints', newPoints.toString())
              syncPointsToSupabase(newPoints)
              return newPoints
            })
          }
          return { ...task, completed: newCompleted }
        }
        return task
      })
      localStorage.setItem('dailyTasks', JSON.stringify(updated))
      syncTasksToSupabase(updated, weeklyTasks)
      return updated
    })
  }

  const toggleWeeklyTask = (taskId: string) => {
    setWeeklyTasks(prev => {
      const updated = prev.map(task => {
        if (task.id === taskId) {
          const newCompleted = !task.completed
          if (newCompleted && !task.completed) {
            setLoyaltyPoints(points => {
              const newPoints = points + task.points
              localStorage.setItem('loyaltyPoints', newPoints.toString())
              syncPointsToSupabase(newPoints)
              return newPoints
            })
          } else if (!newCompleted && task.completed) {
            setLoyaltyPoints(points => {
              const newPoints = Math.max(0, points - task.points)
              localStorage.setItem('loyaltyPoints', newPoints.toString())
              syncPointsToSupabase(newPoints)
              return newPoints
            })
          }
          return { ...task, completed: newCompleted }
        }
        return task
      })
      localStorage.setItem('weeklyTasks', JSON.stringify(updated))
      syncTasksToSupabase(dailyTasks, updated)
      return updated
    })
  }

  const resetDailyTasks = () => {
    setDailyTasks(prev => {
      const reset = prev.map(task => ({ ...task, completed: false }))
      localStorage.setItem('dailyTasks', JSON.stringify(reset))
      syncTasksToSupabase(reset, weeklyTasks)
      return reset
    })
  }

  // 🔥 NOVA FUNÇÃO: Redirecionar para página de análise ao clicar em "Nova Análise"
  const startNewAnalysis = () => {
    router.push('/analysis')
  }

  const handleLogout = async () => {
    try {
      console.log('🚪 Fazendo logout...')
      
      // Limpar todos os dados antes de fazer logout
      clearAllData()
      
      // Fazer logout do Supabase
      await supabase.auth.signOut()
      
      // Redirecionar para página inicial
      router.push('/')
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
      router.push('/')
    }
  }

  // 🔥 FILTRO DE PESQUISA EM TEMPO REAL
  const filteredStoreProducts = storeProducts.filter(product => {
    if (!searchQuery.trim()) return true
    
    const query = searchQuery.toLowerCase()
    const name = (product.nome || product.name || '').toLowerCase()
    const description = (product.descricao || product.description || '').toLowerCase()
    
    return name.includes(query) || description.includes(query)
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <img 
            src="https://k6hrqrxuu8obbfwn.public.blob.vercel-storage.com/temp/e1451ac7-4bbf-4b7e-af1f-e8bf3d88dd8f.png" 
            alt="Curlara Logo" 
            className="w-16 h-16 mx-auto mb-4 animate-pulse object-contain" 
          />
          <h2 className="text-2xl font-bold mb-4">Carregando seus dados...</h2>
        </Card>
      </div>
    )
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center px-4">
        <Card className="p-8 text-center max-w-md">
          <Camera className="w-16 h-16 mx-auto mb-4 text-purple-600" />
          <h2 className="text-2xl font-bold mb-4">Bem-vinda ao Curlara!</h2>
          <p className="text-gray-600 mb-6">Comece sua jornada fazendo a análise do seu cabelo com IA</p>
          <Button 
            onClick={startNewAnalysis}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
          >
            <Camera className="w-5 h-5 mr-2" />
            Começar Análise
          </Button>
        </Card>
      </div>
    )
  }

  const { questionnaire, analysis } = userData
  const dailyProgress = dailyTasks.length > 0 ? (dailyTasks.filter(t => t.completed).length / dailyTasks.length) * 100 : 0
  const weeklyProgress = weeklyTasks.length > 0 ? (weeklyTasks.filter(t => t.completed).length / weeklyTasks.length) * 100 : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img 
                src="https://k6hrqrxuu8obbfwn.public.blob.vercel-storage.com/temp/e1451ac7-4bbf-4b7e-af1f-e8bf3d88dd8f.png" 
                alt="Curlara Logo" 
                className="w-8 h-8 object-contain" 
              />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Curlara
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-gradient-to-r from-amber-100 to-yellow-100 px-4 py-2 rounded-full">
                <Award className="w-5 h-5 text-amber-600" />
                <span className="font-semibold text-amber-900">{loyaltyPoints} pontos</span>
              </div>
              <Button 
                onClick={handleLogout}
                variant="outline"
                className="gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <LogOut className="w-4 h-4" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2 text-gray-800">
            Olá, {questionnaire.name || 'Usuária'}! 👋
          </h2>
          <p className="text-gray-600">Aqui está sua rotina personalizada e progresso</p>
        </div>

        {/* Reanalysis Prompt */}
        {showReanalysisPrompt && (
          <Card className="p-6 mb-8 bg-gradient-to-r from-purple-100 to-pink-100 border-purple-200">
            <div className="flex items-start gap-4">
              <RefreshCw className="w-8 h-8 text-purple-600 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-xl font-bold text-purple-900 mb-2">
                  Hora de uma Nova Análise! 🎉
                </h3>
                <p className="text-purple-800 mb-4">
                  Já se passaram {daysSinceAnalysis} dias desde sua última análise. 
                  Seu cabelo pode ter mudado! Que tal fazer uma nova avaliação para atualizar sua rotina?
                </p>
                <div className="flex gap-3">
                  <Button 
                    onClick={startNewAnalysis}
                    className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                  >
                    Fazer Nova Análise Agora
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setShowReanalysisPrompt(false)}
                  >
                    Lembrar Depois
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="flex flex-col gap-6 rounded-xl border shadow-sm p-6 bg-gradient-to-br from-purple-500 to-pink-600 text-white">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Saúde dos Fios</h3>
              <TrendingUp className="w-6 h-6" />
            </div>
            <div className="flex flex-col items-center justify-center gap-4">
              <CircularProgress 
                percentage={analysis.health_score} 
                size={140}
                strokeWidth={14}
              />
              <p className="text-white/90 text-sm font-medium">Excelente progresso!</p>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-pink-500 to-rose-600 text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Tasks Diárias</h3>
              <CheckCircle className="w-6 h-6" />
            </div>
            <div className="text-4xl font-bold mb-2">
              {dailyTasks.filter(t => t.completed).length}/{dailyTasks.length}
            </div>
            <Progress value={dailyProgress} className="h-2 bg-pink-300" />
          </Card>

          <Card className="p-6 bg-gradient-to-br from-amber-400 to-orange-500 text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Pontos Fidelidade</h3>
              <Gift className="w-6 h-6" />
            </div>
            <div className="text-4xl font-bold mb-2">{loyaltyPoints}</div>
            <p className="text-amber-100 text-sm">Continue assim!</p>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="tasks" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-white">
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="routine">Rotina</TabsTrigger>
            <TabsTrigger value="analysis">Análise</TabsTrigger>
            <TabsTrigger value="shop">Loja</TabsTrigger>
            <TabsTrigger value="rewards">Recompensas</TabsTrigger>
          </TabsList>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="space-y-6">
            {/* Daily Tasks */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">Tasks Diárias</h3>
                  <p className="text-sm text-gray-600">Complete para ganhar pontos!</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={resetDailyTasks}
                  className="gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Resetar
                </Button>
              </div>

              <div className="mb-4">
                <Progress value={dailyProgress} className="h-3" />
                <p className="text-sm text-gray-600 mt-2">
                  {dailyTasks.filter(t => t.completed).length} de {dailyTasks.length} completas
                </p>
              </div>

              <div className="space-y-3">
                {dailyTasks.map(task => (
                  <Card 
                    key={task.id}
                    className={`p-4 transition-all ${
                      task.completed 
                        ? 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200' 
                        : 'bg-white hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <Checkbox
                        checked={task.completed}
                        onCheckedChange={() => toggleDailyTask(task.id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className={`font-semibold ${task.completed ? 'text-purple-900 line-through' : 'text-gray-800'}`}>
                            {task.title}
                          </h4>
                          <Badge className="bg-amber-500">+{task.points} pts</Badge>
                        </div>
                        <p className="text-sm text-gray-600">{task.description}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>

            {/* Weekly Tasks */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">Tasks Semanais</h3>
                  <p className="text-sm text-gray-600">Rotinas importantes para seus fios</p>
                </div>
              </div>

              <div className="mb-4">
                <Progress value={weeklyProgress} className="h-3" />
                <p className="text-sm text-gray-600 mt-2">
                  {weeklyTasks.filter(t => t.completed).length} de {weeklyTasks.length} completas
                </p>
              </div>

              <div className="space-y-4">
                {weeklyTasks.map(task => (
                  <Card 
                    key={task.id}
                    className={`p-5 transition-all ${
                      task.completed 
                        ? 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200' 
                        : 'bg-white hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <Checkbox
                        checked={task.completed}
                        onCheckedChange={() => toggleWeeklyTask(task.id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className={`font-semibold text-lg ${task.completed ? 'text-purple-900 line-through' : 'text-gray-800'}`}>
                            {task.title}
                          </h4>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {task.frequency}
                            </Badge>
                            <Badge className="bg-amber-500">+{task.points} pts</Badge>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs font-semibold text-gray-700 mb-2">Passos:</p>
                          <ul className="space-y-1">
                            {task.steps.map((step, idx) => (
                              <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                                <span className="text-purple-500 mt-0.5">•</span>
                                <span>{step}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>

            {/* Analysis Reminder */}
            <Card className="p-6 bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
              <div className="flex items-start gap-4">
                <Clock className="w-8 h-8 text-blue-600 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-blue-900 mb-2">
                    Acompanhe sua Evolução
                  </h3>
                  <p className="text-blue-800 mb-4">
                    Última análise: há {daysSinceAnalysis} dias
                    {daysSinceAnalysis < 30 && ` • Próxima recomendada em ${30 - daysSinceAnalysis} dias`}
                  </p>
                  <Button 
                    onClick={startNewAnalysis}
                    variant="outline"
                    className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white"
                  >
                    Fazer Nova Análise Agora
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Rotina Tab */}
          <TabsContent value="routine" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-2xl font-bold mb-6 text-gray-800">Sua Rotina Personalizada</h3>
              
              {/* Rotina Diária */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  <h4 className="text-xl font-semibold text-gray-800">Rotina Diária</h4>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h5 className="font-semibold text-gray-800">Manhã - Refrescamento</h5>
                      <p className="text-sm text-gray-600">Borrife água ou leave-in e amasse os cachos</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-pink-50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-pink-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h5 className="font-semibold text-gray-800">Noite - Proteção</h5>
                      <p className="text-sm text-gray-600">Use touca de cetim ou fronha de seda</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rotina Semanal */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-5 h-5 text-pink-600" />
                  <h4 className="text-xl font-semibold text-gray-800">Rotina Semanal</h4>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-semibold text-gray-800">Lavagem</h5>
                        <Badge className="bg-blue-600">2x por semana</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        {analysis.recommendations.frequency.wash}
                      </p>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Co-wash ou shampoo suave</li>
                        <li>• Condicionador para desembaraçar</li>
                        <li>• Finalização com leave-in e gel</li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-cyan-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-semibold text-gray-800">Hidratação</h5>
                        <Badge className="bg-cyan-600">1x por semana</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        {analysis.recommendations.frequency.hydration}
                      </p>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Máscara hidratante por 20-30 min</li>
                        <li>• Enxágue com água fria</li>
                        <li>• Finalize normalmente</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rotina Mensal */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-5 h-5 text-indigo-600" />
                  <h4 className="text-xl font-semibold text-gray-800">Rotina Mensal</h4>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-4 bg-indigo-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-semibold text-gray-800">Tratamento Profundo</h5>
                        <Badge className="bg-indigo-600">1x por mês</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        {analysis.recommendations.frequency.treatment}
                      </p>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Reconstrução ou nutrição intensiva</li>
                        <li>• Corte de pontas (a cada 3 meses)</li>
                        <li>• Avaliação de progresso</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Análise Tab */}
          <TabsContent value="analysis" className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-800">Sua Análise Capilar</h3>
                <Button 
                  onClick={startNewAnalysis}
                  variant="outline"
                  className="gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Nova Análise
                </Button>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="bg-purple-50 rounded-lg p-4">
                  <h4 className="font-semibold text-purple-900 mb-2">Padrão de Cacho</h4>
                  <p className="text-2xl font-bold text-purple-700">{analysis.curl_pattern}</p>
                </div>
                <div className="bg-pink-50 rounded-lg p-4">
                  <h4 className="font-semibold text-pink-900 mb-2">Textura</h4>
                  <p className="text-2xl font-bold text-pink-700">{analysis.texture}</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">Densidade</h4>
                  <p className="text-2xl font-bold text-blue-700">{analysis.density}</p>
                </div>
                <div className="bg-cyan-50 rounded-lg p-4">
                  <h4 className="font-semibold text-cyan-900 mb-2">Porosidade</h4>
                  <p className="text-2xl font-bold text-cyan-700">{analysis.porosity}</p>
                </div>
              </div>

              {analysis.damage_alerts.length > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                  <h4 className="font-semibold text-orange-900 mb-3 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Alertas de Atenção
                  </h4>
                  <ul className="space-y-2">
                    {analysis.damage_alerts.map((alert: string, index: number) => (
                      <li key={index} className="text-orange-800 flex items-start gap-2">
                        <span className="text-orange-600 mt-1">•</span>
                        <span>{alert}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Análise Detalhada</h4>
                <p className="text-gray-700 leading-relaxed">{analysis.detailed_analysis}</p>
              </div>
            </Card>
          </TabsContent>

          {/* Loja Tab */}
          <TabsContent value="shop" className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-800">Produtos da Loja</h3>
                {loadingStoreProducts && (
                  <div className="flex items-center gap-2 text-purple-600">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Carregando...</span>
                  </div>
                )}
              </div>
              
              {/* 🔥 BARRA DE PESQUISA COM FILTRO EM TEMPO REAL */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Pesquisar produtos por nome ou descrição..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-3 w-full text-base border-2 border-gray-200 focus:border-purple-400 rounded-lg"
                  />
                </div>
                {searchQuery && (
                  <p className="text-sm text-gray-600 mt-2">
                    {filteredStoreProducts.length} produto{filteredStoreProducts.length !== 1 ? 's' : ''} encontrado{filteredStoreProducts.length !== 1 ? 's' : ''}
                  </p>
                )}
              </div>

              {filteredStoreProducts.length > 0 ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                  {filteredStoreProducts.map((product) => {
                    const imageUrl = product['url da imagem'] || product.url_da_imagem || product.image_url
                    
                    return (
                      <Card key={product.id} className="p-6 hover:shadow-xl transition-all duration-300 border-2 hover:border-rose-200 bg-white">
                        <div className="aspect-square relative mb-4 rounded-lg overflow-hidden bg-gradient-to-br from-rose-100 to-purple-100">
                          {imageUrl ? (
                            <Image
                              src={imageUrl}
                              alt={product.nome || product.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ShoppingBag className="w-16 h-16 text-rose-300" />
                            </div>
                          )}
                        </div>
                        <h4 className="text-lg font-bold mb-2 text-gray-800">{product.nome || product.name}</h4>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.descricao || product.description}</p>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-2xl font-bold text-rose-500">
                            R$ {(product.preco || product.price || 0).toFixed(2)}
                          </span>
                        </div>
                        <Button 
                          className="w-full bg-gradient-to-r from-rose-300 to-purple-300 hover:from-rose-400 hover:to-purple-400 text-white"
                          onClick={() => handleProductClick(product)}
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Ver Produto
                        </Button>
                      </Card>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  {searchQuery ? (
                    <>
                      <p className="text-gray-600">Nenhum produto encontrado para "{searchQuery}"</p>
                      <p className="text-sm text-gray-500 mt-2">Tente pesquisar com outras palavras-chave</p>
                    </>
                  ) : (
                    <>
                      <p className="text-gray-600">Nenhum produto disponível na loja no momento.</p>
                      <p className="text-sm text-gray-500 mt-2">Novos produtos serão adicionados em breve!</p>
                    </>
                  )}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Recompensas Tab */}
          <TabsContent value="rewards" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-2xl font-bold mb-6 text-gray-800">Programa de Fidelidade</h3>

              <div className="bg-gradient-to-r from-amber-100 to-yellow-100 rounded-xl p-6 mb-8">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-2xl font-bold text-amber-900">Seus Pontos</h4>
                    <p className="text-amber-700">Acumule pontos seguindo suas rotinas e interagindo no app. Troque por recompensas</p>
                  </div>
                  <div className="text-5xl font-bold text-amber-600">{loyaltyPoints}</div>
                </div>
                <Progress value={(loyaltyPoints / 500) * 100} className="h-3" />
                <p className="text-sm text-amber-700 mt-2">
                  Faltam {500 - loyaltyPoints} pontos para o próximo nível
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="text-xl font-semibold text-gray-800">Como Ganhar Pontos</h4>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <Card className="p-4 bg-purple-50">
                    <div className="flex items-center gap-3 mb-2">
                      <CheckCircle className="w-6 h-6 text-purple-600" />
                      <h5 className="font-semibold text-gray-800">Completar Tasks</h5>
                    </div>
                    <p className="text-sm text-gray-600">+5 a +20 pontos por task</p>
                  </Card>

                  <Card className="p-4 bg-pink-50">
                    <div className="flex items-center gap-3 mb-2">
                      <Heart className="w-6 h-6 text-pink-600" />
                      <h5 className="font-semibold text-gray-800">Compartilhar Progresso</h5>
                    </div>
                    <p className="text-sm text-gray-600">+10 pontos</p>
                  </Card>

                  <Card className="p-4 bg-blue-50">
                    <div className="flex items-center gap-3 mb-2">
                      <ShoppingBag className="w-6 h-6 text-blue-600" />
                      <h5 className="font-semibold text-gray-800">Comprar Produtos</h5>
                    </div>
                    <p className="text-sm text-gray-600">+1 ponto por R$1</p>
                  </Card>

                  <Card className="p-4 bg-indigo-50">
                    <div className="flex items-center gap-3 mb-2">
                      <Award className="w-6 h-6 text-indigo-600" />
                      <h5 className="font-semibold text-gray-800">Fazer Nova Análise</h5>
                    </div>
                    <p className="text-sm text-gray-600">+30 pontos</p>
                  </Card>
                </div>
              </div>

              <div className="mt-8">
                <h4 className="text-xl font-semibold text-gray-800 mb-4">Resgatar Recompensas</h4>
                <div className="space-y-3">
                  <Card className="p-4 flex items-center justify-between hover:shadow-lg transition-shadow">
                    <div>
                      <h5 className="font-semibold text-gray-800">10% de Desconto</h5>
                      <p className="text-sm text-gray-600">Em qualquer produto</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-purple-600">100 pontos</p>
                      <Button size="sm" className="mt-2" disabled={loyaltyPoints < 100}>
                        {loyaltyPoints >= 100 ? 'Resgatar' : 'Bloqueado'}
                      </Button>
                    </div>
                  </Card>

                  <Card className="p-4 flex items-center justify-between hover:shadow-lg transition-shadow">
                    <div>
                      <h5 className="font-semibold text-gray-800">Consulta Gratuita</h5>
                      <p className="text-sm text-gray-600">Com especialista</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-pink-600">250 pontos</p>
                      <Button size="sm" className="mt-2" disabled={loyaltyPoints < 250}>
                        {loyaltyPoints >= 250 ? 'Resgatar' : 'Bloqueado'}
                      </Button>
                    </div>
                  </Card>

                  <Card className="p-4 flex items-center justify-between hover:shadow-lg transition-shadow">
                    <div>
                      <h5 className="font-semibold text-gray-800">Kit Completo</h5>
                      <p className="text-sm text-gray-600">Produtos premium</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-indigo-600">500 pontos</p>
                      <Button size="sm" className="mt-2" disabled={loyaltyPoints < 500}>
                        {loyaltyPoints >= 500 ? 'Resgatar' : 'Bloqueado'}
                      </Button>
                    </div>
                  </Card>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
