import { useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAppContext } from '@/context/AppContext'
import { Camera, User, Phone, Mail, Save } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default function Profile() {
  const { currentUser, role, updateProfile } = useAppContext()
  const [name, setName] = useState(currentUser?.name || '')
  const [phone, setPhone] = useState(currentUser?.phone || '')
  const [avatar, setAvatar] = useState(currentUser?.avatar || '')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    updateProfile({ name, phone, avatar })
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatar(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Meu Perfil</h1>
        <p className="text-muted-foreground">
          Gerencie suas informações pessoais e configurações de conta.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_2fr]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Foto de Perfil</CardTitle>
            <CardDescription>Atualize sua imagem de exibição</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-6">
            <div
              className="relative group cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Avatar className="h-32 w-32 border-4 border-muted shadow-sm">
                {avatar ? (
                  <AvatarImage src={avatar} className="object-cover" />
                ) : (
                  <AvatarFallback className="text-4xl bg-primary/10 text-primary">
                    {currentUser?.name?.charAt(0) || 'U'}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="h-8 w-8 text-white" />
              </div>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleAvatarChange}
            />
            <div className="text-center space-y-2">
              <Badge variant="outline" className="px-3 py-1">
                {role === 'Admin'
                  ? 'Administrador'
                  : role === 'Manager'
                    ? 'Gerente'
                    : 'Usuário Comum'}
              </Badge>
              <p className="text-xs text-muted-foreground">JPG, GIF ou PNG. Max de 2MB.</p>
            </div>
            {avatar !== currentUser?.avatar && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setAvatar(currentUser?.avatar || '')}
              >
                Desfazer alteração
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <form onSubmit={handleSave}>
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
              <CardDescription>Seus dados de contato básicos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  Nome Completo
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome completo"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  Endereço de Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={currentUser?.email || ''}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  O email não pode ser alterado por segurança. Contate o administrador.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  Telefone / WhatsApp
                </Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(00) 00000-0000"
                />
              </div>
            </CardContent>
            <div className="p-6 pt-0 flex justify-end">
              <Button type="submit" className="gap-2">
                <Save className="h-4 w-4" />
                Salvar Alterações
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}
