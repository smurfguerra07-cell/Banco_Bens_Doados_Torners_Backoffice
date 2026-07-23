// Edge Function: cria um utilizador de staff (login + perfil) sem
// precisar de confirmação por email. Só pode ser chamada por alguém
// já autenticado com cargo administrador, gestor ou operador.
//
// Usa a service_role key — por isso TEM de correr aqui (servidor),
// nunca no browser.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

const CARGOS_COM_PERMISSAO = ["administrador", "gestor", "operador"]

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) {
      return jsonResponse({ error: "Não autenticado." }, 401)
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!

    // Cliente com o token de quem chamou — só para identificar quem é.
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: userData, error: userError } = await callerClient.auth.getUser()
    if (userError || !userData.user) {
      return jsonResponse({ error: "Sessão inválida." }, 401)
    }

    // Cliente com privilégios de administrador (ignora RLS).
    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    const { data: callerProfile } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", userData.user.id)
      .maybeSingle()

    if (!callerProfile || !CARGOS_COM_PERMISSAO.includes(callerProfile.role)) {
      return jsonResponse({ error: "Sem permissão para criar utilizadores." }, 403)
    }

    const body = await req.json()
    const { email, password, full_name, telefone, role, deve_alterar_password } = body

    if (!email || !password || !full_name || !role) {
      return jsonResponse({ error: "Faltam dados obrigatórios." }, 400)
    }

    if (password.length < 6) {
      return jsonResponse({ error: "A palavra-passe precisa de pelo menos 6 caracteres." }, 400)
    }

    const { data: novoUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (createError || !novoUser.user) {
      return jsonResponse(
        { error: createError?.message ?? "Não foi possível criar o login." },
        400
      )
    }

    const { error: profileError } = await adminClient.from("profiles").insert({
      id: novoUser.user.id,
      role,
      full_name,
      telefone: telefone || null,
      deve_alterar_password: Boolean(deve_alterar_password),
    })

    if (profileError) {
      // Evita ficar um login "órfão" sem perfil se isto falhar.
      await adminClient.auth.admin.deleteUser(novoUser.user.id)
      return jsonResponse({ error: profileError.message }, 400)
    }

    return jsonResponse({ id: novoUser.user.id })
  } catch (err) {
    return jsonResponse({ error: String(err) }, 500)
  }
})
