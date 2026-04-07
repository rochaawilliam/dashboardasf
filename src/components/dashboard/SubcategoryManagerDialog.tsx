import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, GripVertical, Pencil, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MetricCategory } from "@/hooks/useMetrics";
import {
  useSubcategories,
  useCreateSubcategory,
  useUpdateSubcategory,
  useDeleteSubcategory,
  useBulkReorderSubcategories,
  type Subcategory,
} from "@/hooks/useSubcategories";

const categoryLabels: Record<string, string> = {
  lucratividade: "Financeiro",
  experiencia_cliente: "Crescimento",
  produtividade: "Jurídico",
  gestao_pessoas: "Time ASF",
};

const categoryOrder: MetricCategory[] = [
  "experiencia_cliente",
  "produtividade",
  "gestao_pessoas",
  "lucratividade",
];

interface SubcategoryManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SubcategoryManagerDialog({ open, onOpenChange }: SubcategoryManagerDialogProps) {
  const { data: subcategories } = useSubcategories();
  const createSubcategory = useCreateSubcategory();
  const updateSubcategory = useUpdateSubcategory();
  const deleteSubcategory = useDeleteSubcategory();
  const reorderSubcategories = useBulkReorderSubcategories();

  const [selectedCategory, setSelectedCategory] = useState<MetricCategory>("lucratividade");
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const categorySubcats = (subcategories || [])
    .filter((s) => s.category === selectedCategory)
    .sort((a, b) => a.sort_order - b.sort_order);

  const handleCreate = () => {
    if (!newName.trim()) return;
    const maxOrder = categorySubcats.reduce((max, s) => Math.max(max, s.sort_order), 0);
    createSubcategory.mutate({
      category: selectedCategory,
      name: newName.trim(),
      sort_order: maxOrder + 1,
    });
    setNewName("");
  };

  const handleRename = (id: string) => {
    if (!editingName.trim()) return;
    updateSubcategory.mutate({ id, name: editingName.trim() });
    setEditingId(null);
    setEditingName("");
  };

  const handleDelete = (id: string) => {
    deleteSubcategory.mutate(id);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const items = [...categorySubcats];
    [items[index - 1], items[index]] = [items[index], items[index - 1]];
    reorderSubcategories.mutate(
      items.map((item, i) => ({ id: item.id, sort_order: i + 1 }))
    );
  };

  const handleMoveDown = (index: number) => {
    if (index >= categorySubcats.length - 1) return;
    const items = [...categorySubcats];
    [items[index], items[index + 1]] = [items[index + 1], items[index]];
    reorderSubcategories.mutate(
      items.map((item, i) => ({ id: item.id, sort_order: i + 1 }))
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciar Subcategorias</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Select value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as MetricCategory)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categoryOrder.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {categoryLabels[cat]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="space-y-1">
            {categorySubcats.map((subcat, index) => (
              <div
                key={subcat.id}
                className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
              >
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-30 text-[10px] leading-none"
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => handleMoveDown(index)}
                    disabled={index >= categorySubcats.length - 1}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-30 text-[10px] leading-none"
                  >
                    ▼
                  </button>
                </div>

                {editingId === subcat.id ? (
                  <div className="flex-1 flex items-center gap-1">
                    <Input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="h-7 text-sm"
                      onKeyDown={(e) => e.key === "Enter" && handleRename(subcat.id)}
                      autoFocus
                    />
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleRename(subcat.id)}>
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingId(null)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <span className="flex-1 text-sm">{subcat.name}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => {
                        setEditingId(subcat.id);
                        setEditingName(subcat.name);
                      }}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                      onClick={() => handleDelete(subcat.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nova subcategoria..."
              className="flex-1"
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
            <Button size="sm" onClick={handleCreate} disabled={!newName.trim()}>
              <Plus className="h-4 w-4 mr-1" /> Criar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
