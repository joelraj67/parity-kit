import js from "@eslint/js";
import globals from "globals";
import prettier from "eslint-config-prettier";

export default [
  {
    ignores: [
      "node_modules/**",
      "coverage/**",
      "parity-report/**",
      "**/*.min.js",
      "templates/**",
      "examples/**",
    ],
  },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
    rules: {
      "no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrors: "none" }
      ],
      "no-empty": ["error", { allowEmptyCatch: true }],
      "no-console": "off",
      "prefer-const": "warn",
      "no-useless-escape": "off",
    },
  },
  prettier,
];
