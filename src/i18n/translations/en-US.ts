import type { TranslationKeys } from "./pt-BR";

export const enUS: TranslationKeys = {
  // General
  app: {
    name: "Corporate Dashboard",
    loading: "Loading...",
    save: "Save",
    cancel: "Cancel",
    confirm: "Confirm",
    delete: "Delete",
    edit: "Edit",
    close: "Close",
    search: "Search",
    filter: "Filter",
    all: "All",
    yes: "Yes",
    no: "No",
  },
  
  // Navigation
  nav: {
    dashboard: "Dashboard",
    admin: "Administration",
    settings: "Settings",
    logout: "Logout",
    login: "Login",
  },
  
  // Categories
  categories: {
    lucratividade: "Profitability",
    experiencia_cliente: "Growth Management",
    produtividade: "Productivity",
    gestao_pessoas: "People Management",
    aprendizado_crescimento: "Learning & Growth",
  },
  
  // Metrics
  metrics: {
    current: "Current",
    target: "Target",
    monthly: "Monthly",
    annual: "Annual",
    progress: "Progress",
    trend: "Trend",
    history: "History",
    noData: "No data",
    goalReached: "Goal reached!",
    goalMissed: "Goal not reached",
    above: "above",
    below: "below",
  },
  
  // Filters
  filters: {
    period: "Period",
    month: "Month",
    quarter: "Quarter",
    year: "Year",
    division: "Division",
    juridico: "Legal",
    crescimento: "Growth",
    marketing: "Marketing",
    administrativo: "Administrative",
    allDivisions: "All divisions",
  },
  
  // Settings Panel
  settings: {
    title: "Settings",
    description: "Customize your dashboard experience",
    
    // Theme
    theme: "Theme",
    themeDescription: "Choose display mode",
    light: "Light",
    dark: "Dark",
    
    // Notifications
    notifications: "Notifications",
    notificationsDescription: "Configure alerts and warnings",
    enableNotifications: "Enable notifications",
    enableNotificationsDesc: "Receive browser alerts",
    goalReached: "Goal reached",
    goalReachedDesc: "Notify when a goal is achieved",
    goalMissed: "Goal missed",
    goalMissedDesc: "Notify when a goal is not met",
    trendChange: "Trend change",
    trendChangeDesc: "Notify about significant changes",
    
    // Goal Display
    goalDisplay: "Goal Display",
    goalDisplayDescription: "Customize card visualization",
    showMonthlyGoals: "Monthly goals",
    showMonthlyGoalsDesc: "Show monthly reference on cards",
    showAnnualGoals: "Annual goals",
    showAnnualGoalsDesc: "Show annual goal on cards",
    showProgress: "Progress percentage",
    showProgressDesc: "Show completion % of goals",
    showSparklines: "Mini charts",
    showSparklinesDesc: "Show sparklines on cards",
    
    // Trends
    trends: "Trend Reports",
    trendsDescription: "Configure analysis and indicators",
    showTrendIndicators: "Trend indicators",
    showTrendIndicatorsDesc: "Show up/down arrows",
    trendPeriod: "Analysis period",
    trendPeriodDesc: "Period used to calculate trends and comparisons",
    last3Months: "Last 3 months",
    last6Months: "Last 6 months",
    last12Months: "Last 12 months",
    
    // Language
    language: "Language",
    languageDescription: "Select interface language",
    languageChanged: "Language changed",
    languageChangedDesc: "The language will be applied across the interface.",
    
    // Reset
    resetDefaults: "Reset to defaults",
    preferencesRestored: "Preferences restored",
    preferencesRestoredDesc: "All settings have been reset to default values.",
  },
  
  // Data Entry
  dataEntry: {
    title: "Data Entry",
    selectMonth: "Select month",
    enterValue: "Enter value",
    confirmEntry: "Confirm entry?",
    confirmMessage: "You are about to record the value {value} for {metric} in {month}.",
    success: "Value recorded successfully!",
    error: "Error recording value",
  },
  
  // Offline Mode
  offline: {
    indicator: "Offline",
    online: "Online",
    pendingChanges: "pending changes",
    sync: "Sync",
    syncing: "Syncing...",
    syncSuccess: "Data synced successfully!",
    syncError: "Error syncing data",
    lastSync: "Last sync",
  },
  
  // Tour
  tour: {
    welcome: "Welcome to the Dashboard!",
    welcomeDesc: "Let's take a quick tour of the main features.",
    notifications: "Notifications",
    notificationsDesc: "Receive alerts about achieved goals or important metrics.",
    filters: "Filters",
    filtersDesc: "Use filters to analyze data by period or division.",
    monthSelector: "Month Selector",
    monthSelectorDesc: "Click to select a specific month and enter data.",
    dataEntry: "Data Entry",
    dataEntryDesc: "With a month selected, click on cards to edit values.",
    settings: "Settings",
    settingsDesc: "Customize theme, notifications and display preferences.",
    complete: "Tour complete!",
    completeDesc: "You're ready to use the dashboard. Click ? to redo the tour.",
    next: "Next",
    prev: "Previous",
    done: "Done",
    skip: "Skip",
  },
  
  // Months
  months: {
    january: "January",
    february: "February",
    march: "March",
    april: "April",
    may: "May",
    june: "June",
    july: "July",
    august: "August",
    september: "September",
    october: "October",
    november: "November",
    december: "December",
  },
  
  // Toasts
  toasts: {
    metricUpdated: "Metric updated",
    metricUpdatedDesc: "Values have been saved successfully.",
    error: "Error",
    errorSaving: "Error saving",
  },
};
