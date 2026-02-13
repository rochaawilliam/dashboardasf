import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, Edit, Trash2, UserPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { 
  ALL_TABS, 
  TAB_LABELS, 
  TabKey, 
  TabPermissionSet,
} from "@/hooks/useTabPermissions";

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateUser: (data: CreateUserData) => void;
  isCreating: boolean;
}

export interface CreateUserData {
  email: string;
  password: string;
  jobTitle: string;
  isAdmin: boolean;
  permissions: Record<TabKey, TabPermissionSet>;
}

const defaultPermissions: Record<TabKey, TabPermissionSet> = {
  lucratividade: { view: false, edit: false, delete: false },
  execucao_comercial: { view: false, edit: false, delete: false },
  experiencia_cliente: { view: false, edit: false, delete: false },
  produtividade: { view: false, edit: false, delete: false },
  gestao_pessoas: { view: false, edit: false, delete: false },
  aprendizado_crescimento: { view: false, edit: false, delete: false },
};

export function CreateUserDialog({ 
  open, 
  onOpenChange, 
  onCreateUser,
  isCreating 
}: CreateUserDialogProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [permissions, setPermissions] = useState<Record<TabKey, TabPermissionSet>>({ ...defaultPermissions });

  const handleToggle = (tab: TabKey, type: keyof TabPermissionSet) => {
    setPermissions(prev => ({
      ...prev,
      [tab]: {
        ...prev[tab],
        [type]: !prev[tab][type],
        // If enabling edit or delete, also enable view
        ...(type !== "view" && !prev[tab][type] ? { view: true } : {}),
        // If disabling view, also disable edit and delete
        ...(type === "view" && prev[tab][type] ? { edit: false, delete: false } : {}),
      }
    }));
  };

  const handleSelectAllView = () => {
    setPermissions(prev => {
      const newPerms = { ...prev };
      ALL_TABS.forEach(tab => {
        newPerms[tab] = { ...newPerms[tab], view: true };
      });
      return newPerms;
    });
  };

  const handleSelectAllEdit = () => {
    setPermissions(prev => {
      const newPerms = { ...prev };
      ALL_TABS.forEach(tab => {
        newPerms[tab] = { view: true, edit: true, delete: newPerms[tab].delete };
      });
      return newPerms;
    });
  };

  const handleSelectAllDelete = () => {
    setPermissions(prev => {
      const newPerms = { ...prev };
      ALL_TABS.forEach(tab => {
        newPerms[tab] = { view: true, edit: true, delete: true };
      });
      return newPerms;
    });
  };

  const handleClearAll = () => {
    setPermissions({ ...defaultPermissions });
  };

  const handleSubmit = () => {
    onCreateUser({
      email,
      password,
      jobTitle,
      isAdmin,
      permissions,
    });
  };

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setJobTitle("");
    setIsAdmin(false);
    setPermissions({ ...defaultPermissions });
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Criar Novo Usuário
          </DialogTitle>
          <DialogDescription>
            Preencha os dados de acesso e configure as permissões do novo usuário.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Dados de Acesso */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Dados de Acesso</h4>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="usuario@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="jobTitle">Cargo</Label>
              <Input
                id="jobTitle"
                type="text"
                placeholder="Ex: Advogado, Analista, Gerente"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="isAdmin" 
                checked={isAdmin}
                onCheckedChange={(checked) => setIsAdmin(checked === true)}
              />
              <Label htmlFor="isAdmin" className="text-sm font-normal cursor-pointer">
                Criar como administrador (acesso total)
              </Label>
            </div>
          </div>

          <Separator />

          {/* Permissões por Aba */}
          {!isAdmin && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">Permissões por Aba</h4>
              
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={handleSelectAllView}>
                  Todos Ver
                </Button>
                <Button variant="outline" size="sm" onClick={handleSelectAllEdit}>
                  Todos Editar
                </Button>
                <Button variant="outline" size="sm" onClick={handleSelectAllDelete}>
                  Todos Apagar
                </Button>
                <Button variant="outline" size="sm" onClick={handleClearAll}>
                  Limpar
                </Button>
              </div>
              
              {/* Header */}
              <div className="grid grid-cols-[1fr,auto,auto,auto] gap-2 pb-2 border-b text-xs font-medium text-muted-foreground">
                <span>Aba</span>
                <span className="w-14 text-center flex items-center justify-center gap-1">
                  <Eye className="h-3 w-3" /> Ver
                </span>
                <span className="w-14 text-center flex items-center justify-center gap-1">
                  <Edit className="h-3 w-3" /> Editar
                </span>
                <span className="w-14 text-center flex items-center justify-center gap-1">
                  <Trash2 className="h-3 w-3" /> Apagar
                </span>
              </div>
              
              {/* Permission rows */}
              <div className="space-y-1.5">
                {ALL_TABS.map(tab => (
                  <div key={tab} className="grid grid-cols-[1fr,auto,auto,auto] gap-2 items-center py-1">
                    <Label className="text-sm truncate">{TAB_LABELS[tab]}</Label>
                    <div className="w-14 flex justify-center">
                      <Checkbox
                        checked={permissions[tab].view}
                        onCheckedChange={() => handleToggle(tab, "view")}
                      />
                    </div>
                    <div className="w-14 flex justify-center">
                      <Checkbox
                        checked={permissions[tab].edit}
                        onCheckedChange={() => handleToggle(tab, "edit")}
                        disabled={!permissions[tab].view}
                      />
                    </div>
                    <div className="w-14 flex justify-center">
                      <Checkbox
                        checked={permissions[tab].delete}
                        onCheckedChange={() => handleToggle(tab, "delete")}
                        disabled={!permissions[tab].view}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isAdmin && (
            <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
              ⚡ Administradores têm acesso completo a todas as abas e funcionalidades automaticamente.
            </p>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isCreating || !email || !password || password.length < 6}
          >
            {isCreating && (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            )}
            Criar Usuário
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
