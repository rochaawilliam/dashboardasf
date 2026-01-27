import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { TrainingCard } from "@/components/dashboard/TrainingCard";
import { 
  DollarSign, 
  Shield, 
  Heart, 
  Users, 
  Zap, 
  GraduationCap 
} from "lucide-react";

const trainingData = [
  { role: "Estagiário", hours: 4, target: 4 },
  { role: "Jurídico Interno", hours: 5, target: 5 },
  { role: "Administrativo", hours: 6, target: 6 },
  { role: "Liderança", hours: 6, target: 6 },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DashboardHeader />
        <SummaryCards />

        {/* Lucratividade */}
        <section className="mb-8">
          <SectionHeader
            title="Lucratividade"
            subtitle="Aumentar lucratividade e margem do negócio"
            icon={DollarSign}
            variant="primary"
          />
          <div className="dashboard-grid">
            <MetricCard
              label="Cumprimento de Orçamento"
              value={95}
              target={95}
              progress={100}
              status="success"
              description="Meta de cumprimento do orçamento anual"
            />
            <MetricCard
              label="SLA Externo"
              value={90}
              target={90}
              progress={100}
              status="success"
              description="Proteger o caixa e blindar contra perdas"
            />
            <MetricCard
              label="Lead Time de Onboarding"
              value={45}
              target={45}
              progress={100}
              status="success"
              unit="%"
              description="Tempo de integração de novos clientes"
            />
          </div>
        </section>

        {/* Taxa de Sucesso / Experiência do Cliente */}
        <section className="mb-8">
          <SectionHeader
            title="Experiência do Cliente"
            subtitle="Entregar experiência consistente e previsível"
            icon={Heart}
            variant="accent"
          />
          <div className="dashboard-grid">
            <MetricCard
              label="Churn de Clientes"
              value={3.75}
              target={3.75}
              progress={100}
              status="success"
              description="Divisão: Jurídico"
            />
            <MetricCard
              label="Lifetime Médio do Cliente"
              value={2.5}
              target={2.5}
              progress={100}
              status="success"
              unit=" anos"
              description="Tempo médio de retenção de clientes"
            />
            <MetricCard
              label="NPS"
              value={76}
              target={76}
              progress={100}
              status="success"
              unit=" pts"
              description="Divisão: Crescimento"
            />
          </div>
        </section>

        {/* Produtividade */}
        <section className="mb-8">
          <SectionHeader
            title="Produtividade"
            subtitle="Garantir eficiência do time jurídico"
            icon={Zap}
            variant="warning"
          />
          <div className="dashboard-grid">
            <MetricCard
              label="Capacidade Ocupada (IC)"
              value={80}
              target={80}
              progress={100}
              status="success"
              description="Percentual de capacidade utilizada"
            />
            <MetricCard
              label="IC Médio por Advogado"
              value={80}
              target={80}
              progress={100}
              status="success"
              description="Índice de capacidade individual"
            />
          </div>
        </section>

        {/* Gestão de Pessoas */}
        <section className="mb-8">
          <SectionHeader
            title="Gestão de Pessoas"
            subtitle="Construir um time estável, produtivo e engajado"
            icon={Users}
            variant="success"
          />
          <div className="dashboard-grid">
            <MetricCard
              label="Turnover"
              value={3.5}
              target={3.5}
              progress={100}
              status="success"
              description="Taxa de rotatividade de colaboradores"
            />
            <MetricCard
              label="eNPS"
              value={76}
              target={76}
              progress={100}
              status="success"
              unit=" pts"
              description="Satisfação dos colaboradores"
            />
          </div>
        </section>

        {/* Aprendizado e Crescimento */}
        <section className="mb-8">
          <SectionHeader
            title="Aprendizado e Crescimento"
            subtitle="Desenvolver competências técnicas e lideranças internas"
            icon={GraduationCap}
            variant="primary"
          />
          <div className="dashboard-grid">
            <TrainingCard items={trainingData} />
          </div>
        </section>
      </div>
    </div>
  );
};

export default Index;
