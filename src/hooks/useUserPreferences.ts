import { useState, useEffect, useCallback } from "react";

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

export function useUserPreferences() {
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

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  }, [preferences]);

  const updatePreference = useCallback(<K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    setPreferencesState(prev => ({ ...prev, [key]: value }));
  }, []);

  const resetPreferences = useCallback(() => {
    setPreferencesState(defaultPreferences);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    preferences,
    updatePreference,
    resetPreferences,
  };
}
