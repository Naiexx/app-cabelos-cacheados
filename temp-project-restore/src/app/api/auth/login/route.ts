import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      )
    }

    // Tentar autenticação nativa do Supabase primeiro
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    // Se autenticação nativa funcionar, usar ela
    if (!authError && authData.user) {
      // Buscar dados adicionais do usuário na tabela users
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single()

      if (userError) {
        console.error('Erro ao buscar dados do usuário:', userError)
      }

      const response = NextResponse.json({
        token: authData.session?.access_token,
        user: {
          id: authData.user.id,
          email: authData.user.email,
          name: userData?.name || authData.user.user_metadata?.name || '',
          role: userData?.role || 'user',
          created_at: authData.user.created_at,
        },
        success: true
      })

      // Definir cookie com o token para persistência
      if (authData.session?.access_token) {
        response.cookies.set('authToken', authData.session.access_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 30 // 30 dias
        })
      }

      return response
    }

    // Se autenticação nativa falhar, tentar buscar usuário na tabela users
    // (para contas criadas diretamente no banco)
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'Email ou senha incorretos' },
        { status: 401 }
      )
    }

    // Para usuários na tabela sem autenticação Supabase,
    // precisamos criar a conta no Supabase Auth
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: userData.name,
        }
      }
    })

    if (signUpError) {
      console.error('Erro ao migrar usuário para Supabase Auth:', signUpError)
      return NextResponse.json(
        { error: 'Email ou senha incorretos' },
        { status: 401 }
      )
    }

    // Atualizar o ID do usuário na tabela users se necessário
    if (signUpData.user && signUpData.user.id !== userData.id) {
      await supabase
        .from('users')
        .update({ id: signUpData.user.id })
        .eq('email', email)
    }

    // Fazer login novamente após criar a conta
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (loginError || !loginData.user) {
      return NextResponse.json(
        { error: 'Email ou senha incorretos' },
        { status: 401 }
      )
    }

    const response = NextResponse.json({
      token: loginData.session?.access_token,
      user: {
        id: loginData.user.id,
        email: loginData.user.email,
        name: userData.name,
        role: userData.role || 'user',
        created_at: loginData.user.created_at,
      },
      success: true
    })

    // Definir cookie com o token para persistência
    if (loginData.session?.access_token) {
      response.cookies.set('authToken', loginData.session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30 // 30 dias
      })
    }

    return response
  } catch (error: any) {
    console.error('Erro no login:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao fazer login' },
      { status: 500 }
    )
  }
}
