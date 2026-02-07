import { useState } from "react";
import {
  Settings,
  Moon,
  Sun,
  Bell,
  Target,
  TrendingUp,
  Globe,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTheme } from "@/hooks/useTheme";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export function UserSettingsPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { preferences, updatePreference, resetPreferences } = useUserPreferences();

  const handleResetPreferences = () => {
    resetPreferences();
    toast({
      title: "Preferências restauradas",
      description: "Todas as configurações foram resetadas para os valores padrão.",
    });
  };

  const handleLanguageChange = (lang: string) => {
    updatePreference("language", lang as "pt-BR" | "en-US" | "es-ES");
    toast({
      title: "Idioma alterado",
      description: "O idioma será aplicado em toda a interface.",
    });
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 sm:h-9 sm:w-9 border border-border/50"
          title="Configurações"
        >
          <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurações
          </SheetTitle>
          <SheetDescription>
            Personalize sua experiência no dashboard
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Theme Section */}
          <SettingsSection
            icon={theme === "dark" ? Moon : Sun}
            title="Tema"
            description="Escolha o modo de visualização"
          >
            <div className="flex gap-2">
              <Button
                variant={theme === "light" ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme("light")}
                className="flex-1"
              >
                <Sun className="h-4 w-4 mr-2" />
                Claro
              </Button>
              <Button
                variant={theme === "dark" ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme("dark")}
                className="flex-1"
              >
                <Moon className="h-4 w-4 mr-2" />
                Escuro
              </Button>
            </div>
          </SettingsSection>

          <Separator />

          {/* Notifications Section */}
          <SettingsSection
            icon={Bell}
            title="Notificações"
            description="Configure alertas e avisos"
          >
            <div className="space-y-4">
              <SettingsToggle
                id="notify-enabled"
                label="Ativar notificações"
                description="Receber alertas no navegador"
                checked={preferences.notificationsEnabled}
                onCheckedChange={(checked) => updatePreference("notificationsEnabled", checked)}
              />
              <SettingsToggle
                id="notify-goal-reached"
                label="Meta atingida"
                description="Avisar quando uma meta for alcançada"
                checked={preferences.notifyOnGoalReached}
                onCheckedChange={(checked) => updatePreference("notifyOnGoalReached", checked)}
                disabled={!preferences.notificationsEnabled}
              />
              <SettingsToggle
                id="notify-goal-missed"
                label="Meta perdida"
                description="Avisar quando uma meta não for atingida"
                checked={preferences.notifyOnGoalMissed}
                onCheckedChange={(checked) => updatePreference("notifyOnGoalMissed", checked)}
                disabled={!preferences.notificationsEnabled}
              />
              <SettingsToggle
                id="notify-trend-change"
                label="Mudança de tendência"
                description="Avisar sobre alterações significativas"
                checked={preferences.notifyOnTrendChange}
                onCheckedChange={(checked) => updatePreference("notifyOnTrendChange", checked)}
                disabled={!preferences.notificationsEnabled}
              />
            </div>
          </SettingsSection>

          <Separator />

          {/* Goals Display Section */}
          <SettingsSection
            icon={Target}
            title="Exibição de Metas"
            description="Customize a visualização dos cards"
          >
            <div className="space-y-4">
              <SettingsToggle
                id="show-monthly-goals"
                label="Metas mensais"
                description="Exibir referência mensal nos cards"
                checked={preferences.showMonthlyGoals}
                onCheckedChange={(checked) => updatePreference("showMonthlyGoals", checked)}
              />
              <SettingsToggle
                id="show-annual-goals"
                label="Metas anuais"
                description="Exibir meta anual nos cards"
                checked={preferences.showAnnualGoals}
                onCheckedChange={(checked) => updatePreference("showAnnualGoals", checked)}
              />
              <SettingsToggle
                id="show-progress"
                label="Percentual de progresso"
                description="Mostrar % de conclusão da meta"
                checked={preferences.showProgressPercentage}
                onCheckedChange={(checked) => updatePreference("showProgressPercentage", checked)}
              />
              <SettingsToggle
                id="show-sparklines"
                label="Mini gráficos"
                description="Exibir sparklines nos cards"
                checked={preferences.showSparklines}
                onCheckedChange={(checked) => updatePreference("showSparklines", checked)}
              />
            </div>
          </SettingsSection>

          <Separator />

          {/* Trends Section */}
          <SettingsSection
            icon={TrendingUp}
            title="Relatório de Tendências"
            description="Configure análises e indicadores"
          >
            <div className="space-y-4">
              <SettingsToggle
                id="show-trend-indicators"
                label="Indicadores de tendência"
                description="Mostrar setas de subida/descida"
                checked={preferences.showTrendIndicators}
                onCheckedChange={(checked) => updatePreference("showTrendIndicators", checked)}
              />
              <div className="space-y-2">
                <Label htmlFor="trend-period" className="text-sm font-medium">
                  Período de análise
                </Label>
                <Select
                  value={String(preferences.trendPeriodMonths)}
                  onValueChange={(value) => updatePreference("trendPeriodMonths", Number(value) as 3 | 6 | 12)}
                >
                  <SelectTrigger id="trend-period">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">Últimos 3 meses</SelectItem>
                    <SelectItem value="6">Últimos 6 meses</SelectItem>
                    <SelectItem value="12">Últimos 12 meses</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Período usado para calcular tendências e comparações
                </p>
              </div>
            </div>
          </SettingsSection>

          <Separator />

          {/* Language Section */}
          <SettingsSection
            icon={Globe}
            title="Idioma"
            description="Selecione o idioma da interface"
          >
            <Select
              value={preferences.language}
              onValueChange={handleLanguageChange}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pt-BR">
                  <span className="flex items-center gap-2">
                    🇧🇷 Português (Brasil)
                  </span>
                </SelectItem>
                <SelectItem value="en-US">
                  <span className="flex items-center gap-2">
                    🇺🇸 English (US)
                  </span>
                </SelectItem>
                <SelectItem value="es-ES">
                  <span className="flex items-center gap-2">
                    🇪🇸 Español
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </SettingsSection>

          <Separator />

          {/* Reset Button */}
          <div className="pt-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleResetPreferences}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Restaurar padrões
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Sub-components
interface SettingsSectionProps {
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
}

function SettingsSection({ icon: Icon, title, description, children }: SettingsSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h3 className="font-medium text-sm">{title}</h3>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="pl-11">
        {children}
      </div>
    </div>
  );
}

interface SettingsToggleProps {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}

function SettingsToggle({
  id,
  label,
  description,
  checked,
  onCheckedChange,
  disabled = false,
}: SettingsToggleProps) {
  return (
    <div className={cn(
      "flex items-center justify-between gap-4 py-2 px-3 rounded-lg transition-colors",
      disabled ? "opacity-50" : "hover:bg-muted/50"
    )}>
      <div className="space-y-0.5">
        <Label htmlFor={id} className={cn("text-sm font-medium", disabled && "cursor-not-allowed")}>
          {label}
        </Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
      />
    </div>
  );
}
