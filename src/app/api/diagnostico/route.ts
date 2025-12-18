import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    url: req.url,
    
    // 🔥 STRIPE
    stripe: {
      publishableKey: {
        configured: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
        value: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY 
          ? process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.substring(0, 20) + '...'
          : '❌ NÃO CONFIGURADO',
        status: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? '✅' : '❌',
      },
      secretKey: {
        configured: !!process.env.STRIPE_SECRET_KEY,
        value: process.env.STRIPE_SECRET_KEY 
          ? process.env.STRIPE_SECRET_KEY.substring(0, 20) + '...'
          : '❌ NÃO CONFIGURADO',
        status: !!process.env.STRIPE_SECRET_KEY ? '✅' : '❌',
      },
      webhookSecret: {
        configured: !!process.env.STRIPE_WEBHOOK_SECRET,
        value: process.env.STRIPE_WEBHOOK_SECRET 
          ? process.env.STRIPE_WEBHOOK_SECRET.substring(0, 15) + '...'
          : '❌ NÃO CONFIGURADO',
        status: !!process.env.STRIPE_WEBHOOK_SECRET ? '✅' : '❌',
      },
    },
    
    // 🔥 SUPABASE
    supabase: {
      url: {
        configured: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        value: process.env.NEXT_PUBLIC_SUPABASE_URL || '❌ NÃO CONFIGURADO',
        status: !!process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅' : '❌',
      },
      anonKey: {
        configured: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        value: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY 
          ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20) + '...'
          : '❌ NÃO CONFIGURADO',
        status: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅' : '❌',
      },
      serviceRoleKey: {
        configured: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        value: process.env.SUPABASE_SERVICE_ROLE_KEY 
          ? process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 20) + '...'
          : '❌ NÃO CONFIGURADO',
        status: !!process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅' : '❌',
      },
    },
    
    // 🔥 OUTRAS
    other: {
      openaiKey: {
        configured: !!process.env.OPENAI_API_KEY,
        value: process.env.OPENAI_API_KEY 
          ? process.env.OPENAI_API_KEY.substring(0, 20) + '...'
          : '❌ NÃO CONFIGURADO',
        status: !!process.env.OPENAI_API_KEY ? '✅' : '❌',
      },
      jwtSecret: {
        configured: !!process.env.JWT_SECRET,
        value: process.env.JWT_SECRET 
          ? process.env.JWT_SECRET.substring(0, 15) + '...'
          : '❌ NÃO CONFIGURADO',
        status: !!process.env.JWT_SECRET ? '✅' : '❌',
      },
    },

    // 🔥 RESUMO
    summary: {
      allConfigured: !!(
        process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY &&
        process.env.STRIPE_SECRET_KEY &&
        process.env.STRIPE_WEBHOOK_SECRET &&
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
        process.env.SUPABASE_SERVICE_ROLE_KEY &&
        process.env.OPENAI_API_KEY &&
        process.env.JWT_SECRET
      ),
      missingVariables: [
        !process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY && 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
        !process.env.STRIPE_SECRET_KEY && 'STRIPE_SECRET_KEY',
        !process.env.STRIPE_WEBHOOK_SECRET && 'STRIPE_WEBHOOK_SECRET',
        !process.env.NEXT_PUBLIC_SUPABASE_URL && 'NEXT_PUBLIC_SUPABASE_URL',
        !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        !process.env.SUPABASE_SERVICE_ROLE_KEY && 'SUPABASE_SERVICE_ROLE_KEY',
        !process.env.OPENAI_API_KEY && 'OPENAI_API_KEY',
        !process.env.JWT_SECRET && 'JWT_SECRET',
      ].filter(Boolean),
    },

    // 🔥 INSTRUÇÕES
    instructions: {
      problem: '❌ Se você está vendo variáveis NÃO CONFIGURADAS, seu site publicado NÃO VAI FUNCIONAR!',
      solution: '✅ Você precisa configurar as variáveis de ambiente na Vercel',
      steps: [
        '1. Acesse: https://vercel.com',
        '2. Entre no seu projeto',
        '3. Vá em Settings > Environment Variables',
        '4. Adicione TODAS as variáveis que aparecem como ❌',
        '5. Marque "Production" para cada variável',
        '6. Clique em Save',
        '7. Vá em Deployments e faça Redeploy',
        '8. Aguarde o deploy finalizar',
        '9. Acesse este endpoint novamente para verificar',
      ],
      documentation: 'Veja o arquivo CONFIGURACAO_PRODUCAO.md na raiz do projeto para instruções detalhadas',
    },
  }

  // 🔥 Status HTTP baseado na configuração
  const status = diagnostics.summary.allConfigured ? 200 : 500

  return NextResponse.json(diagnostics, { 
    status,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  })
}
