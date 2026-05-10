import type { IEnvironmentInfo } from "@wft-repo/shared";
import { getGitHead, getGitVersionSpec } from "@wft-repo/shared/build/git";
import { flattenKeyPath, serializeRecordValues } from "@wft-repo/shared/build/utility";
import { resolve } from "path";
import { defineConfig, UserConfig } from "vite";
import checker from "vite-plugin-checker";

export default defineConfig(async (env): Promise<UserConfig> => {
  const isProduction = env.mode === "production";
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
      checker({
        typescript: {
          tsconfigPath: "src/tsconfig.json",
        }
      }),
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
