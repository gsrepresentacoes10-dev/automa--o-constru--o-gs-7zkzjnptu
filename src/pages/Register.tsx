import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAppContext, Role } from '@/context/AppContext'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { HardHat } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>('Seller')
  const [error, setError] = useState('')
  const { register } = useAppContext()
  const navigate = useNavigate()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.')
      return
    }

    if (register({ name, email, password, role })) {
      navigate('/')
    } else {
      setError('Erro ao registrar. Este email já está em uso.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-3 text-center">
          <div className="flex justify-center">
            <div className="bg-primary p-3 rounded-xl shadow-sm">
              <HardHat className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Criar Conta</CardTitle>
          <CardDescription>Cadastre-se no sistema ConstruMaster</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive" className="py-2">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input
                id="name"
                placeholder="Ex: João da Silva"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Perfil de Acesso</Label>
              <Select value={role} onValueChange={(v: Role) => setRole(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o perfil" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Seller">Usuário Comum (Vendedor)</SelectItem>
                  <SelectItem value="Admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground leading-tight">
                *Administradores têm acesso total. Usuários comuns acessam apenas vendas e extrato
                pessoal.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full">
              Finalizar Cadastro
            </Button>
            <div className="text-sm text-center text-muted-foreground">
              Já possui uma conta?{' '}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Faça login
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
