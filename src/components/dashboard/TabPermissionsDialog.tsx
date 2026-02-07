import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, Edit, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  ALL_TABS, 
  TAB_LABELS, 
  TabKey, 
  TabPermissionSet,
  useUserTabPermissionsForAdmin, 
  useUpdateTabPermissions 
} from "@/hooks/useTabPermissions";

interface TabPermissionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | null;
  userEmail: string;
}

const defaultPermissions: Record<TabKey, TabPermissionSet> = {
  lucratividade: { view: false, edit: false, delete: false },
  execucao_comercial: { view: false, edit: false, delete: false },
  experiencia_cliente: { view: false, edit: false, delete: false },
  produtividade: { view: false, edit: false, delete: false },
  gestao_pessoas: { view: false, edit: false, delete: false },
  aprendizado_crescimento: { view: false, edit: false, delete: false },
};

export function TabPermissionsDialog({ 
  open, 
  onOpenChange, 
  userId, 
  userEmail 
}: TabPermissionsDialogProps) {
  const { data: currentPermissions, isLoading } = useUserTabPermissionsForAdmin(userId);
  const updatePermissions = useUpdateTabPermissions();
  const [permissions, setPermissions] = useState<Record<TabKey, TabPermissionSet>>({ ...defaultPermissions });

  // Initialize permissions when they load
  useEffect(() => {
    if (currentPermissions) {
      const newPerms = { ...defaultPermissions };
      currentPermissions.forEach(p => {
        const tab = p.tab_key as TabKey;
        if (newPerms[tab]) {
          if (p.permission_type === "view") newPerms[tab].view = true;
          if (p.permission_type === "edit") newPerms[tab].edit = true;
          if (p.permission_type === "delete") newPerms[tab].delete = true;
        }
      });
      setPermissions(newPerms);
    } else {
      setPermissions({ ...defaultPermissions });
    }
  }, [currentPermissions]);

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

  const handleSave = () => {
    if (userId) {
      updatePermissions.mutate(
        { userId, permissions },
        { onSuccess: () => onOpenChange(false) }
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            Permissões de Acesso
          </DialogTitle>
          <DialogDescription>
            Defina as permissões de <strong>{userEmail}</strong> para cada aba.
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="py-4 space-y-4">
            <div className="flex flex-wrap gap-2 mb-4">
              <Button variant="outline" size="sm" onClick={handleSelectAllView}>
                Todos Visualizar
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
              <span className="w-16 text-center flex items-center justify-center gap-1">
                <Eye className="h-3 w-3" /> Ver
              </span>
              <span className="w-16 text-center flex items-center justify-center gap-1">
                <Edit className="h-3 w-3" /> Editar
              </span>
              <span className="w-16 text-center flex items-center justify-center gap-1">
                <Trash2 className="h-3 w-3" /> Apagar
              </span>
            </div>
            
            {/* Permission rows */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {ALL_TABS.map(tab => (
                <div key={tab} className="grid grid-cols-[1fr,auto,auto,auto] gap-2 items-center py-1.5">
                  <Label className="text-sm truncate">{TAB_LABELS[tab]}</Label>
                  <div className="w-16 flex justify-center">
                    <Checkbox
                      checked={permissions[tab].view}
                      onCheckedChange={() => handleToggle(tab, "view")}
                    />
                  </div>
                  <div className="w-16 flex justify-center">
                    <Checkbox
                      checked={permissions[tab].edit}
                      onCheckedChange={() => handleToggle(tab, "edit")}
                      disabled={!permissions[tab].view}
                    />
                  </div>
                  <div className="w-16 flex justify-center">
                    <Checkbox
                      checked={permissions[tab].delete}
                      onCheckedChange={() => handleToggle(tab, "delete")}
                      disabled={!permissions[tab].view}
                    />
                  </div>
                </div>
              ))}
            </div>
            
            <p className="text-xs text-muted-foreground mt-4">
              Administradores sempre têm acesso completo a todas as funcionalidades.
            </p>
          </div>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave}
            disabled={updatePermissions.isPending}
          >
            {updatePermissions.isPending && (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            )}
            Salvar Permissões
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Export for use in CreateUserDialog
export { defaultPermissions };
