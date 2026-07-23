import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter, Route, Routes } from "react-router"
import { Toaster } from "react-hot-toast"
import { AuthProvider } from "@/contexts/AuthContext"
import { DashboardLayout } from "@/layouts/DashboardLayout"
import { LoginPage } from "@/pages/LoginPage"
import { DashboardPage } from "@/pages/DashboardPage"
import { ToniersPage } from "@/pages/ToniersPage"
import { PedidosPage } from "@/pages/PedidosPage"
import { EmpresasPage } from "@/pages/EmpresasPage"
import { TicketsPage } from "@/pages/TicketsPage"
import { UtilizadoresPage } from "@/pages/UtilizadoresPage"
import { RelatoriosPage } from "@/pages/RelatoriosPage"
import { SettingsPage } from "@/pages/SettingsPage"

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
              <Route path="/tickets" element={<TicketsPage />} />
              <Route path="/empresas" element={<EmpresasPage />} />
              <Route path="/utilizadores" element={<UtilizadoresPage />} />
              <Route path="/relatorios" element={<RelatoriosPage />} />
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
