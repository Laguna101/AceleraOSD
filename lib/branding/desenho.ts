/**
 * Geometria da marca do produto. O arquivo não contém o nome nem uma arte
 * estática: instalações e organizações podem preservar sua própria marca.
 */
export const SIMBOLO = {
  viewBox: "0 0 216 216",
  transform: "translate(0 0)",
  // Monograma A com recorte interno; `fillRule=evenodd` abre o triângulo.
  d: "M20 196 81 20h54l61 176h-44l-18-54H82l-18 54z M96 106h24l-12-38z",
  modulo: { x: 72, y: 130, width: 72, height: 18, rx: 2 },
} as const;

/** Cores da marca padrão — instalações com white-label não usam esta paleta. */
export const CORES_DA_MARCA = {
  claro: { simbolo: "#6757be", nome: "#1c1a16" },
  escuro: { simbolo: "#b3a9ff", nome: "#f3f3fa" },
} as const;
