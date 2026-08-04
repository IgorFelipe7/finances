import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/config/supabase'
import type { SignInInput, SignUpInput } from '@/features/auth/schemas/auth.schema'

function friendlyAuthError(message: string) {
  if (message.includes('Invalid login credentials')) {
    return 'Credenciais inválidas. Verifique seu e-mail e senha.'
  }
  if (message.includes('Email not confirmed')) {
    return 'Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.'
  }
  if (message.includes('User already registered')) {
    return 'Este e-mail já está cadastrado. Tente entrar.'
  }
  return message
}

export function useSignIn() {
  return useMutation({
    mutationFn: async ({ email, password }: SignInInput) => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      toast.success('Login realizado com sucesso!')
    },
    onError: (error) => {
      toast.error(friendlyAuthError(error.message))
    },
  })
}

export function useSignUp() {
  return useMutation({
    mutationFn: async ({ email, password }: SignUpInput) => {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      if (data.session) {
        toast.success('Conta criada com sucesso!')
      } else {
        toast.success('Conta criada! Verifique seu e-mail para confirmar o cadastro.')
      }
    },
    onError: (error) => {
      toast.error(friendlyAuthError(error.message))
    },
  })
}
