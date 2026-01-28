import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Trash2, Shield, Loader2, UserPlus, ShieldCheck, ShieldOff } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface User {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  role: string;
}

export default function Admin() {
  const { session, user } = useAuth();
  const { isAdmin, isLoading: isRoleLoading } = useUserRole();
  const queryClient = useQueryClient();
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserIsAdmin, setNewUserIsAdmin] = useState(false);

  const { data: users, isLoading: isUsersLoading } = useQuery({
    queryKey: ["adminUsers"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("list-users", {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (error) throw error;
      return data.users as User[];
    },
    enabled: isAdmin && !!session?.access_token,
  });

  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.functions.invoke("delete-user", {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: { userId },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Usuário excluído",
        description: "O usuário foi removido com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      setUserToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir",
        description: error.message || "Não foi possível excluir o usuário.",
        variant: "destructive",
      });
    },
  });

  const toggleRoleMutation = useMutation({
    mutationFn: async ({ userId, makeAdmin }: { userId: string; makeAdmin: boolean }) => {
      const { data, error } = await supabase.functions.invoke("toggle-user-role", {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: { userId, makeAdmin },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      toast({
        title: variables.makeAdmin ? "Usuário promovido" : "Permissão removida",
        description: variables.makeAdmin 
          ? "O usuário agora é administrador." 
          : "O usuário não é mais administrador.",
      });
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao alterar permissão",
        description: error.message || "Não foi possível alterar a permissão.",
        variant: "destructive",
      });
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("create-user", {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: { 
          email: newUserEmail, 
          password: newUserPassword,
          makeAdmin: newUserIsAdmin,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Usuário criado",
        description: "O novo usuário foi criado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      setIsCreateDialogOpen(false);
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserIsAdmin(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar usuário",
        description: error.message || "Não foi possível criar o usuário.",
        variant: "destructive",
      });
    },
  });

  if (isRoleLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6 flex items-center justify-between">
        <Link to="/">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Dashboard
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle>Painel Administrativo</CardTitle>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Novo Usuário
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Novo Usuário</DialogTitle>
                  <DialogDescription>
                    Preencha os dados para criar um novo usuário no sistema.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="usuario@exemplo.com"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="isAdmin" 
                      checked={newUserIsAdmin}
                      onCheckedChange={(checked) => setNewUserIsAdmin(checked === true)}
                    />
                    <Label htmlFor="isAdmin" className="text-sm font-normal cursor-pointer">
                      Criar como administrador
                    </Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    onClick={() => createUserMutation.mutate()}
                    disabled={createUserMutation.isPending || !newUserEmail || !newUserPassword}
                  >
                    {createUserMutation.isPending && (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    )}
                    Criar Usuário
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <CardDescription>
            Gerencie os usuários do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isUsersLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead>Último acesso</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.email}</TableCell>
                    <TableCell>
                      <Badge variant={u.role === "admin" ? "default" : "secondary"}>
                        {u.role === "admin" ? "Admin" : "Usuário"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(u.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      {u.last_sign_in_at
                        ? format(new Date(u.last_sign_in_at), "dd/MM/yyyy HH:mm", { locale: ptBR })
                        : "Nunca"}
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className={u.role === "admin" 
                          ? "text-amber-600 hover:text-amber-700 hover:bg-amber-50" 
                          : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"}
                        onClick={() => toggleRoleMutation.mutate({ 
                          userId: u.id, 
                          makeAdmin: u.role !== "admin" 
                        })}
                        disabled={u.id === user?.id || toggleRoleMutation.isPending}
                        title={u.id === user?.id 
                          ? "Não é possível alterar sua própria função" 
                          : u.role === "admin" 
                            ? "Remover permissão de admin" 
                            : "Promover a admin"}
                      >
                        {u.role === "admin" ? (
                          <ShieldOff className="h-4 w-4" />
                        ) : (
                          <ShieldCheck className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setUserToDelete(u)}
                        disabled={u.id === user?.id}
                        title={u.id === user?.id ? "Não é possível excluir sua própria conta" : "Excluir usuário"}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o usuário <strong>{userToDelete?.email}</strong>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => userToDelete && deleteMutation.mutate(userToDelete.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
