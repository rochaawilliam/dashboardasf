export const ptBR = {
  // General
  app: {
    name: "Dashboard Corporativo",
    loading: "Carregando...",
    save: "Salvar",
    cancel: "Cancelar",
    confirm: "Confirmar",
    delete: "Excluir",
    edit: "Editar",
    close: "Fechar",
    search: "Buscar",
    filter: "Filtrar",
    all: "Todos",
    yes: "Sim",
    no: "Não",
  },
  
  // Navigation
  nav: {
    dashboard: "Dashboard",
    admin: "Administração",
    settings: "Configurações",
    logout: "Sair",
    login: "Entrar",
  },
  
  // Categories
  categories: {
    lucratividade: "Financeiro",
    experiencia_cliente: "Crescimento",
    marketing: "Marketing",
    administrativo: "Administrativo",
    produtividade: "Jurídico",
    gestao_pessoas: "Pessoas",
    aprendizado_crescimento: "Pessoas",
  },
  
  // Metrics
  metrics: {
    current: "Atual",
    target: "Meta",
    monthly: "Mensal",
    annual: "Anual",
    progress: "Progresso",
    trend: "Tendência",
    history: "Histórico",
    noData: "Sem dados",
    goalReached: "Meta atingida!",
    goalMissed: "Meta não atingida",
    above: "acima",
    below: "abaixo",
  },
  
  // Filters
  filters: {
    period: "Período",
    month: "Mês",
    quarter: "Trimestre",
    year: "Ano",
    division: "Divisão",
    juridico: "Jurídico",
    crescimento: "Crescimento",
    marketing: "Marketing",
    administrativo: "Administrativo",
    allDivisions: "Todas as divisões",
  },
  
  // Settings Panel
  settings: {
    title: "Configurações",
    description: "Personalize sua experiência no dashboard",
    
    // Theme
    theme: "Tema",
    themeDescription: "Escolha o modo de visualização",
    light: "Claro",
    dark: "Escuro",
    
    // Notifications
    notifications: "Notificações",
    notificationsDescription: "Configure alertas e avisos",
    enableNotifications: "Ativar notificações",
    enableNotificationsDesc: "Receber alertas no navegador",
    goalReached: "Meta atingida",
    goalReachedDesc: "Avisar quando uma meta for alcançada",
    goalMissed: "Meta perdida",
    goalMissedDesc: "Avisar quando uma meta não for atingida",
    trendChange: "Mudança de tendência",
    trendChangeDesc: "Avisar sobre alterações significativas",
    
    // Goal Display
    goalDisplay: "Exibição de Metas",
    goalDisplayDescription: "Customize a visualização dos cards",
    showMonthlyGoals: "Metas mensais",
    showMonthlyGoalsDesc: "Exibir referência mensal nos cards",
    showAnnualGoals: "Metas anuais",
    showAnnualGoalsDesc: "Exibir meta anual nos cards",
    showProgress: "Percentual de progresso",
    showProgressDesc: "Mostrar % de conclusão da meta",
    showSparklines: "Mini gráficos",
    showSparklinesDesc: "Exibir sparklines nos cards",
    
    // Trends
    trends: "Relatório de Tendências",
    trendsDescription: "Configure análises e indicadores",
    showTrendIndicators: "Indicadores de tendência",
    showTrendIndicatorsDesc: "Mostrar setas de subida/descida",
    trendPeriod: "Período de análise",
    trendPeriodDesc: "Período usado para calcular tendências e comparações",
    last3Months: "Últimos 3 meses",
    last6Months: "Últimos 6 meses",
    last12Months: "Últimos 12 meses",
    
    // Language
    language: "Idioma",
    languageDescription: "Selecione o idioma da interface",
    languageChanged: "Idioma alterado",
    languageChangedDesc: "O idioma será aplicado em toda a interface.",
    
    // Reset
    resetDefaults: "Restaurar padrões",
    preferencesRestored: "Preferências restauradas",
    preferencesRestoredDesc: "Todas as configurações foram resetadas para os valores padrão.",
  },
  
  // Data Entry
  dataEntry: {
    title: "Entrada de Dados",
    selectMonth: "Selecione o mês",
    enterValue: "Digite o valor",
    confirmEntry: "Confirmar lançamento?",
    confirmMessage: "Você está prestes a registrar o valor {value} para {metric} em {month}.",
    success: "Valor registrado com sucesso!",
    error: "Erro ao registrar valor",
  },
  
  // Offline Mode
  offline: {
    indicator: "Offline",
    online: "Online",
    pendingChanges: "alterações pendentes",
    sync: "Sincronizar",
    syncing: "Sincronizando...",
    syncSuccess: "Dados sincronizados com sucesso!",
    syncError: "Erro ao sincronizar dados",
    lastSync: "Última sincronização",
  },
  
  // Tour
  tour: {
    welcome: "Bem-vindo ao Dashboard!",
    welcomeDesc: "Vamos fazer um tour rápido pelas principais funcionalidades.",
    notifications: "Notificações",
    notificationsDesc: "Receba alertas sobre metas atingidas ou métricas importantes.",
    filters: "Filtros",
    filtersDesc: "Use os filtros para analisar dados por período ou divisão.",
    monthSelector: "Seletor de Mês",
    monthSelectorDesc: "Clique para selecionar um mês específico e inserir dados.",
    dataEntry: "Entrada de Dados",
    dataEntryDesc: "Com um mês selecionado, clique nos cards para editar valores.",
    settings: "Configurações",
    settingsDesc: "Personalize tema, notificações e preferências de visualização.",
    complete: "Tour concluído!",
    completeDesc: "Você está pronto para usar o dashboard. Clique no ? para refazer o tour.",
    next: "Próximo",
    prev: "Anterior",
    done: "Concluir",
    skip: "Pular",
  },
  
  // Months
  months: {
    january: "Janeiro",
    february: "Fevereiro",
    march: "Março",
    april: "Abril",
    may: "Maio",
    june: "Junho",
    july: "Julho",
    august: "Agosto",
    september: "Setembro",
    october: "Outubro",
    november: "Novembro",
    december: "Dezembro",
  },
  
  // Toasts
  toasts: {
    metricUpdated: "Meta atualizada",
    metricUpdatedDesc: "Os valores foram salvos com sucesso.",
    error: "Erro",
    errorSaving: "Erro ao salvar",
  },
};

export type TranslationKeys = typeof ptBR;
