import type { IEnvironmentInfo } from "@wft-repo/shared";
import { getGitHead, getGitVersionSpec } from "@wft-repo/shared/build/git";
import { flattenKeyPath, serializeRecordValues } from "@wft-repo/shared/build/utility";
import { resolve } from "path";
import { defineConfig, Plugin, UserConfig } from "vite";
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
      resourceLoadTrackingPlugin(),
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


function resourceLoadTrackingPlugin(): Plugin {
  return {
    name: "resource-load-tracking",
    transformIndexHtml: {
      order: "post",
      async handler(html) {
        const { parse: parseHtml } = await import("node-html-parser");
        const { rolldown } = await import("rolldown");
        const doc = parseHtml(html);

        // Read and minify the inline snippet source.
        const snippetPath = resolve(__dirname, "src/index.snippet.js");
        const bundle = await rolldown({
          input: { snippet: snippetPath },
        });
        const { output } = await bundle.generate({ minify: true });
        const minified = output[0].code;

        // Add onload/onerror tracking to Vite-injected entry tags.
        // They call window.__rlc(name, element, event) defined in the snippet.
        function getTrackingName(attr: string, type: "js" | "css"): string {
          // Extract chunk name from "/assets/{name}-{hash}.ext"
          const filename = attr.split("/").pop()!;
          const chunkName = filename.replace(/-[\w]+\.\w+$/, "");
          return `${chunkName}-${type}`;
        }

        for (const script of doc.querySelectorAll("script[src^='/assets/']")) {
          const name = getTrackingName(script.getAttribute("src")!, "js");
          script.setAttribute("onload", `__rlc('${name}',this,event);`);
          script.setAttribute("onerror", `__rlc('${name}',this,event);`);
        }

        for (const link of doc.querySelectorAll("link[rel='stylesheet'][href^='/assets/']")) {
          const name = getTrackingName(link.getAttribute("href")!, "css");
          link.setAttribute("onload", `__rlc('${name}',this,event);`);
          link.setAttribute("onerror", `__rlc('${name}',this,event);`);
        }

        // Also track the static index.css link.
        for (const link of doc.querySelectorAll("link[rel='stylesheet'][href='/index.css']")) {
          link.setAttribute("onload", `__rlc('index-css',this,event);`);
          link.setAttribute("onerror", `__rlc('index-css',this,event);`);
        }

        // Inject the minified snippet into the placeholder.
        const placeholder = doc.querySelector("script#resource-tracking");
        if (placeholder) {
          placeholder.removeAttribute("id");
          placeholder.textContent = minified.trim();
        }

        return doc.toString();
      },
    },
  };
}
