"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect, useState } from "react";

import { copyToClipboard } from "@/lib/clipboard";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [eventId, setEventId] = useState<string | undefined>(undefined);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const id = Sentry.captureException(error);
    setEventId(id);
  }, [error]);

  const displayId = eventId ?? error.digest ?? "—";

  return (
    <html lang="pt-BR">
      <body
        style={{
          margin: 0,
          fontFamily:
            '"Manrope Acelera", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
          background: "#0c0d12",
          color: "#f3f3fa",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
        }}
      >
        <div
          style={{
            maxWidth: 560,
            width: "100%",
            background:
              "radial-gradient(ellipse at 12% 0%, rgba(179, 169, 255, 0.1), transparent 58%), #14151d",
            border: "1px solid #292b39",
            borderRadius: 20,
            padding: "clamp(1.5rem, 5vw, 2.5rem)",
            textAlign: "left",
          }}
        >
          <p
            style={{
              color: "#c5bdff",
              fontSize: "0.625rem",
              fontWeight: 700,
              letterSpacing: "0.15em",
              margin: "0 0 0.875rem",
              textTransform: "uppercase",
            }}
          >
            AceleraOS · Sistema
          </p>
          <h1
            style={{
              fontSize: "1.75rem",
              margin: "0 0 0.75rem",
              fontWeight: 650,
              letterSpacing: "-0.035em",
            }}
          >
            Algo deu errado
          </h1>
          <p style={{ color: "#b5b8cc", margin: "0 0 1.5rem", lineHeight: 1.65 }}>
            Tente novamente em instantes. Se persistir, contate o suporte com o ID abaixo.
          </p>
          <div
            style={{
              fontFamily: "ui-monospace, monospace",
              fontSize: "0.75rem",
              background: "#1c1e29",
              color: "#b5b8cc",
              border: "1px solid #292b39",
              padding: "0.75rem",
              borderRadius: 10,
              marginBottom: "1rem",
              wordBreak: "break-all",
            }}
          >
            <span style={{ color: "#9398b1" }}>ID do erro</span>
            <div style={{ color: "#f3f3fa", marginTop: "0.25rem" }}>{displayId}</div>
          </div>
          <div
            style={{
              display: "flex",
              gap: "0.625rem",
              justifyContent: "flex-end",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={() => {
                void copyToClipboard(displayId).then((ok) => {
                  if (ok) {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }
                });
              }}
              style={{
                minHeight: 44,
                padding: "0.625rem 1rem",
                border: "1px solid #424457",
                background: "#1c1e29",
                color: "#f3f3fa",
                borderRadius: 10,
                cursor: "pointer",
                font: "inherit",
                fontSize: "0.8125rem",
                fontWeight: 600,
              }}
            >
              {copied ? "Copiado!" : "Copiar ID"}
            </button>
            <button
              type="button"
              onClick={() => reset()}
              style={{
                minHeight: 44,
                padding: "0.625rem 1rem",
                border: "1px solid #b3a9ff",
                background: "#b3a9ff",
                color: "#16132b",
                borderRadius: 10,
                cursor: "pointer",
                font: "inherit",
                fontSize: "0.8125rem",
                fontWeight: 700,
              }}
            >
              Tentar de novo
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
