import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import { KeyRound, ArrowLeft } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setTimeout(() => {
      setIsSubmitted(true)
      toast({
        title: 'Email enviado',
        description:
          'Se houver uma conta associada a este email, você receberá um link de recuperação.',
      })
    }, 800)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-3 text-center">
          <div className="flex justify-center">
            <div className="bg-primary/10 p-3 rounded-full">
              <KeyRound className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Recuperar Senha</CardTitle>
          <CardDescription>
            Digite seu email para receber um link de redefinição de senha
          </CardDescription>
        </CardHeader>

        {!isSubmitted ? (
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email registrado</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full">
                Enviar Link de Recuperação
              </Button>
              <Button variant="ghost" asChild className="w-full">
                <Link to="/login">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar para o Login
                </Link>
              </Button>
            </CardFooter>
          </form>
        ) : (
          <CardContent className="space-y-4 pt-4">
            <div className="bg-muted p-4 rounded-lg text-sm text-center">
              Um email com instruções foi enviado para <strong>{email}</strong>.
            </div>

            <div className="mt-4 pt-4 border-t text-center space-y-2">
              <p className="text-xs text-muted-foreground">Link de demonstração:</p>
              <Button variant="outline" size="sm" asChild>
                <Link to={`/reset-password?email=${encodeURIComponent(email)}`}>
                  Acessar Link de Redefinição
                </Link>
              </Button>
            </div>

            <Button variant="ghost" asChild className="w-full mt-4">
              <Link to="/login">Voltar para o Login</Link>
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
