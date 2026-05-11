import type { IEnvironmentInfo } from "@wft-repo/shared";
import { getGitHead, getGitVersionSpec } from "@wft-repo/shared/build/git";
import { flattenKeyPath, serializeRecordValues } from "@wft-repo/shared/build/utility";
import { resolve } from "path";
import { defineConfig, Plugin, UserConfig } from "vite";
import checker from "vite-plugin-checker";

export default defineConfig(async (env): Promise<UserConfig> => {
  const isProduction = env.mode === "production";
  const repoRoot = resolve(__dirname, "../..");

  const definitions = serializeRecordValues(flattenKeyPath({
    environment: {
      commitId: await getGitHead(repoRoot),
      version: await getGitVersionSpec(repoRoot),
      buildTimestamp: Date.now(),
      isProduction,
    } satisfies IEnvironmentInfo,
  }));

  const base = process.env.WFT_APP_BASE_PATH || "/";

  return {
    root: __dirname,
    base,
    define: definitions,
    plugins: [
      checker({
        typescript: {
          tsconfigPath: "src/tsconfig.json",
        }
      }),
      resourceLoadTrackingPlugin(base),
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


function resourceLoadTrackingPlugin(base: string): Plugin {
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
          // Extract chunk name from "{base}assets/{name}-{hash}.ext"
          const filename = attr.split("/").pop()!;
          const chunkName = filename.replace(/-[\w]+\.\w+$/, "");
          return `${chunkName}-${type}`;
        }

        const assetsPrefix = `${base}assets/`;
        for (const script of doc.querySelectorAll(`script[src^='${assetsPrefix}']`)) {
          const name = getTrackingName(script.getAttribute("src")!, "js");
          script.setAttribute("onload", `__rlc('${name}',this,event);`);
          script.setAttribute("onerror", `__rlc('${name}',this,event);`);
        }

        for (const link of doc.querySelectorAll(`link[rel='stylesheet'][href^='${assetsPrefix}']`)) {
          const name = getTrackingName(link.getAttribute("href")!, "css");
          link.setAttribute("onload", `__rlc('${name}',this,event);`);
          link.setAttribute("onerror", `__rlc('${name}',this,event);`);
        }

        // Also track the static index.css link.
        const indexCssHref = `${base}index.css`;
        for (const link of doc.querySelectorAll(`link[rel='stylesheet'][href='${indexCssHref}']`)) {
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
