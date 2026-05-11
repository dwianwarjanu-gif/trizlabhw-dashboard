import { authApi } from '@/services/api'
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { User, LoginCredentials, RegisterData } from '@/types/auth'

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
  refreshToken: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  const isAuthenticated = !!token

  // Initialize auth state from localStorage
useEffect(() => {
  const initializeAuth = async () => {
    try {
      const storedToken = localStorage.getItem("token")
      const storedUser = localStorage.getItem("user")

      if (storedToken) {
        setToken(storedToken)

        if (storedUser && storedUser !== "undefined") {
          setUser(JSON.parse(storedUser))
        }

        try {
          const res = await authApi.getProfile()
          setUser(res.data.user)
        } catch (err) {
          console.log("PROFILE ERROR:", err)
          // ❗ jangan logout disini
        }
      }
    } catch (err) {
      console.error("INIT ERROR:", err)
    }

    setIsLoading(false)
  }

  initializeAuth()
}, [])


const login = async (data: { email: string; password: string }) => {
  try {
    setIsLoading(true)

    console.log("LOGIN DATA:", data)

    const res = await authApi.login(data)

    const { user, token } = res.data

    setToken(token)
    setUser(user)

    localStorage.setItem("token", token)
    localStorage.setItem("user", JSON.stringify(user))

    toast.success("Login berhasil")
    navigate("/dashboard")

  } catch (error: any) {
    console.log("LOGIN ERROR:", error)
    toast.error(error?.response?.data?.error || "Login gagal")
  } finally {
    setIsLoading(false)
  }
}

  const register = async (data: RegisterData) => {
    try {
      setIsLoading(true)
      await authApi.register(data)
      
      toast.success('Registrasi berhasil! Silakan login.')
      navigate('/login')
    } catch (error: any) {
      const message = error.res?.data?.message || 'Registrasi gagal'
      toast.error(message)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      if (token) {
        await authApi.logout()
      }
    } catch (error) {
      console.error('Logout API call failed:', error)
    } finally {
      // Clear auth state regardless of API call result
      setUser(null)
      setToken(null)
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      
      toast.success('Logout berhasil!')
      navigate('/login')
    }
  }

  const refreshToken = async () => {
    try {
      const res = await authApi.refreshToken()
      const { token: newToken } = res.data

      setToken(newToken)
      localStorage.setItem('token', newToken)
    } catch (error) {
      console.error('Token refresh failed:', error)
      logout()
      throw error
    }
  }

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    refreshToken,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType | null => {
  return useContext(AuthContext)
}
