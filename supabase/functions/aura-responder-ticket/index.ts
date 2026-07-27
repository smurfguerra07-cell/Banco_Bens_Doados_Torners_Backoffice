// Edge Function: a Aura tenta responder dentro de um ticket normal
// (não só na sua bolha de chat separada). Só atua enquanto nenhum
// membro da equipa tiver respondido ainda nesse ticket, e insere a
// sua mensagem com autor_id = null (ver 0030_ticket_mensagens_aura.sql
// para a razão de não haver um "utilizador Aura" a sério).
//
// Usa a service_role key — por isso tem de correr aqui (servidor):
// só assim consegue inserir uma mensagem com autor_id nulo.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import {
  detetarCategoria,
  encontrarPedidoReferido,
  encontrarToner,
  explicarEstadoPedido,
  resolverPergunta,
  type CandidatoArtigo,
  type CandidatoToner,
  type Pedido,
} from "./_motor.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

const MENSAGEM_SEM_RESPOSTA =
  "Não tenho a certeza suficiente para te responder sobre isto — já notifiquei a nossa equipa de suporte e vão entrar em contacto contigo em breve."

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

interface KbArtigoRow {
  id: string
  categoria: string
  titulo: string
  resumo: string | null
  conteudo: string
  palavras_chave: string[]
  sinonimos: string[]
}

interface KbAssociacaoRow {
  artigo_id: string
  toner_id: string | null
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) return jsonResponse({ error: "Não autenticado." }, 401)

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: userData, error: userError } = await callerClient.auth.getUser()
    if (userError || !userData.user) return jsonResponse({ error: "Sessão inválida." }, 401)

    const admin = createClient(supabaseUrl, serviceRoleKey)

    const { ticketId } = await req.json()
    if (!ticketId) return jsonResponse({ error: "Falta o ticketId." }, 400)

    const { data: ticket, error: ticketError } = await admin
      .from("tickets")
      .select("*")
      .eq("id", ticketId)
      .single()
    if (ticketError || !ticket) return jsonResponse({ error: "Ticket não encontrado." }, 404)

    const { data: callerProfile } = await admin
      .from("profiles")
      .select("role")
      .eq("id", userData.user.id)
      .maybeSingle()
    const chamadorEStaff = callerProfile && ["administrador", "gestor", "operador", "leitor"].includes(callerProfile.role)
    if (ticket.profile_id !== userData.user.id && !chamadorEStaff) {
      return jsonResponse({ error: "Sem permissão para este ticket." }, 403)
    }

    const { data: mensagens } = await admin
      .from("ticket_mensagens")
      .select("*")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true })

    const lista = mensagens ?? []
    if (lista.length === 0) return jsonResponse({ ignorado: true, motivo: "sem_mensagens" })

    const ultima = lista[lista.length - 1]
    if (ultima.autor_id !== ticket.profile_id) {
      return jsonResponse({ ignorado: true, motivo: "ultima_nao_e_do_cliente" })
    }
    const jaRespondidaPorStaff = lista.some(
      (m) => m.autor_id !== null && m.autor_id !== ticket.profile_id
    )
    if (jaRespondidaPorStaff) {
      return jsonResponse({ ignorado: true, motivo: "ja_tem_resposta_de_staff" })
    }

    const mensagensCliente = lista
      .filter((m) => m.autor_id === ticket.profile_id && m.conteudo)
      .map((m) => m.conteudo as string)
    const pergunta = [ticket.assunto, ...mensagensCliente].join("\n")

    const [{ data: artigosRaw }, { data: associacoesRaw }, { data: toners }, { data: pedidos }] = await Promise.all([
      admin.from("kb_artigos").select("id, categoria, titulo, resumo, conteudo, palavras_chave, sinonimos").eq("estado", "publicado"),
      admin.from("kb_associacoes_produto").select("artigo_id, toner_id"),
      admin.from("toners").select("id, marca, modelo, referencia"),
      admin
        .from("pedidos")
        .select("id, numero, estado, motivo_recusa, pedido_itens ( toners ( marca, modelo, referencia ) )")
        .eq("solicitante_id", ticket.profile_id)
        .order("created_at", { ascending: false }),
    ])
    const artigos = (artigosRaw ?? []) as KbArtigoRow[]
    const associacoes = (associacoesRaw ?? []) as KbAssociacaoRow[]

    const categoria = detetarCategoria(pergunta) ?? undefined

    async function inserirRespostaAura(conteudo: string) {
      await admin.from("ticket_mensagens").insert({ ticket_id: ticketId, autor_id: null, conteudo })
    }

    async function registarSemResposta(categoriaDetectada: string | null, melhorScore: number | null, melhorArtigoId: string | null) {
      await admin.from("aura_perguntas_sem_resposta").insert({
        conversa_id: null,
        pergunta,
        categoria_detectada: categoriaDetectada,
        melhor_score: melhorScore,
        melhor_artigo_id: melhorArtigoId,
        profile_id: ticket.profile_id,
      })
    }

    // "Estado do pedido" usa dados ao vivo do próprio pedido, não a KB.
    if (categoria === "pedidos") {
      const pedidosCliente = (pedidos ?? []) as unknown as Pedido[]
      if (pedidosCliente.length === 0) {
        await inserirRespostaAura("Ainda não tens nenhum pedido feito na plataforma.")
        return jsonResponse({ resolvida: true })
      }
      const pedido = encontrarPedidoReferido(pergunta, pedidosCliente)
      if (pedido) {
        await inserirRespostaAura(explicarEstadoPedido(pedido))
        return jsonResponse({ resolvida: true })
      }
    }

    // Instalação/problemas: tentar identificar o toner específico primeiro.
    const candidatosToner: CandidatoToner[] = (toners ?? []).map((t) => ({
      id: t.id, marca: t.marca, modelo: t.modelo, referencia: t.referencia,
    }))
    if ((categoria === "instalacao" || categoria === "problemas") && candidatosToner.length > 0) {
      const achado = encontrarToner(pergunta, candidatosToner)
      if (achado && achado.score >= 0.34) {
        const associacao = associacoes.find((a) => a.toner_id === achado.toner.id)
        if (associacao) {
          const artigo = artigos.find((a) => a.id === associacao.artigo_id && a.categoria === categoria)
          if (artigo) {
            await inserirRespostaAura(artigo.conteudo)
            return jsonResponse({ resolvida: true, artigoId: artigo.id })
          }
        }
      }
    }

    const candidatosArtigo: CandidatoArtigo[] = artigos.map((a) => ({
      id: a.id, categoria: a.categoria, titulo: a.titulo,
      palavras_chave: a.palavras_chave, sinonimos: a.sinonimos,
    }))
    const resultado = resolverPergunta(pergunta, candidatosArtigo, categoria)

    if (resultado.tipo === "resolvida") {
      const artigo = artigos.find((a) => a.id === resultado.melhor.artigo.id)
      if (artigo) {
        await inserirRespostaAura(artigo.conteudo)
        return jsonResponse({ resolvida: true, artigoId: artigo.id })
      }
    }

    await inserirRespostaAura(MENSAGEM_SEM_RESPOSTA)
    await registarSemResposta(
      categoria ?? null,
      resultado.tipo === "resolvida" ? resultado.melhor.score : null,
      resultado.tipo === "resolvida" ? resultado.melhor.artigo.id : null
    )
    return jsonResponse({ resolvida: false })
  } catch (err) {
    return jsonResponse({ error: String(err) }, 500)
  }
})
