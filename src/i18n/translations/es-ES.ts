import type { TranslationKeys } from "./pt-BR";

export const esES: TranslationKeys = {
  // General
  app: {
    name: "Panel Corporativo",
    loading: "Cargando...",
    save: "Guardar",
    cancel: "Cancelar",
    confirm: "Confirmar",
    delete: "Eliminar",
    edit: "Editar",
    close: "Cerrar",
    search: "Buscar",
    filter: "Filtrar",
    all: "Todos",
    yes: "Sí",
    no: "No",
  },
  
  // Navigation
  nav: {
    dashboard: "Panel",
    admin: "Administración",
    settings: "Configuración",
    logout: "Salir",
    login: "Entrar",
  },
  
  // Categories
  categories: {
    lucratividade: "Rentabilidad",
    experiencia_cliente: "Gestión de Crecimiento",
    produtividade: "Productividad",
    gestao_pessoas: "Gestión de Personas",
    aprendizado_crescimento: "Aprendizaje y Crecimiento",
  },
  
  // Metrics
  metrics: {
    current: "Actual",
    target: "Meta",
    monthly: "Mensual",
    annual: "Anual",
    progress: "Progreso",
    trend: "Tendencia",
    history: "Historial",
    noData: "Sin datos",
    goalReached: "¡Meta alcanzada!",
    goalMissed: "Meta no alcanzada",
    above: "arriba",
    below: "abajo",
  },
  
  // Filters
  filters: {
    period: "Período",
    month: "Mes",
    quarter: "Trimestre",
    year: "Año",
    division: "División",
    juridico: "Jurídico",
    crescimento: "Crecimiento",
    marketing: "Marketing",
    administrativo: "Administrativo",
    allDivisions: "Todas las divisiones",
  },
  
  // Settings Panel
  settings: {
    title: "Configuración",
    description: "Personaliza tu experiencia en el panel",
    
    // Theme
    theme: "Tema",
    themeDescription: "Elige el modo de visualización",
    light: "Claro",
    dark: "Oscuro",
    
    // Notifications
    notifications: "Notificaciones",
    notificationsDescription: "Configura alertas y avisos",
    enableNotifications: "Activar notificaciones",
    enableNotificationsDesc: "Recibir alertas en el navegador",
    goalReached: "Meta alcanzada",
    goalReachedDesc: "Avisar cuando se alcance una meta",
    goalMissed: "Meta perdida",
    goalMissedDesc: "Avisar cuando no se alcance una meta",
    trendChange: "Cambio de tendencia",
    trendChangeDesc: "Avisar sobre cambios significativos",
    
    // Goal Display
    goalDisplay: "Visualización de Metas",
    goalDisplayDescription: "Personaliza la visualización de las tarjetas",
    showMonthlyGoals: "Metas mensuales",
    showMonthlyGoalsDesc: "Mostrar referencia mensual en las tarjetas",
    showAnnualGoals: "Metas anuales",
    showAnnualGoalsDesc: "Mostrar meta anual en las tarjetas",
    showProgress: "Porcentaje de progreso",
    showProgressDesc: "Mostrar % de conclusión de la meta",
    showSparklines: "Mini gráficos",
    showSparklinesDesc: "Mostrar sparklines en las tarjetas",
    
    // Trends
    trends: "Informe de Tendencias",
    trendsDescription: "Configura análisis e indicadores",
    showTrendIndicators: "Indicadores de tendencia",
    showTrendIndicatorsDesc: "Mostrar flechas de subida/bajada",
    trendPeriod: "Período de análisis",
    trendPeriodDesc: "Período usado para calcular tendencias y comparaciones",
    last3Months: "Últimos 3 meses",
    last6Months: "Últimos 6 meses",
    last12Months: "Últimos 12 meses",
    
    // Language
    language: "Idioma",
    languageDescription: "Selecciona el idioma de la interfaz",
    languageChanged: "Idioma cambiado",
    languageChangedDesc: "El idioma se aplicará en toda la interfaz.",
    
    // Reset
    resetDefaults: "Restaurar valores predeterminados",
    preferencesRestored: "Preferencias restauradas",
    preferencesRestoredDesc: "Todas las configuraciones se han restablecido a los valores predeterminados.",
  },
  
  // Data Entry
  dataEntry: {
    title: "Entrada de Datos",
    selectMonth: "Selecciona el mes",
    enterValue: "Ingresa el valor",
    confirmEntry: "¿Confirmar entrada?",
    confirmMessage: "Estás a punto de registrar el valor {value} para {metric} en {month}.",
    success: "¡Valor registrado con éxito!",
    error: "Error al registrar el valor",
  },
  
  // Offline Mode
  offline: {
    indicator: "Sin conexión",
    online: "En línea",
    pendingChanges: "cambios pendientes",
    sync: "Sincronizar",
    syncing: "Sincronizando...",
    syncSuccess: "¡Datos sincronizados con éxito!",
    syncError: "Error al sincronizar datos",
    lastSync: "Última sincronización",
  },
  
  // Tour
  tour: {
    welcome: "¡Bienvenido al Panel!",
    welcomeDesc: "Hagamos un recorrido rápido por las funciones principales.",
    notifications: "Notificaciones",
    notificationsDesc: "Recibe alertas sobre metas alcanzadas o métricas importantes.",
    filters: "Filtros",
    filtersDesc: "Usa los filtros para analizar datos por período o división.",
    monthSelector: "Selector de Mes",
    monthSelectorDesc: "Haz clic para seleccionar un mes específico e ingresar datos.",
    dataEntry: "Entrada de Datos",
    dataEntryDesc: "Con un mes seleccionado, haz clic en las tarjetas para editar valores.",
    settings: "Configuración",
    settingsDesc: "Personaliza el tema, notificaciones y preferencias de visualización.",
    complete: "¡Recorrido completado!",
    completeDesc: "Estás listo para usar el panel. Haz clic en ? para repetir el recorrido.",
    next: "Siguiente",
    prev: "Anterior",
    done: "Hecho",
    skip: "Omitir",
  },
  
  // Months
  months: {
    january: "Enero",
    february: "Febrero",
    march: "Marzo",
    april: "Abril",
    may: "Mayo",
    june: "Junio",
    july: "Julio",
    august: "Agosto",
    september: "Septiembre",
    october: "Octubre",
    november: "Noviembre",
    december: "Diciembre",
  },
  
  // Toasts
  toasts: {
    metricUpdated: "Métrica actualizada",
    metricUpdatedDesc: "Los valores se han guardado con éxito.",
    error: "Error",
    errorSaving: "Error al guardar",
  },
};
