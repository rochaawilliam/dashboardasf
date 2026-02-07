import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface UserPreferences {
  // Theme
  theme: "dark" | "light";
  
  // Notifications
  notificationsEnabled: boolean;
  notifyOnGoalReached: boolean;
  notifyOnGoalMissed: boolean;
  notifyOnTrendChange: boolean;
  
  // Goal display
  showMonthlyGoals: boolean;
  showAnnualGoals: boolean;
  showProgressPercentage: boolean;
  showSparklines: boolean;
  
  // Trends
  showTrendIndicators: boolean;
  trendPeriodMonths: 3 | 6 | 12;
  
  // Language
  language: "pt-BR" | "en-US" | "es-ES";
}

const defaultPreferences: UserPreferences = {
  theme: "dark",
  notificationsEnabled: true,
  notifyOnGoalReached: true,
  notifyOnGoalMissed: true,
  notifyOnTrendChange: false,
  showMonthlyGoals: true,
  showAnnualGoals: true,
  showProgressPercentage: true,
  showSparklines: true,
  showTrendIndicators: true,
  trendPeriodMonths: 6,
  language: "pt-BR",
};

const STORAGE_KEY = "asf-user-preferences";

// Convert DB row to preferences object
function dbToPreferences(row: Record<string, unknown>): UserPreferences {
  return {
    theme: (row.theme as "dark" | "light") || defaultPreferences.theme,
    notificationsEnabled: row.notifications_enabled as boolean ?? defaultPreferences.notificationsEnabled,
    notifyOnGoalReached: row.notify_on_goal_reached as boolean ?? defaultPreferences.notifyOnGoalReached,
    notifyOnGoalMissed: row.notify_on_goal_missed as boolean ?? defaultPreferences.notifyOnGoalMissed,
    notifyOnTrendChange: row.notify_on_trend_change as boolean ?? defaultPreferences.notifyOnTrendChange,
    showMonthlyGoals: row.show_monthly_goals as boolean ?? defaultPreferences.showMonthlyGoals,
    showAnnualGoals: row.show_annual_goals as boolean ?? defaultPreferences.showAnnualGoals,
    showProgressPercentage: row.show_progress_percentage as boolean ?? defaultPreferences.showProgressPercentage,
    showSparklines: row.show_sparklines as boolean ?? defaultPreferences.showSparklines,
    showTrendIndicators: row.show_trend_indicators as boolean ?? defaultPreferences.showTrendIndicators,
    trendPeriodMonths: (row.trend_period_months as 3 | 6 | 12) || defaultPreferences.trendPeriodMonths,
    language: (row.language as "pt-BR" | "en-US" | "es-ES") || defaultPreferences.language,
  };
}

// Convert preferences object to DB format
function preferencesToDb(prefs: UserPreferences) {
  return {
    theme: prefs.theme,
    notifications_enabled: prefs.notificationsEnabled,
    notify_on_goal_reached: prefs.notifyOnGoalReached,
    notify_on_goal_missed: prefs.notifyOnGoalMissed,
    notify_on_trend_change: prefs.notifyOnTrendChange,
    show_monthly_goals: prefs.showMonthlyGoals,
    show_annual_goals: prefs.showAnnualGoals,
    show_progress_percentage: prefs.showProgressPercentage,
    show_sparklines: prefs.showSparklines,
    show_trend_indicators: prefs.showTrendIndicators,
    trend_period_months: prefs.trendPeriodMonths,
    language: prefs.language,
  };
}

export function useUserPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferencesState] = useState<UserPreferences>(() => {
    if (typeof window === "undefined") return defaultPreferences;
    
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return { ...defaultPreferences, ...JSON.parse(stored) };
      } catch {
        return defaultPreferences;
      }
    }
    return defaultPreferences;
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  // Load preferences from database when user logs in
  useEffect(() => {
    if (!user?.id) return;
    
    const loadFromDb = async () => {
      try {
        const { data, error } = await supabase
          .from("user_preferences")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Error loading preferences:", error);
          return;
        }

        if (data) {
          const dbPrefs = dbToPreferences(data);
          setPreferencesState(dbPrefs);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(dbPrefs));
          setLastSyncedAt(new Date());
        } else {
          // No preferences in DB, save current local preferences
          await saveToDb(preferences);
        }
      } catch (err) {
        console.error("Error loading preferences:", err);
      }
    };

    loadFromDb();
  }, [user?.id]);

  // Save to localStorage whenever preferences change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  }, [preferences]);

  // Save to database
  const saveToDb = async (prefs: UserPreferences) => {
    if (!user?.id) return;
    
    setIsSyncing(true);
    try {
      const dbData = {
        user_id: user.id,
        ...preferencesToDb(prefs),
      };

      const { error } = await supabase
        .from("user_preferences")
        .upsert(dbData, { onConflict: "user_id" });

      if (error) {
        console.error("Error saving preferences:", error);
      } else {
        setLastSyncedAt(new Date());
      }
    } catch (err) {
      console.error("Error saving preferences:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  const updatePreference = useCallback(<K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    setPreferencesState(prev => {
      const newPrefs = { ...prev, [key]: value };
      // Debounced save to DB
      saveToDb(newPrefs);
      return newPrefs;
    });
  }, [user?.id]);

  const resetPreferences = useCallback(async () => {
    setPreferencesState(defaultPreferences);
    localStorage.removeItem(STORAGE_KEY);
    
    if (user?.id) {
      await saveToDb(defaultPreferences);
    }
  }, [user?.id]);

  const syncPreferences = useCallback(async () => {
    if (!user?.id) return;
    
    setIsSyncing(true);
    try {
      const { data, error } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const dbPrefs = dbToPreferences(data);
        setPreferencesState(dbPrefs);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dbPrefs));
      }
      setLastSyncedAt(new Date());
    } catch (err) {
      console.error("Error syncing preferences:", err);
    } finally {
      setIsSyncing(false);
    }
  }, [user?.id]);

  return {
    preferences,
    updatePreference,
    resetPreferences,
    syncPreferences,
    isSyncing,
    lastSyncedAt,
    isLoggedIn: !!user?.id,
  };
}
