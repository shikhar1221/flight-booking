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
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
        "caughtErrorsIgnorePattern": "^_"
      }],
      "@typescript-eslint/no-explicit-any": "warn",
      "@next/next/no-html-link-for-pages": "warn",
      "react/no-unescaped-entities": "warn",
      "prefer-const": "warn",
      // Additional common rules set to warn
      "no-console": "warn",
      "no-debugger": "warn",
      "no-unused-vars": "warn",
      "no-undef": "warn",
      "no-empty": "warn",
      "no-duplicate-imports": "warn",
      "no-unreachable": "warn",
      "no-empty-pattern": "warn",
      "no-empty-function": "warn",
      "no-var": "warn"
    }
  }
];

export default eslintConfig;
