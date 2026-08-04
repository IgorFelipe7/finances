import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useSignIn, useSignUp } from '@/features/auth/hooks/useAuthMutations'
import {
  signInSchema,
  signUpSchema,
  type SignInInput,
  type SignUpInput,
} from '@/features/auth/schemas/auth.schema'

function SignInForm() {
  const signIn = useSignIn()
  const form = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  })

  function onSubmit(values: SignInInput) {
    signIn.mutate(values)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4" noValidate>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-mail</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="voce@email.com"
                  autoComplete="email"
                  disabled={signIn.isPending}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Senha</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={signIn.isPending}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={signIn.isPending} className="mt-2 w-full">
          {signIn.isPending ? 'Entrando...' : 'Entrar'}
        </Button>
      </form>
    </Form>
  )
}

function SignUpForm() {
  const signUp = useSignUp()
  const form = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: '', password: '' },
  })

  function onSubmit(values: SignUpInput) {
    signUp.mutate(values, {
      onSuccess: () => form.reset(),
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4" noValidate>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-mail</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="voce@email.com"
                  autoComplete="email"
                  disabled={signUp.isPending}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Senha</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Mínimo de 6 caracteres"
                  autoComplete="new-password"
                  disabled={signUp.isPending}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={signUp.isPending} className="mt-2 w-full">
          {signUp.isPending ? 'Criando conta...' : 'Criar conta'}
        </Button>
      </form>
    </Form>
  )
}

export function LoginPage() {
  return (
    <div className="flex min-h-svh items-center justify-center p-4">
      <div className="glass-panel w-full max-w-sm rounded-xl p-8">
        <div className="mb-6 text-center">
          <h1 className="text-lg font-medium text-foreground">Bem-vindo</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Entre com sua conta ou crie uma nova para continuar.
          </p>
        </div>
        <Tabs defaultValue="sign-in">
          <TabsList className="w-full">
            <TabsTrigger value="sign-in" className="flex-1">
              Entrar
            </TabsTrigger>
            <TabsTrigger value="sign-up" className="flex-1">
              Criar Conta
            </TabsTrigger>
          </TabsList>
          <TabsContent value="sign-in" className="mt-6">
            <SignInForm />
          </TabsContent>
          <TabsContent value="sign-up" className="mt-6">
            <SignUpForm />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
