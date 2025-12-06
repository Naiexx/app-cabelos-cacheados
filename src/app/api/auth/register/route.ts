import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json()

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      )
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      )
    }

    // Validar senha (mínimo 6 caracteres)
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'A senha deve ter no mínimo 6 caracteres' },
        { status: 400 }
      )
    }

    // VERIFICAR SE EMAIL JÁ EXISTE NA TABELA user_profiles
    const { data: existingUser, error: checkError } = await supabase
      .from('user_profiles')
      .select('email')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email já cadastrado' },
        { status: 400 }
      )
    }

    // Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
        }
      }
    })

    if (authError) {
      console.error('Erro ao criar usuário no Auth:', authError)
      
      if (authError.message.includes('already registered')) {
        return NextResponse.json(
          { error: 'Email já cadastrado' },
          { status: 400 }
        )
      }
      
      return NextResponse.json(
        { error: `Erro ao criar conta: ${authError.message}` },
        { status: 500 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Erro ao criar usuário' },
        { status: 500 }
      )
    }

    // INSERIR NA TABELA user_profiles (separada da auth.users)
    const { data: userData, error: userError } = await supabase
      .from('user_profiles')
      .insert({
        id: authData.user.id,
        email: email,
        name: name,
        role: 'user',
        points: 0,
        has_paid: false,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (userError) {
      console.error('Erro ao criar perfil na tabela user_profiles:', userError)
      
      // Se falhar ao criar na tabela user_profiles, informar o erro
      // Nota: não podemos deletar do Auth por limitações de permissão
      
      return NextResponse.json(
        { error: `Erro ao criar perfil: ${userError.message}` },
        { status: 500 }
      )
    }

    console.log('✅ Usuário criado com sucesso:', userData)

    const response = NextResponse.json({
      token: authData.session?.access_token,
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        points: userData.points,
        has_paid: userData.has_paid,
        created_at: userData.created_at,
      },
      success: true
    })

    // Definir cookie com o token
    if (authData.session?.access_token) {
      response.cookies.set('authToken', authData.session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30 // 30 dias
      })
    }

    return response
  } catch (error: any) {
    console.error('Erro no registro:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao criar conta' },
      { status: 500 }
    )
  }
}
