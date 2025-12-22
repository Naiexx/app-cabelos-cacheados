import { createClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Criar cliente Supabase usando @supabase/supabase-js
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  // Obter token de autenticação dos cookies
  const authToken = request.cookies.get('sb-access-token')?.value || 
                    request.cookies.get('sb-refresh-token')?.value

  let user = null
  
  // Se houver token, tentar obter usuário
  if (authToken) {
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
      if (!authError && authUser) {
        user = authUser
      }
    } catch (err) {
      console.error('Erro ao obter usuário:', err)
    }
  }

  // 🔥 PROTEÇÃO DO DASHBOARD - VERIFICAR PAGAMENTO
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    console.log('🔒 Middleware: Verificando acesso ao dashboard...')
    
    // ✅ CORREÇÃO: Verificar também se há authToken nos cookies (sistema local de autenticação)
    const authTokenCookie = request.cookies.get('authToken')?.value
    const hasLocalAuth = !!authTokenCookie
    
    console.log('🔍 Middleware: authToken cookie presente?', hasLocalAuth)
    console.log('🔍 Middleware: Supabase user presente?', !!user)
    
    // Se não estiver autenticado por NENHUM método, redirecionar para home
    if (!user && !hasLocalAuth) {
      console.log('❌ Middleware: Usuário não autenticado - redirecionando para home')
      return NextResponse.redirect(new URL('/', request.url))
    }

    // ✅ Se tem autenticação local (authToken), permitir acesso direto ao dashboard
    if (hasLocalAuth && !user) {
      console.log('✅ Middleware: Autenticação local detectada - permitindo acesso ao dashboard')
      return response
    }

    // Se chegou aqui, tem usuário Supabase - verificar pagamento
    console.log('✅ Middleware: Usuário Supabase autenticado:', user?.id)
    console.log('🔍 Middleware: Verificando status de pagamento na tabela users...')

    try {
      // Verificar se usuário pagou na tabela users
      const { data: userData, error: dbError } = await supabase
        .from('users')
        .select('has_paid')
        .eq('id', user!.id)
        .single()

      if (dbError) {
        console.error('❌ Middleware: Erro ao buscar dados do usuário:', dbError)
        console.error('Detalhes do erro:', JSON.stringify(dbError, null, 2))
        // Se houver erro ao buscar, redirecionar para home por segurança
        return NextResponse.redirect(new URL('/', request.url))
      }

      console.log('📊 Middleware: Dados do usuário encontrados:', JSON.stringify(userData, null, 2))
      console.log('💰 Middleware: has_paid =', userData?.has_paid)

      // 🔥 VERIFICAÇÃO RIGOROSA: Se não pagou (has_paid = false ou null), bloquear acesso
      if (!userData || userData.has_paid !== true) {
        console.log('🚫 Middleware: ACESSO NEGADO - Usuário NÃO pagou')
        console.log('Redirecionando para home...')
        return NextResponse.redirect(new URL('/', request.url))
      }

      console.log('✅ Middleware: ACESSO PERMITIDO - Usuário pagou com sucesso!')
    } catch (err) {
      console.error('❌ Middleware: Erro inesperado ao verificar pagamento:', err)
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/ (API routes - NUNCA bloquear)
     * - checkout (permitir acesso ao checkout sem verificação)
     */
    '/((?!_next/static|_next/image|favicon.ico|icon.svg|api/|checkout).*)',
  ],
}
