import { useAuth } from "@/contexts/AuthContext"
import { Navigate } from "react-router-dom"

export default function ProtectedRoute({ children }: any) {
  const { token, isLoading } = useAuth()

  if (isLoading) return null

  // ❌ kalau belum login → ke login
  if (!token) return <Navigate to="/login" replace />

  // ✅ kalau sudah login → lanjut
  return children
}