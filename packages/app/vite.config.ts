import { resolve } from "path";
import checker from "vite-plugin-checker";
import { defineConfig } from "vite";
import { getGitHead, getGitVersionSpec } from "@wft-repo/shared/build/git";
import { flattenKeyPath, serializeRecordValues } from "@wft-repo/shared/build/utility";
import type { IEnvironmentInfo } from "@wft-repo/shared";

export default defineConfig(async ({ mode }) => {
  const isProduction = mode === "production";
  const repoRoot = resolve(__dirname, "../..");

  let commitId = "unknown";
  let version = "dev";
  try {
    commitId = await getGitHead(repoRoot);
    version = await getGitVersionSpec(repoRoot);
  } catch {
    // Git info unavailable in CI or detached HEAD; fall through with defaults.
  }

  const definitions = serializeRecordValues(flattenKeyPath({
    environment: {
      commitId,
      version,
      buildTimestamp: Date.now(),
      isProduction,
      aiInstrumentationKey: undefined,
    } satisfies IEnvironmentInfo,
  }));

  return {
    root: __dirname,
    define: definitions,
    plugins: [
      checker({ typescript: true }),
    ],
    css: {
      modules: {
        localsConvention: "camelCaseOnly",
      },
    },
    server: {
      port: 3080,
    },
    build: {
      outDir: "dist",
      sourcemap: true,
    },
  };
});
