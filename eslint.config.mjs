// ESLint flat config — remplace `next lint` (déprécié depuis Next 15.5).
// Étend les règles Next.js via FlatCompat (@eslint/eslintrc) le temps que
// eslint-config-next expose une flat config native.
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  {
    ignores: [
      ".next/",
      "node_modules/",
      "next-env.d.ts",
      // Fichier de référence design, ne pas linter.
      "console-creation-v2.jsx",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];

export default eslintConfig;
