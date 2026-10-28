import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      ".netlify/**",
      "whatsapp-bot/**",
    ],
  },
  {
    // The CRM is ported from the HELLODOCTOR project and kept close to its
    // source so future fixes there can be carried across. Its loose typing is
    // inherited, not new; the website code stays on the strict rules.
    files: ["src/crm/**", "src/app/(crm)/**", "src/app/api/crm/**"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "react/no-unescaped-entities": "off",
    },
  },
];

export default eslintConfig;
