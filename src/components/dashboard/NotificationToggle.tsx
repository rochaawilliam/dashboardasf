import { useState, useEffect } from "react";
import { Bell, BellOff, BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type PermissionStatus = NotificationPermission | "unsupported";

export function NotificationToggle() {
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>("default");
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    return localStorage.getItem("notifications-enabled") !== "false";
  });

  useEffect(() => {
    if (!("Notification" in window)) {
      setPermissionStatus("unsupported");
      return;
    }
    setPermissionStatus(Notification.permission);
  }, []);

  const handleToggleNotifications = async (enabled: boolean) => {
    if (enabled && permissionStatus === "default") {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);
      
      if (permission === "denied") {
        toast({
          title: "Permissão negada",
          description: "As notificações foram bloqueadas pelo navegador. Você pode alterar isso nas configurações do navegador.",
          variant: "destructive",
        });
        return;
      }
    }

    setNotificationsEnabled(enabled);
    localStorage.setItem("notifications-enabled", String(enabled));

    toast({
      title: enabled ? "Notificações ativadas" : "Notificações desativadas",
      description: enabled 
        ? "Você receberá alertas quando uma meta for atingida ou perdida."
        : "Você não receberá mais alertas de metas.",
    });
  };

  const getIcon = () => {
    if (permissionStatus === "unsupported" || permissionStatus === "denied") {
      return <BellOff className="h-4 w-4" />;
    }
    if (notificationsEnabled && permissionStatus === "granted") {
      return <BellRing className="h-4 w-4" />;
    }
    return <Bell className="h-4 w-4" />;
  };

  const getStatusText = () => {
    if (permissionStatus === "unsupported") {
      return "Navegador não suporta notificações";
    }
    if (permissionStatus === "denied") {
      return "Notificações bloqueadas pelo navegador";
    }
    if (permissionStatus === "granted" && notificationsEnabled) {
      return "Notificações ativas";
    }
    return "Notificações desativadas";
  };

  const getStatusColor = () => {
    if (permissionStatus === "unsupported" || permissionStatus === "denied") {
      return "text-muted-foreground";
    }
    if (notificationsEnabled && permissionStatus === "granted") {
      return "text-success";
    }
    return "text-muted-foreground";
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-9 w-9 border border-border/50 relative",
            notificationsEnabled && permissionStatus === "granted" && "text-success"
          )}
          title="Configurar notificações"
        >
          {getIcon()}
          {notificationsEnabled && permissionStatus === "granted" && (
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-success animate-pulse" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="end">
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-sm">Notificações Push</h4>
            <p className="text-xs text-muted-foreground mt-1">
              Receba alertas quando métricas atingirem ou perderem a meta.
            </p>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="notifications-toggle" className="text-sm">
              Ativar notificações
            </Label>
            <Switch
              id="notifications-toggle"
              checked={notificationsEnabled && permissionStatus !== "denied" && permissionStatus !== "unsupported"}
              onCheckedChange={handleToggleNotifications}
              disabled={permissionStatus === "denied" || permissionStatus === "unsupported"}
            />
          </div>

          <div className={cn("flex items-center gap-2 text-xs", getStatusColor())}>
            <div className={cn(
              "h-2 w-2 rounded-full",
              notificationsEnabled && permissionStatus === "granted" ? "bg-success" : "bg-muted-foreground"
            )} />
            <span>{getStatusText()}</span>
          </div>

          {permissionStatus === "denied" && (
            <div className="p-2 bg-muted rounded text-xs text-muted-foreground">
              <p>Para ativar notificações, clique no ícone de cadeado na barra de endereços e permita notificações para este site.</p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Export function to check if notifications are enabled
export function areNotificationsEnabled(): boolean {
  if (!("Notification" in window)) return false;
  if (Notification.permission !== "granted") return false;
  return localStorage.getItem("notifications-enabled") !== "false";
}
