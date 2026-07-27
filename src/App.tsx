import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter, Route, Routes } from "react-router"
import { Toaster } from "react-hot-toast"
import { AuthProvider } from "@/contexts/AuthContext"
import { DashboardLayout } from "@/layouts/DashboardLayout"
import { RequireRole } from "@/components/auth/RequireRole"
import { LoginPage } from "@/pages/LoginPage"
import { DashboardPage } from "@/pages/DashboardPage"
import { ToniersPage } from "@/pages/ToniersPage"
import { PedidosPage } from "@/pages/PedidosPage"
import { EmpresasPage } from "@/pages/EmpresasPage"
import { TicketsPage } from "@/pages/TicketsPage"
import { UtilizadoresPage } from "@/pages/UtilizadoresPage"
import { RelatoriosPage } from "@/pages/RelatoriosPage"
import { ConhecimentoPage } from "@/pages/ConhecimentoPage"
import { ConhecimentoArtigoPage } from "@/pages/ConhecimentoArtigoPage"
import { ConhecimentoEstatisticasPage } from "@/pages/ConhecimentoEstatisticasPage"
import { PerguntasSemRespostaPage } from "@/pages/PerguntasSemRespostaPage"
import { DoacoesInteressePage } from "@/pages/DoacoesInteressePage"
import { SettingsPage } from "@/pages/SettingsPage"
import {
  podeVerConhecimento,
  podeVerDoacoesInteresse,
  podeVerInstituicoes,
  podeVerRelatorios,
  podeVerTickets,
  podeVerUtilizadores,
} from "@/types/profile"

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<DashboardLayout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/toners" element={<ToniersPage />} />
              <Route path="/pedidos" element={<PedidosPage />} />
              <Route
                path="/tickets"
                element={
                  <RequireRole permitido={podeVerTickets}>
                    <TicketsPage />
                  </RequireRole>
                }
              />
              <Route
                path="/empresas"
                element={
                  <RequireRole permitido={podeVerInstituicoes}>
                    <EmpresasPage />
                  </RequireRole>
                }
              />
              <Route
                path="/utilizadores"
                element={
                  <RequireRole permitido={podeVerUtilizadores}>
                    <UtilizadoresPage />
                  </RequireRole>
                }
              />
              <Route
                path="/relatorios"
                element={
                  <RequireRole permitido={podeVerRelatorios}>
                    <RelatoriosPage />
                  </RequireRole>
                }
              />
              <Route
                path="/conhecimento"
                element={
                  <RequireRole permitido={podeVerConhecimento}>
                    <ConhecimentoPage />
                  </RequireRole>
                }
              />
              <Route
                path="/conhecimento/estatisticas"
                element={
                  <RequireRole permitido={podeVerConhecimento}>
                    <ConhecimentoEstatisticasPage />
                  </RequireRole>
                }
              />
              <Route
                path="/conhecimento/perguntas-sem-resposta"
                element={
                  <RequireRole permitido={podeVerConhecimento}>
                    <PerguntasSemRespostaPage />
                  </RequireRole>
                }
              />
              <Route
                path="/conhecimento/:id"
                element={
                  <RequireRole permitido={podeVerConhecimento}>
                    <ConhecimentoArtigoPage />
                  </RequireRole>
                }
              />
              <Route
                path="/doacoes-interesse"
                element={
                  <RequireRole permitido={podeVerDoacoesInteresse}>
                    <DoacoesInteressePage />
                  </RequireRole>
                }
              />
              <Route path="/definicoes" element={<SettingsPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" />
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
