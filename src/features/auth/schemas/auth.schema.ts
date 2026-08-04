import { z } from 'zod'

export const signInSchema = z.object({
  email: z.email('Informe um e-mail válido.'),
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres.'),
})

export type SignInInput = z.infer<typeof signInSchema>

export const signUpSchema = z.object({
  email: z.email('Informe um e-mail válido.'),
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres.'),
})

export type SignUpInput = z.infer<typeof signUpSchema>
