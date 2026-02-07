import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Eye } from "lucide-react";
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
  useUserTabPermissionsForAdmin, 
  useUpdateTabPermissions 
} from "@/hooks/useTabPermissions";

interface TabPermissionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | null;
  userEmail: string;
}

export function TabPermissionsDialog({ 
  open, 
  onOpenChange, 
  userId, 
  userEmail 
}: TabPermissionsDialogProps) {
  const { data: currentPermissions, isLoading } = useUserTabPermissionsForAdmin(userId);
  const updatePermissions = useUpdateTabPermissions();
  const [selectedTabs, setSelectedTabs] = useState<TabKey[]>([]);

  // Initialize selected tabs when permissions load
  useEffect(() => {
    if (currentPermissions) {
      setSelectedTabs(currentPermissions.map(p => p.tab_key as TabKey));
    }
  }, [currentPermissions]);

  const handleToggleTab = (tab: TabKey) => {
    setSelectedTabs(prev => 
      prev.includes(tab) 
        ? prev.filter(t => t !== tab)
        : [...prev, tab]
    );
  };

  const handleSelectAll = () => {
    setSelectedTabs(ALL_TABS);
  };

  const handleClearAll = () => {
    setSelectedTabs([]);
  };

  const handleSave = () => {
    if (userId) {
      updatePermissions.mutate(
        { userId, tabs: selectedTabs },
        { onSuccess: () => onOpenChange(false) }
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            Permissões de Visualização
          </DialogTitle>
          <DialogDescription>
            Defina quais abas <strong>{userEmail}</strong> pode visualizar.
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="py-4 space-y-4">
            <div className="flex gap-2 mb-4">
              <Button variant="outline" size="sm" onClick={handleSelectAll}>
                Selecionar Todas
              </Button>
              <Button variant="outline" size="sm" onClick={handleClearAll}>
                Limpar Todas
              </Button>
            </div>
            
            <div className="grid gap-3">
              {ALL_TABS.map(tab => (
                <div key={tab} className="flex items-center space-x-3">
                  <Checkbox
                    id={`tab-${tab}`}
                    checked={selectedTabs.includes(tab)}
                    onCheckedChange={() => handleToggleTab(tab)}
                  />
                  <Label 
                    htmlFor={`tab-${tab}`} 
                    className="text-sm font-normal cursor-pointer flex-1"
                  >
                    {TAB_LABELS[tab]}
                  </Label>
                </div>
              ))}
            </div>
            
            <p className="text-xs text-muted-foreground mt-4">
              Usuários sem permissão verão as abas desabilitadas. 
              Administradores sempre têm acesso completo.
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
