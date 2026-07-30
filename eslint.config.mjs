import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import { globalIgnores } from "eslint/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// eslint-config-next@15.5.22 still ships the old eslintrc-style config
// ({ extends: [...] }), not a native ESLint 9 flat-config array — FlatCompat
// bridges it. (create-next-app's default template assumes a newer
// eslint-config-next shape that this pinned Next 15 version doesn't have.)
const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "lib/generated/**",
    "scripts/**",
  ]),
];

export default eslintConfig;
