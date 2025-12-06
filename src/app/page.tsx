'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Sparkles, Camera, Calendar, Award, ShoppingBag, Heart, User, LogOut, ExternalLink, ChevronDown, ChevronUp, Settings, Search } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])
  const [showStore, setShowStore] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    // Verificar se usuário está logado
    if (typeof window !== 'undefined') {
      const authToken = localStorage.getItem('authToken')
      const userData = localStorage.getItem('user')
      
      if (authToken && userData) {
        setUser(JSON.parse(userData))
      }
    }

    // Carregar produtos da loja
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/store/products')
      if (response.ok) {
        const data = await response.json()
        setProducts(data.products || [])
      }
    } catch (error) {
      console.error('Erro ao carregar produtos:', error)
    }
  }

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken')
      localStorage.removeItem('user')
    }
    setUser(null)
    router.refresh()
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

  // Filtrar produtos com base na busca
  const filteredProducts = products.filter((product) => {
    const productName = (product.nome || product.name || '').toLowerCase()
    const productDescription = (product.descricao || product.description || '').toLowerCase()
    const query = searchQuery.toLowerCase()
    
    return productName.includes(query) || productDescription.includes(query)
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative w-10 h-10">
              <Image
                src="https://k6hrqrxuu8obbfwn.public.blob.vercel-storage.com/temp/7a2d6fd4-e054-471f-9b83-6b1bf3171c1f.png"
                alt="Curlara Logo"
                fill
                className="object-contain"
                style={{ filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.8))' }}
              />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-rose-400 to-purple-400 bg-clip-text text-transparent">
              Curlara
            </h1>
          </Link>
          
          {user ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden sm:flex items-center gap-2 bg-rose-50 px-3 py-2 rounded-lg">
                <User className="w-4 h-4 text-rose-400" />
                <span className="text-sm font-medium text-rose-600">{user.name}</span>
              </div>
              <Link href="/settings">
                <Button 
                  variant="outline"
                  className="border-purple-200 text-purple-600 hover:bg-purple-50"
                >
                  <Settings className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Configurações</span>
                </Button>
              </Link>
              <Button 
                onClick={handleLogout}
                variant="outline"
                className="border-rose-200 text-rose-600 hover:bg-rose-50"
              >
                <LogOut className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Sair</span>
              </Button>
            </div>
          ) : (
            <Link href="/login">
              <Button className="bg-gradient-to-r from-rose-300 to-purple-300 hover:from-rose-400 hover:to-purple-400 text-white text-sm sm:text-base">
                Entrar
              </Button>
            </Link>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 sm:py-16 md:py-24">
        <div className="text-center max-w-4xl mx-auto">
          {user && (
            <div className="mb-6 bg-white/60 backdrop-blur-sm rounded-2xl p-4 inline-block">
              <p className="text-lg text-rose-600">
                Olá, <span className="font-bold">{user.name}</span>! 👋
              </p>
            </div>
          )}
          <h2 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-rose-400 via-pink-400 to-purple-400 bg-clip-text text-transparent leading-tight">
            Descubra o Poder dos Seus Cachos
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-700 mb-6 sm:mb-8 leading-relaxed px-4">
            Análise personalizada com inteligência artificial, rotinas sob medida e uma comunidade 
            que celebra a beleza natural dos cabelos cacheados e crespos.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
            {user ? (
              <Link href="/dashboard" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-rose-300 to-purple-300 hover:from-rose-400 hover:to-purple-400 text-white text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6">
                  <Camera className="w-5 h-5 mr-2" />
                  Ir para Dashboard
                </Button>
              </Link>
            ) : (
              <Link href="/login" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-rose-300 to-purple-300 hover:from-rose-400 hover:to-purple-400 text-white text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6">
                  <Camera className="w-5 h-5 mr-2" />
                  Começar Agora
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Loja Integrada - Colapsável */}
      <section className="container mx-auto px-4 py-12 sm:py-16">
        <div className="text-center mb-6">
          <Button
            onClick={() => setShowStore(!showStore)}
            size="lg"
            className="bg-gradient-to-r from-rose-300 to-purple-300 hover:from-rose-400 hover:to-purple-400 text-white text-lg px-8 py-6 shadow-lg"
          >
            <ShoppingBag className="w-5 h-5 mr-2" />
            {showStore ? 'Ocultar Loja Integrada' : 'Ver Loja Integrada'}
            {showStore ? <ChevronUp className="w-5 h-5 ml-2" /> : <ChevronDown className="w-5 h-5 ml-2" />}
          </Button>
        </div>

        {showStore && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-500">
            <h3 className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12 text-gray-800 px-4">
              Nossa Loja de Produtos
            </h3>

            {/* Barra de Pesquisa */}
            <div className="max-w-2xl mx-auto mb-8">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Buscar produtos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-4 py-6 text-base border-2 border-rose-200 focus:border-rose-400 rounded-xl"
                />
              </div>
              {searchQuery && (
                <p className="text-sm text-gray-600 mt-3 text-center">
                  {filteredProducts.length} {filteredProducts.length === 1 ? 'produto encontrado' : 'produtos encontrados'}
                </p>
              )}
            </div>

            {/* Lista de Produtos */}
            {filteredProducts.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {filteredProducts.map((product) => {
                  // Usar a coluna "url da imagem" apenas para exibir a imagem
                  const imageUrl = product['url da imagem'] || product.url_da_imagem || product.image_url
                  
                  return (
                    <Card 
                      key={product.id} 
                      className="p-6 hover:shadow-xl transition-all duration-300 border-2 hover:border-rose-200 bg-white"
                    >
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
                <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">
                  {searchQuery ? 'Nenhum produto encontrado com essa busca.' : 'Nenhum produto disponível no momento.'}
                </p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-12 sm:py-16">
        <h3 className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12 text-gray-800 px-4">
          Tudo que Você Precisa para Cuidar dos Seus Cachos
        </h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <Card className="p-5 sm:p-6 hover:shadow-xl transition-all duration-300 border-2 hover:border-rose-200 bg-white active:scale-95">
            <div className="w-12 h-12 bg-gradient-to-br from-rose-300 to-pink-400 rounded-xl flex items-center justify-center mb-4">
              <Camera className="w-6 h-6 text-white" />
            </div>
            <h4 className="text-lg sm:text-xl font-bold mb-3 text-gray-800">Análise com IA</h4>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
              Tire uma foto e receba uma análise completa do seu tipo de cacho, porosidade, 
              densidade e saúde dos fios usando inteligência artificial.
            </p>
          </Card>

          <Card className="p-5 sm:p-6 hover:shadow-xl transition-all duration-300 border-2 hover:border-purple-200 bg-white active:scale-95">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-300 to-pink-400 rounded-xl flex items-center justify-center mb-4">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <h4 className="text-lg sm:text-xl font-bold mb-3 text-gray-800">Rotina Personalizada</h4>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
              Receba uma rotina de cuidados sob medida com produtos, técnicas e cronograma 
              adaptados às necessidades específicas do seu cabelo.
            </p>
          </Card>

          <Card className="p-5 sm:p-6 hover:shadow-xl transition-all duration-300 border-2 hover:border-pink-200 bg-white active:scale-95">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-300 to-rose-400 rounded-xl flex items-center justify-center mb-4">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <h4 className="text-lg sm:text-xl font-bold mb-3 text-gray-800">Alertas de Saúde</h4>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
              Monitore a saúde dos seus fios com alertas inteligentes sobre ressecamento, 
              quebra e danos químicos, com dicas de recuperação.
            </p>
          </Card>

          <Card className="p-5 sm:p-6 hover:shadow-xl transition-all duration-300 border-2 hover:border-rose-200 bg-white active:scale-95">
            <div className="w-12 h-12 bg-gradient-to-br from-rose-300 to-purple-400 rounded-xl flex items-center justify-center mb-4">
              <Award className="w-6 h-6 text-white" />
            </div>
            <h4 className="text-lg sm:text-xl font-bold mb-3 text-gray-800">Programa de Fidelidade</h4>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
              Acumule pontos seguindo suas rotinas e interagindo no app. Troque por recompensas
            </p>
          </Card>

          <Card className="p-5 sm:p-6 hover:shadow-xl transition-all duration-300 border-2 hover:border-purple-200 bg-white active:scale-95">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-300 to-rose-400 rounded-xl flex items-center justify-center mb-4">
              <ShoppingBag className="w-6 h-6 text-white" />
            </div>
            <h4 className="text-lg sm:text-xl font-bold mb-3 text-gray-800">Loja Integrada</h4>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
              Compre produtos recomendados diretamente no app, com curadoria especial 
              para o seu tipo de cabelo e necessidades.
            </p>
          </Card>

          <Card className="p-5 sm:p-6 hover:shadow-xl transition-all duration-300 border-2 hover:border-pink-200 bg-white active:scale-95">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-300 to-purple-400 rounded-xl flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h4 className="text-lg sm:text-xl font-bold mb-3 text-gray-800">Tutoriais Exclusivos</h4>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
              Aprenda técnicas de finalização, hidratação e tratamentos com vídeos 
              educativos criados por especialistas em cabelos cacheados.
            </p>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-12 sm:py-16">
        <Card className="bg-gradient-to-r from-rose-300 via-pink-300 to-purple-300 p-8 sm:p-12 text-center text-white shadow-2xl">
          <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
            {user ? 'Continue Sua Jornada!' : 'Pronta para Transformar Seus Cachos?'}
          </h3>
          <p className="text-base sm:text-lg mb-6 sm:mb-8 opacity-90 max-w-2xl mx-auto px-4">
            {user 
              ? 'Explore todas as funcionalidades e descubra o melhor para seus cachos.'
              : 'Junte-se a milhares de pessoas que já descobriram o poder da análise personalizada e estão amando seus cachos como nunca antes.'
            }
          </p>
          {user ? (
            <Link href="/dashboard">
              <Button size="lg" className="bg-white text-rose-500 hover:bg-gray-100 text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 active:scale-95 transition-transform">
                Ir para Dashboard
              </Button>
            </Link>
          ) : (
            <Link href="/login">
              <Button size="lg" className="bg-white text-rose-500 hover:bg-gray-100 text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 active:scale-95 transition-transform">
                Começar Minha Jornada
              </Button>
            </Link>
          )}
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white/80 backdrop-blur-sm py-6 sm:py-8">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p className="flex items-center justify-center gap-2 text-sm sm:text-base">
            Feito com <Heart className="w-4 h-4 text-red-500 fill-red-500" /> para cabelos cacheados
          </p>
          <p className="text-xs sm:text-sm mt-2">© 2024 Curlara. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
