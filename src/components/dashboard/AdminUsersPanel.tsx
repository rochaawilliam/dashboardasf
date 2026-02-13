import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { sanitizeError } from "@/lib/error-handler";
import { Trash2, Shield, Loader2, UserPlus, ShieldCheck, ShieldOff, Eye } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TabPermissionsDialog } from "@/components/dashboard/TabPermissionsDialog";
import { CreateUserDialog, type CreateUserData } from "@/components/dashboard/CreateUserDialog";
import { useUpdateTabPermissions } from "@/hooks/useTabPermissions";

interface User {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  role: string;
}

export function AdminUsersPanel() {
  const { session, user } = useAuth();
  const queryClient = useQueryClient();
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [userForPermissions, setUserForPermissions] = useState<User | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const updateTabPermissions = useUpdateTabPermissions();

  const { data: users, isLoading: isUsersLoading } = useQuery({
    queryKey: ["adminUsers"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("list-users", {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (error) throw error;
      return data.users as User[];
    },
    enabled: !!session?.access_token,
  });

  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.functions.invoke("delete-user", {
        headers: { Authorization: `Bearer ${session?.access_token}` },
        body: { userId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: "Usuário excluído", description: "O usuário foi removido com sucesso." });
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      setUserToDelete(null);
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao excluir", description: sanitizeError(error), variant: "destructive" });
    },
  });

  const toggleRoleMutation = useMutation({
    mutationFn: async ({ userId, makeAdmin }: { userId: string; makeAdmin: boolean }) => {
      const { data, error } = await supabase.functions.invoke("toggle-user-role", {
        headers: { Authorization: `Bearer ${session?.access_token}` },
        body: { userId, makeAdmin },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      toast({
        title: variables.makeAdmin ? "Usuário promovido" : "Permissão removida",
        description: variables.makeAdmin ? "O usuário agora é administrador." : "O usuário não é mais administrador.",
      });
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao alterar permissão", description: sanitizeError(error), variant: "destructive" });
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: CreateUserData) => {
      if (!session?.access_token) throw new Error("Sessão expirada. Faça login novamente.");
      const response = await supabase.functions.invoke("create-user", {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: { email: data.email, password: data.password, makeAdmin: data.isAdmin },
      });
      if (response.error) throw new Error(response.error?.message || "Erro ao criar usuário");
      const result = response.data;
      if (result?.error) throw new Error(result.error);
      if (!data.isAdmin && result.user?.id) {
        await updateTabPermissions.mutateAsync({ userId: result.user.id, permissions: data.permissions });
      }
      return result;
    },
    onSuccess: () => {
      toast({ title: "Usuário criado", description: "O novo usuário foi criado com sucesso." });
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      setIsCreateDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao criar usuário", description: sanitizeError(error), variant: "destructive" });
    },
  });

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle>Gerenciamento de Usuários</CardTitle>
            </div>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Novo Usuário
            </Button>
          </div>
          <CardDescription>Crie, edite e gerencie os usuários do sistema</CardDescription>
        </CardHeader>
        <CardContent>
          {isUsersLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="overflow-x-auto">
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
                      <TableCell>{format(new Date(u.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</TableCell>
                      <TableCell>
                        {u.last_sign_in_at ? format(new Date(u.last_sign_in_at), "dd/MM/yyyy HH:mm", { locale: ptBR }) : "Nunca"}
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        {u.role !== "admin" && (
                          <Button variant="ghost" size="icon" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            onClick={() => setUserForPermissions(u)} title="Gerenciar permissões de abas">
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon"
                          className={u.role === "admin" ? "text-amber-600 hover:text-amber-700 hover:bg-amber-50" : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"}
                          onClick={() => toggleRoleMutation.mutate({ userId: u.id, makeAdmin: u.role !== "admin" })}
                          disabled={u.id === user?.id || toggleRoleMutation.isPending}
                          title={u.id === user?.id ? "Não é possível alterar sua própria função" : u.role === "admin" ? "Remover admin" : "Promover a admin"}>
                          {u.role === "admin" ? <ShieldOff className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setUserToDelete(u)} disabled={u.id === user?.id}
                          title={u.id === user?.id ? "Não é possível excluir sua própria conta" : "Excluir usuário"}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o usuário <strong>{userToDelete?.email}</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => userToDelete && deleteMutation.mutate(userToDelete.id)} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <TabPermissionsDialog open={!!userForPermissions} onOpenChange={(open) => !open && setUserForPermissions(null)}
        userId={userForPermissions?.id || null} userEmail={userForPermissions?.email || ""} />

      <CreateUserDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}
        onCreateUser={(data) => createUserMutation.mutate(data)} isCreating={createUserMutation.isPending} />
    </>
  );
}
