"use client";

import { useEffect, useRef, useState } from "react";
import { larguraDoGrafico } from "@/lib/metrics/largura-do-grafico";

const MONTHS = ["jun", "jul", "ago", "set", "out", "nov"];
const SERIES = [
  {
    key: "leads",
    label: "Leads captados",
    values: [18, 20, 21, 22, 23, 24],
    color: "var(--color-accent)",
  },
  {
    key: "appointments",
    label: "Visitas agendadas",
    values: [5, 5, 6, 6, 7, 7],
    color: "var(--color-success)",
  },
  {
    key: "won",
    label: "Negócios ganhos",
    values: [2, 2, 3, 3, 4, 4],
    color: "var(--color-info)",
  },
] as const;

const MAX = 30;
const BASELINE = 218;
const PLOT_HEIGHT = 194;

export function TrendPreview() {
  const chartViewportRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(760);
  useEffect(() => {
    const viewport = chartViewportRef.current;
    if (!viewport || typeof ResizeObserver === "undefined") return;
    const atualizarLargura = () => setWidth(larguraDoGrafico(viewport.clientWidth));
    atualizarLargura();
    const observer = new ResizeObserver(atualizarLargura);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, []);

  const left = 48;
  const right = 18;
  const plotWidth = width - left - right;
  const x = MONTHS.map((_, index) => left + (index / (MONTHS.length - 1)) * plotWidth);
  const dataSeries = SERIES.map((series) => {
    const points = series.values.map((value, index) => ({
      x: x[index] ?? left,
      y: BASELINE - (value / MAX) * PLOT_HEIGHT,
      value,
      month: MONTHS[index] ?? "",
    }));
    const line = points
      .map((point, index) => `${index === 0 ? "M" : "L"}${point.x} ${point.y}`)
      .join(" ");
    const area = `${line} L${width - right} ${BASELINE} L${left} ${BASELINE} Z`;

    return { ...series, points, line, area };
  });

  return (
    <section className="acelera-preview-trend-card">
      <header className="acelera-preview-trend-header">
        <div>
          <h2>Tendência comercial</h2>
          <p>Evolução ilustrativa ao longo de seis meses</p>
        </div>
        <div className="acelera-trend-legend" aria-label="Séries do gráfico">
          {dataSeries.map((series) => (
            <span key={series.key}>
              <i
                className={`acelera-trend-legend-dot ${series.key === "appointments" ? "acelera-trend-legend-appointments" : series.key === "won" ? "acelera-trend-legend-won" : ""}`}
                aria-hidden="true"
              />
              {series.label}
            </span>
          ))}
        </div>
      </header>
      <div className="acelera-funnel-chart-wrap">
        <div
          ref={chartViewportRef}
          className="acelera-funnel-chart-scroll"
          role="region"
          aria-label="Tendência comercial: leads captados, visitas agendadas e negócios ganhos"
          tabIndex={0}
        >
          <svg
            className="acelera-funnel-chart acelera-preview-trend-chart"
            viewBox={`0 0 ${width} 300`}
            role="img"
            aria-label="Demonstração fictícia de leads captados, visitas agendadas e negócios ganhos nos últimos seis meses"
          >
            <defs>
              {dataSeries.map((series) => (
                <linearGradient
                  key={series.key}
                  id={`acelera-preview-trend-fill-${series.key}`}
                  x1="0"
                  x2="0"
                  y1="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor={series.color} stopOpacity=".2" />
                  <stop offset="100%" stopColor={series.color} stopOpacity=".01" />
                </linearGradient>
              ))}
            </defs>
            <g className="acelera-funnel-chart-grid">
              {[30, 15, 0].map((tick) => {
                const y = BASELINE - (tick / MAX) * PLOT_HEIGHT;
                return (
                  <g key={tick}>
                    <line x1={left} x2={width - right} y1={y} y2={y} />
                    <text x={left - 10} y={y + 4} textAnchor="end">
                      {tick}
                    </text>
                  </g>
                );
              })}
            </g>
            {dataSeries.map((series) => (
              <g key={series.key} className={`acelera-preview-${series.key}-points`}>
                {series.key === "leads" && (
                  <path d={series.area} fill={`url(#acelera-preview-trend-fill-${series.key})`} />
                )}
                <path
                  d={series.line}
                  className={`acelera-funnel-chart-line acelera-preview-${series.key}-line`}
                  style={{ stroke: series.color }}
                />
                {series.points.map((point) => (
                  <g key={point.month}>
                    <title>{`${series.label} · ${point.month}: ${point.value}`}</title>
                    <circle
                      className="acelera-funnel-chart-point"
                      cx={point.x}
                      cy={point.y}
                      r="4.5"
                      style={{ stroke: series.color }}
                    />
                  </g>
                ))}
              </g>
            ))}
            {MONTHS.map((month, index) => (
              <text
                key={month}
                className="acelera-funnel-chart-label"
                x={x[index] ?? left}
                y="284"
                textAnchor="middle"
              >
                {month}
              </text>
            ))}
          </svg>
        </div>
        <p className="acelera-chart-note">
          Valores ilustrativos; a tela operacional usa os registros reais do CRM.
        </p>
      </div>
    </section>
  );
}
