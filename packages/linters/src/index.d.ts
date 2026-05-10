import { Config } from "eslint/config";

/** Absolute path of repository root folder. */
export const repoRootDir: string;

export namespace ESLintRules {
  // See https://github.com/typescript-eslint/typescript-eslint/issues/8571
  export const baseConfig: ReadonlyArray<Config>;
}
