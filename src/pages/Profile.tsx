import { useState, useRef } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useUserRole } from "@/hooks/useUserRole";
import { useTranslationSafe } from "@/hooks/useTranslation";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { sanitizeError } from "@/lib/error-handler";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Camera,
  Loader2,
  Lock,
  Save,
  User,
  Settings,
  Shield,
} from "lucide-react";
import { UserSettingsContent } from "@/components/dashboard/UserSettingsContent";
import { AdminUsersPanel } from "@/components/dashboard/AdminUsersPanel";

export default function Profile() {
  const { user } = useAuth();
  const { profile, isLoading, updateProfile, uploadAvatar } = useProfile();
  const { isAdmin } = useUserRole();
  const { t } = useTranslationSafe();
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const [displayName, setDisplayName] = useState("");
  const [nameInitialized, setNameInitialized] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize display name from profile
  if (profile && !nameInitialized) {
    setDisplayName(profile.display_name || "");
    setNameInitialized(true);
  }

  if (!user) return <Navigate to="/login" replace />;

  const initials = (profile?.display_name || user.email || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Arquivo muito grande", description: "O tamanho máximo é 2MB.", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    try {
      await uploadAvatar(file);
      toast({ title: "Foto atualizada!", description: "Sua foto de perfil foi alterada com sucesso." });
    } catch (err: any) {
      toast({ title: "Erro ao enviar foto", description: sanitizeError(err), variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveName = async () => {
    try {
      await updateProfile.mutateAsync({ display_name: displayName });
      toast({ title: "Nome atualizado!", description: "Seu nome de exibição foi alterado." });
    } catch (err: any) {
      toast({ title: "Erro", description: sanitizeError(err), variant: "destructive" });
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast({ title: "Senha muito curta", description: "Mínimo de 6 caracteres.", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Senhas não coincidem", description: "Confirme a nova senha corretamente.", variant: "destructive" });
      return;
    }

    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast({ title: "Senha alterada!", description: "Sua senha foi atualizada com sucesso." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast({ title: "Erro ao alterar senha", description: sanitizeError(err), variant: "destructive" });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const defaultTab = tabFromUrl || "profile";

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-3xl py-6 px-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <h1 className="text-xl font-semibold">Minha Conta</h1>
        </div>

        <Tabs defaultValue={defaultTab} className="space-y-6">
          <TabsList className="w-full justify-start flex-wrap h-auto gap-1">
            <TabsTrigger value="profile" className="gap-1.5">
              <User className="h-4 w-4" />
              Perfil
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-1.5">
              <Lock className="h-4 w-4" />
              Segurança
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-1.5">
              <Settings className="h-4 w-4" />
              Configurações
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="admin" className="gap-1.5">
                <Shield className="h-4 w-4" />
                Administração
              </TabsTrigger>
            )}
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Dados do Perfil
                </CardTitle>
                <CardDescription>Atualize seu nome e foto de perfil</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar */}
                <div className="flex items-center gap-4">
                  <div className="relative group">
                    <Avatar className="h-20 w-20 border-2 border-border">
                      <AvatarImage src={profile?.avatar_url || undefined} alt="Avatar" />
                      <AvatarFallback className="text-lg font-semibold bg-primary/10 text-primary">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      {isUploading ? (
                        <Loader2 className="h-5 w-5 text-white animate-spin" />
                      ) : (
                        <Camera className="h-5 w-5 text-white" />
                      )}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                    />
                  </div>
                  <div>
                    <p className="font-medium">{profile?.display_name || user.email}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>

                <Separator />

                {/* Display Name */}
                <div className="space-y-2">
                  <Label htmlFor="displayName">Nome de exibição</Label>
                  <div className="flex gap-2">
                    <Input
                      id="displayName"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Seu nome"
                    />
                    <Button
                      onClick={handleSaveName}
                      disabled={updateProfile.isPending || displayName === profile?.display_name}
                    >
                      {updateProfile.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {/* Email (read-only) */}
                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <Input value={user.email || ""} disabled className="bg-muted" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Alterar Senha
                </CardTitle>
                <CardDescription>Defina uma nova senha para sua conta</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Nova senha</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      minLength={6}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      minLength={6}
                      required
                    />
                  </div>
                  <Button type="submit" disabled={isChangingPassword} className="w-full">
                    {isChangingPassword ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Lock className="h-4 w-4 mr-2" />
                    )}
                    Alterar Senha
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Configurações
                </CardTitle>
                <CardDescription>Personalize sua experiência no dashboard</CardDescription>
              </CardHeader>
              <CardContent>
                <UserSettingsContent />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Admin Tab */}
          {isAdmin && (
            <TabsContent value="admin">
              <AdminUsersPanel />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
