const LARGURA_MINIMA = 180;
const LARGURA_MAXIMA = 760;

/** Mantém rótulos legíveis e ocupa toda a largura útil de cada painel. */
export function larguraDoGrafico(larguraDisponivel: number): number {
  if (!Number.isFinite(larguraDisponivel)) return LARGURA_MAXIMA;
  return Math.max(LARGURA_MINIMA, Math.min(LARGURA_MAXIMA, Math.floor(larguraDisponivel)));
}
