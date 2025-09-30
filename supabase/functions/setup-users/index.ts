import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Usar service role para ter permissões de admin
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    console.log('Iniciando criação de usuários Viainfra...');

    // 1. Criar empresa Viainfra
    const { data: existingCompany } = await supabaseAdmin
      .from('companies')
      .select('id')
      .eq('name', 'Viainfra')
      .single();

    let companyId: string;

    if (existingCompany) {
      companyId = existingCompany.id;
      console.log('Empresa Viainfra já existe:', companyId);
    } else {
      const { data: newCompany, error: companyError } = await supabaseAdmin
        .from('companies')
        .insert({
          name: 'Viainfra',
          plan: 'enterprise',
          settings: {
            timezone: 'America/Sao_Paulo',
            language: 'pt-BR',
          },
        })
        .select()
        .single();

      if (companyError) throw companyError;
      companyId = newCompany.id;
      console.log('Empresa Viainfra criada:', companyId);
    }

    // 2. Definir usuários
    const users = [
      {
        email: 'elisabete.silva@viainfra.com.br',
        password: 'atendimento@25',
        name: 'Elisabete Silva',
        role: 'admin',
      },
      {
        email: 'atendimento@viainfra.com.br',
        password: 'atendimento@25',
        name: 'Joicy Souza',
        role: 'user',
      },
      {
        email: 'manutencao@viainfra.com.br',
        password: 'atendimento@25',
        name: 'Suelem Souza',
        role: 'user',
      },
      {
        email: 'gestaofinanceira@vianfra.com.br',
        password: 'atendimento@25',
        name: 'Giovanna Ferreira',
        role: 'user',
      },
      {
        email: 'sandra.romano@vialogistic.com.br',
        password: 'atendimento@25',
        name: 'Sandra Romano',
        role: 'user',
      },
    ];

    const results = [];

    // 3. Criar cada usuário
    for (const user of users) {
      try {
        console.log(`Criando usuário: ${user.email}`);

        // Verificar se já existe
        const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
        const userExists = existingUser.users.find(u => u.email === user.email);

        let userId: string;

        if (userExists) {
          userId = userExists.id;
          console.log(`Usuário ${user.email} já existe (ID: ${userId})`);
          
          // Atualizar senha se necessário
          await supabaseAdmin.auth.admin.updateUserById(userId, {
            password: user.password,
          });
        } else {
          // Criar novo usuário
          const { data: newUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: user.email,
            password: user.password,
            email_confirm: true, // Confirmar email automaticamente
            user_metadata: {
              name: user.name,
            },
          });

          if (authError) throw authError;
          userId = newUser.user.id;
          console.log(`Usuário ${user.email} criado (ID: ${userId})`);
        }

        // Verificar se perfil já existe
        const { data: existingProfile } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('user_id', userId)
          .single();

        if (existingProfile) {
          // Atualizar perfil existente
          await supabaseAdmin
            .from('profiles')
            .update({
              company_id: companyId,
              name: user.name,
              email: user.email,
              role: user.role,
              permissions: user.role === 'admin' ? ['all'] : ['read', 'write'],
            })
            .eq('user_id', userId);
          
          console.log(`Perfil de ${user.email} atualizado`);
        } else {
          // Criar novo perfil
          await supabaseAdmin
            .from('profiles')
            .insert({
              user_id: userId,
              company_id: companyId,
              name: user.name,
              email: user.email,
              role: user.role,
              permissions: user.role === 'admin' ? ['all'] : ['read', 'write'],
            });
          
          console.log(`Perfil de ${user.email} criado`);
        }

        results.push({
          email: user.email,
          name: user.name,
          role: user.role,
          status: 'success',
        });

      } catch (error) {
        console.error(`Erro ao criar ${user.email}:`, error);
        results.push({
          email: user.email,
          name: user.name,
          role: user.role,
          status: 'error',
          error: error.message,
        });
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Setup de usuários concluído',
        company: {
          id: companyId,
          name: 'Viainfra',
        },
        users: results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in setup-users:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
