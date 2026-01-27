import { TrendingUp, Calendar } from "lucide-react";

export function DashboardHeader() {
  const currentDate = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <header className="mb-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary rounded-xl shadow-lg shadow-primary/20">
            <TrendingUp className="h-7 w-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
              Dashboard de Metas
            </h1>
            <p className="text-muted-foreground">
              Setor de Crescimento • Comercial & Marketing
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-card px-4 py-2 rounded-lg border border-border">
          <Calendar className="h-4 w-4" />
          <span className="capitalize">{currentDate}</span>
        </div>
      </div>
    </header>
  );
}
