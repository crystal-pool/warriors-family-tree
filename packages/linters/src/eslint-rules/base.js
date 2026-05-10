// @ts-check
import eslint from "@eslint/js";
import stylistic from "@stylistic/eslint-plugin";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";
import { repoRootDir } from "../environment.js";

export const baseConfig = defineConfig(
  {
    ignores: [
      "**/dist/",
      "**/*.js",
      "**/*.d.ts",
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: repoRootDir,
      },
    },
    rules: {
      "@typescript-eslint/explicit-member-accessibility": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          args: "all",
          argsIgnorePattern: "^_",
          caughtErrors: "all",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
      "@typescript-eslint/prefer-nullish-coalescing": [
        "error",
        {
          ignoreBooleanCoercion: false,
          ignoreConditionalTests: true,
          ignoreIfStatements: false,
          ignoreMixedLogicalExpressions: false,
          ignorePrimitives: {
            bigint: false,
            boolean: false,
            number: false,
            string: true,
          },
          ignoreTernaryTests: false,
        },
      ],
      "@typescript-eslint/array-type": ["error", { default: "array-simple" }],
      "@typescript-eslint/no-base-to-string": ["error", {
        checkUnknown: false,
        ignoredTypeNames: ["Error", "RegExp", "URL", "URLSearchParams", "{}"],
      }],
      "no-var": "error",
      "no-duplicate-imports": "error",
    },
  },
  {
    plugins: {
      "@stylistic": stylistic,
    },
    rules: {
      "@stylistic/quotes": ["error", "double", {
        "allowTemplateLiterals": "always",
      }],
      "@stylistic/semi": ["error", "always"],
      "@stylistic/eol-last": "error",
    },
  },
);
