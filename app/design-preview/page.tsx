import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BadgeCheck, CalendarCheck2, Trophy, UsersRound } from "lucide-react";
import { TrendPreview } from "./_components/TrendPreview";

export const metadata: Metadata = { title: "Prévia visual | AceleraOS" };

function sparklineChange(values: number[]) {
  const first = values[0] ?? 0;
  const last = values.at(-1) ?? 0;
  if (first === 0) return null;
  const change = Math.round(((last - first) / first) * 100);
  return `${change > 0 ? "+" : ""}${change}%`;
}

/** Prévia isolada: os números e nomes abaixo não são dados de clientes. */
export default function DesignPreview() {
  // A prévia contém empresas e resultados fictícios para validar a direção
  // visual. Nunca deve aparecer na instalação real nem ser indexada.
  if (process.env.NODE_ENV === "production") notFound();

  const indicadores = [
    {
      label: "Leads captados",
      value: "128",
      detail: "Últimos 6 meses · demonstração",
      series: [18, 20, 21, 22, 23, 24],
      icon: UsersRound,
    },
    {
      label: "Leads qualificados",
      value: "74",
      detail: "Indicador de demonstração",
      series: [11, 12, 12, 13, 13, 13],
      icon: BadgeCheck,
    },
    {
      label: "Visitas agendadas",
      value: "36",
      detail: "Indicador de demonstração",
      series: [5, 5, 6, 6, 7, 7],
      icon: CalendarCheck2,
    },
    {
      label: "Negócios ganhos",
      value: "18",
      detail: "Fechamentos de demonstração",
      series: [2, 2, 3, 3, 4, 4],
      icon: Trophy,
    },
  ];
  return (
    <main className="acelera-preview acelera-shell">
      <aside className="acelera-preview-nav">
        <div className="acelera-preview-brand">
          <span aria-hidden="true">A</span>
          <strong>AceleraOS</strong>
        </div>
        <div className="acelera-preview-org">
          <small>Organização de demonstração</small>
          <strong>Equipe comercial</strong>
        </div>
        <nav aria-label="Prévia da navegação">
          <span>Visão geral</span>
          <b>Desempenho</b>
          <span>Relacionamento</span>
          <p>Conversas</p>
          <p>Contatos</p>
          <p>Agenda</p>
          <span>Operação comercial</span>
          <p>Funis</p>
          <p>Campanhas</p>
          <p>Agentes de IA</p>
        </nav>
        <footer>Prévia visual · dados fictícios</footer>
      </aside>
      <section className="acelera-preview-main">
        <header>
          <span>
            Visão geral <i>/</i> <strong>Desempenho</strong>
          </span>
          <span>Equipe comercial</span>
        </header>
        <div className="acelera-preview-content">
          <div className="acelera-preview-title">
            <div>
              <h1>Desempenho comercial</h1>
              <p>Uma visão clara da sua operação e das próximas oportunidades.</p>
            </div>
            <span>Últimos 6 meses</span>
          </div>
          <div className="acelera-metrics-section-heading acelera-metrics-overview-heading">
            <div>
              <h2>Panorama comercial</h2>
              <p>Captação, qualificação, visitas e fechamentos no período.</p>
            </div>
            <span>Dados ilustrativos</span>
          </div>
          <div className="acelera-overview-summary acelera-sales-overview acelera-sales-overview-four">
            {indicadores.map((item) => (
              <div key={item.label}>
                <div className="acelera-sales-overview-label">
                  <span>{item.label}</span>
                  <i aria-hidden="true">
                    <item.icon />
                  </i>
                </div>
                <div className="acelera-sales-overview-value">
                  <strong>{item.value}</strong>
                  {sparklineChange(item.series) && (
                    <span
                      className="acelera-metric-delta is-up"
                      title="Variação entre o primeiro e o último intervalo"
                    >
                      {sparklineChange(item.series)}
                    </span>
                  )}
                </div>
                <small>{item.detail}</small>
              </div>
            ))}
          </div>
          <div className="acelera-preview-grid acelera-preview-performance-grid">
            <TrendPreview />
          </div>
          <p className="acelera-preview-note">
            Os números e nomes desta tela são fictícios e servem somente para demonstrar o design.
          </p>
        </div>
      </section>
    </main>
  );
}
