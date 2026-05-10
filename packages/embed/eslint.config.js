// @ts-check
import * as WftLinters from "@wft-repo/linters";
import { defineConfig } from "eslint/config";

export default defineConfig(
  ...WftLinters.ESLintRules.baseConfig,
);
