import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const isDev = process.env.NODE_ENV === "development";

// Content-Security-Policy, construite sur les besoins réels du projet :
// - script-src : Next.js App Router injecte des scripts inline sans nonce
//   (bootstrap d'hydratation) → 'unsafe-inline' requis ; en dev, le HMR de
//   Next a besoin de 'unsafe-eval'. Piste de durcissement : CSP à nonce via
//   middleware si le template devient exposé publiquement.
// - style-src : Tailwind injecte des styles inline + feuille Google Fonts.
// - font-src : fichiers de polices servis par fonts.gstatic.com.
// - connect-src 'self' : vérifié dans le code — les appels Ollama/
//   GitHub partent du serveur (routes /api), jamais du navigateur.
// - img-src : data:/blob: pour les aperçus et exports (Chart.js).
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Interdit l'affichage en iframe (clickjacking) — doublé par
          // frame-ancestors 'none' dans la CSP.
          { key: "X-Frame-Options", value: "DENY" },
          // Empêche le navigateur de « deviner » un type MIME différent.
          { key: "X-Content-Type-Options", value: "nosniff" },
          // N'envoie que l'origine aux sites tiers, l'URL complète en interne.
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          // Coupe les APIs sensibles que l'app n'utilise pas.
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          { key: "Content-Security-Policy", value: csp },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
