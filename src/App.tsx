import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter, Route, Routes } from "react-router"
import { Toaster } from "react-hot-toast"
import { AuthProvider } from "@/contexts/AuthContext"
import { DashboardLayout } from "@/layouts/DashboardLayout"
import { LoginPage } from "@/pages/LoginPage"
import { DashboardPage } from "@/pages/DashboardPage"
import { ToniersPage } from "@/pages/ToniersPage"
import { PedidosPage } from "@/pages/PedidosPage"

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
            </Route>
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" />
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
