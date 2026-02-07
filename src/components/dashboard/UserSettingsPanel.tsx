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
  RefreshCw,
  Cloud,
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
import { useTranslationSafe } from "@/hooks/useTranslation";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export function UserSettingsPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { preferences, updatePreference, resetPreferences, syncPreferences, isSyncing, lastSyncedAt, isLoggedIn } = useUserPreferences();
  const { t } = useTranslationSafe();

  const handleResetPreferences = () => {
    resetPreferences();
    toast({
      title: t.settings.preferencesRestored,
      description: t.settings.preferencesRestoredDesc,
    });
  };

  const handleLanguageChange = (lang: string) => {
    updatePreference("language", lang as "pt-BR" | "en-US" | "es-ES");
    toast({
      title: t.settings.languageChanged,
      description: t.settings.languageChangedDesc,
    });
  };

  const handleSync = async () => {
    await syncPreferences();
    toast({
      title: t.offline.syncSuccess,
    });
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 sm:h-9 sm:w-9 border border-border/50"
          title={t.settings.title}
        >
          <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {t.settings.title}
          </SheetTitle>
          <SheetDescription>
            {t.settings.description}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Sync Status */}
          {isLoggedIn && (
            <>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <Cloud className="h-4 w-4 text-muted-foreground" />
                  <div className="text-sm">
                    <span className="text-muted-foreground">
                      {lastSyncedAt 
                        ? `${t.offline.lastSync}: ${lastSyncedAt.toLocaleTimeString()}`
                        : t.offline.sync
                      }
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSync}
                  disabled={isSyncing}
                >
                  <RefreshCw className={cn("h-4 w-4", isSyncing && "animate-spin")} />
                </Button>
              </div>
              <Separator />
            </>
          )}

          {/* Theme Section */}
          <SettingsSection
            icon={theme === "dark" ? Moon : Sun}
            title={t.settings.theme}
            description={t.settings.themeDescription}
          >
            <div className="flex gap-2">
              <Button
                variant={theme === "light" ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme("light")}
                className="flex-1"
              >
                <Sun className="h-4 w-4 mr-2" />
                {t.settings.light}
              </Button>
              <Button
                variant={theme === "dark" ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme("dark")}
                className="flex-1"
              >
                <Moon className="h-4 w-4 mr-2" />
                {t.settings.dark}
              </Button>
            </div>
          </SettingsSection>

          <Separator />

          {/* Notifications Section */}
          <SettingsSection
            icon={Bell}
            title={t.settings.notifications}
            description={t.settings.notificationsDescription}
          >
            <div className="space-y-4">
              <SettingsToggle
                id="notify-enabled"
                label={t.settings.enableNotifications}
                description={t.settings.enableNotificationsDesc}
                checked={preferences.notificationsEnabled}
                onCheckedChange={(checked) => updatePreference("notificationsEnabled", checked)}
              />
              <SettingsToggle
                id="notify-goal-reached"
                label={t.settings.goalReached}
                description={t.settings.goalReachedDesc}
                checked={preferences.notifyOnGoalReached}
                onCheckedChange={(checked) => updatePreference("notifyOnGoalReached", checked)}
                disabled={!preferences.notificationsEnabled}
              />
              <SettingsToggle
                id="notify-goal-missed"
                label={t.settings.goalMissed}
                description={t.settings.goalMissedDesc}
                checked={preferences.notifyOnGoalMissed}
                onCheckedChange={(checked) => updatePreference("notifyOnGoalMissed", checked)}
                disabled={!preferences.notificationsEnabled}
              />
              <SettingsToggle
                id="notify-trend-change"
                label={t.settings.trendChange}
                description={t.settings.trendChangeDesc}
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
            title={t.settings.goalDisplay}
            description={t.settings.goalDisplayDescription}
          >
            <div className="space-y-4">
              <SettingsToggle
                id="show-monthly-goals"
                label={t.settings.showMonthlyGoals}
                description={t.settings.showMonthlyGoalsDesc}
                checked={preferences.showMonthlyGoals}
                onCheckedChange={(checked) => updatePreference("showMonthlyGoals", checked)}
              />
              <SettingsToggle
                id="show-annual-goals"
                label={t.settings.showAnnualGoals}
                description={t.settings.showAnnualGoalsDesc}
                checked={preferences.showAnnualGoals}
                onCheckedChange={(checked) => updatePreference("showAnnualGoals", checked)}
              />
              <SettingsToggle
                id="show-progress"
                label={t.settings.showProgress}
                description={t.settings.showProgressDesc}
                checked={preferences.showProgressPercentage}
                onCheckedChange={(checked) => updatePreference("showProgressPercentage", checked)}
              />
              <SettingsToggle
                id="show-sparklines"
                label={t.settings.showSparklines}
                description={t.settings.showSparklinesDesc}
                checked={preferences.showSparklines}
                onCheckedChange={(checked) => updatePreference("showSparklines", checked)}
              />
            </div>
          </SettingsSection>

          <Separator />

          {/* Trends Section */}
          <SettingsSection
            icon={TrendingUp}
            title={t.settings.trends}
            description={t.settings.trendsDescription}
          >
            <div className="space-y-4">
              <SettingsToggle
                id="show-trend-indicators"
                label={t.settings.showTrendIndicators}
                description={t.settings.showTrendIndicatorsDesc}
                checked={preferences.showTrendIndicators}
                onCheckedChange={(checked) => updatePreference("showTrendIndicators", checked)}
              />
              <div className="space-y-2">
                <Label htmlFor="trend-period" className="text-sm font-medium">
                  {t.settings.trendPeriod}
                </Label>
                <Select
                  value={String(preferences.trendPeriodMonths)}
                  onValueChange={(value) => updatePreference("trendPeriodMonths", Number(value) as 3 | 6 | 12)}
                >
                  <SelectTrigger id="trend-period">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">{t.settings.last3Months}</SelectItem>
                    <SelectItem value="6">{t.settings.last6Months}</SelectItem>
                    <SelectItem value="12">{t.settings.last12Months}</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {t.settings.trendPeriodDesc}
                </p>
              </div>
            </div>
          </SettingsSection>

          <Separator />

          {/* Language Section */}
          <SettingsSection
            icon={Globe}
            title={t.settings.language}
            description={t.settings.languageDescription}
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
              {t.settings.resetDefaults}
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
