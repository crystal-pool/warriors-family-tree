import { resolve } from "path";
import checker from "vite-plugin-checker";
import { defineConfig } from "vite";
import { getGitHead } from "@wft-repo/shared/build/git";
import { flattenKeyPath, serializeRecordValues } from "@wft-repo/shared/build/utility";
import type { IEnvironmentInfo } from "@wft-repo/shared";

const LIB_NAME = "WarriorsFamilyTreeEmbed";

export default defineConfig(async ({ mode }) => {
  const isProduction = mode === "production";
  const repoRoot = resolve(__dirname, "../..");

  let commitId = "unknown";
  try {
    commitId = await getGitHead(repoRoot);
  } catch {
    // Git info unavailable; fall through.
  }

  const definitions = serializeRecordValues(flattenKeyPath({
    environment: {
      commitId,
      buildTimestamp: Date.now(),
      isProduction,
      aiInstrumentationKey: undefined,
    } as IEnvironmentInfo,
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
      port: 3082,
    },
    build: {
      outDir: "dist",
      sourcemap: true,
      lib: {
        entry: resolve(__dirname, "src/index.ts"),
        name: LIB_NAME,
        // UMD output for consumers loading via <script> tag.
        // To switch to ESM-only in the future:
        //   1. Change formats to ["es"]
        //   2. Remove `name` (UMD global name)
        //   3. Update README.md embed instructions to use <script type="module">
        //      and `import * as WarriorsFamilyTreeEmbed from "./wft-embed.js"`
        formats: ["umd"],
        fileName: () =>"wft-embed-umd.js",
      },
      rollupOptions: {
        // No externals — everything bundled for standalone embed usage.
        output: {
          // The es2015 preset enables Symbol.toStringTag for namespace
          // objects, but the minifier aliases global Symbol to a variable
          // defined *after* the marker, crashing the UMD bundle at load
          // time.  Disable it since it's unnecessary for a standalone lib.
          generatedCode: {
            symbols: false,
          },
        },
      },
    },
  };
});
