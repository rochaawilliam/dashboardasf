import { useState, useEffect } from "react";
import { driver, DriveStep, Driver } from "driver.js";
import "driver.js/dist/driver.css";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const TOUR_COMPLETED_KEY = "dashboard-tour-completed";

const tourSteps: DriveStep[] = [
  {
    element: "[data-tour='header']",
    popover: {
      title: "🎯 Dashboard Executivo Geral",
      description: "Bem-vindo ao Dashboard Executivo Geral da ASF! Aqui você acompanha todos os indicadores de desempenho do setor de Crescimento.",
      side: "bottom",
      align: "center",
    },
  },
  {
    element: "[data-tour='mobile-menu']",
    popover: {
      title: "📱 Menu de Navegação",
      description: "No celular, use este menu para navegar rapidamente entre as categorias de indicadores.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "[data-tour='notifications']",
    popover: {
      title: "🔔 Central de Alertas",
      description: "Aqui você encontra alertas sobre métricas que atingiram ou perderam suas metas. Fique atento aos indicadores críticos!",
      side: "bottom",
      align: "end",
    },
  },
  {
    element: "[data-tour='data-entry']",
    popover: {
      title: "📊 Central de Lançamentos",
      description: "Use esta seção para inserir novos valores, fazer lançamentos em massa ou consultar o histórico de lançamentos.",
      side: "bottom",
      align: "center",
    },
  },
  {
    element: "[data-tour='filters']",
    popover: {
      title: "🔍 Filtros",
      description: "Filtre os dados por período e divisão para análises mais específicas. Você também pode imprimir relatórios em PDF.",
      side: "bottom",
      align: "center",
    },
  },
  {
    element: "[data-tour='month-selector']",
    popover: {
      title: "📅 Seletor de Período",
      description: "Escolha o ano e mês para visualizar os lançamentos. Selecione 'Ano Todo' para ver o acumulado anual.",
      side: "bottom",
      align: "center",
    },
  },
  {
    element: "[data-tour='category-tabs']",
    popover: {
      title: "📁 Categorias de Métricas",
      description: "Navegue entre as diferentes categorias: Lucratividade, Crescimento, Produtividade, Pessoas e Aprendizado. No celular, deslize para navegar!",
      side: "bottom",
      align: "center",
    },
  },
  {
    element: "[data-tour='metric-card']",
    popover: {
      title: "📈 Cards de Métricas",
      description: "Cada card mostra: meta anual, valor atual, evolução histórica (sparkline) e barra de progresso. Clique no lápis para editar valores.",
      side: "top",
      align: "center",
    },
  },
  {
    popover: {
      title: "🚀 Pronto para começar!",
      description: "Você já conhece as principais funcionalidades do dashboard. Explore as métricas e acompanhe o desempenho da sua equipe. Bom trabalho!",
    },
  },
];

export function useTour() {
  const [tourCompleted, setTourCompleted] = useState(() => {
    return localStorage.getItem(TOUR_COMPLETED_KEY) === "true";
  });
  const [driverInstance, setDriverInstance] = useState<Driver | null>(null);

  useEffect(() => {
    const driverObj = driver({
      showProgress: true,
      progressText: "{{current}} de {{total}}",
      nextBtnText: "Próximo →",
      prevBtnText: "← Anterior",
      doneBtnText: "Concluir",
      steps: tourSteps,
      onDestroyed: () => {
        localStorage.setItem(TOUR_COMPLETED_KEY, "true");
        setTourCompleted(true);
      },
    });
    
    setDriverInstance(driverObj);

    return () => {
      driverObj.destroy();
    };
  }, []);

  const startTour = () => {
    if (driverInstance) {
      driverInstance.drive();
    }
  };

  const resetTour = () => {
    localStorage.removeItem(TOUR_COMPLETED_KEY);
    setTourCompleted(false);
  };

  return { tourCompleted, startTour, resetTour };
}

export function TourButton() {
  const { startTour } = useTour();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={startTour}
            className="h-8 w-8 sm:h-9 sm:w-9 border border-border/50"
          >
            <HelpCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Tour guiado do dashboard</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function AutoStartTour() {
  const { tourCompleted, startTour } = useTour();
  
  useEffect(() => {
    // Auto-start tour for new users after a short delay
    if (!tourCompleted) {
      const timer = setTimeout(() => {
        startTour();
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [tourCompleted, startTour]);

  return null;
}