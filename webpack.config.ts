import child_process from "child_process";
import CopyPlugin from "copy-webpack-plugin";
import ForkTsCheckerWebpackPlugin from "fork-ts-checker-webpack-plugin";
import fs from "fs";
import path from "path";
import { PromiseResolutionSource } from "tasklike-promise-library";
import TerserPlugin from "terser-webpack-plugin";
import webpack, { DefinePlugin } from "webpack";
import { IEnvironmentInfo } from "./shared/environment";
import { flattenKeyPath } from "./shared/utility";

function getGitHead(): Promise<string> {
  const prs = new PromiseResolutionSource<string>();
  child_process.exec("git rev-parse HEAD", {
    cwd: __dirname
  }, (error, stdout) => {
    if (error) {
      prs.tryReject(error);
    } else {
      prs.tryResolve(stdout.trim());
    }
  });
  return prs.promise;
}

async function buildEnvironmentDefinitions(isProduction: boolean) {
  const definitions = serializeRecordValues(flattenKeyPath({
    environment: ({
      commitId: await getGitHead(),
      buildTimestamp: Date.now(),
      isProduction,
      aiInstrumentationKey: undefined
    }) as IEnvironmentInfo
  }));
  const definitionPaths = [
    "./webpack.env.json",
    "./_private/webpack.env.json"
  ];
  for (const defPath of definitionPaths) {
    const fullPath = path.join(__dirname, defPath);
    try {
      await fs.promises.access(fullPath, fs.constants.F_OK);
    } catch {
      // File does not exist.
      continue;
    }
    const content = await fs.promises.readFile(fullPath);
    console.info("Loaded environment definitions from %s.", fullPath);
    const contentJson = JSON.parse(content.toString());
    Object.assign(definitions, contentJson);
  }
  return definitions;
}

function serializeRecordValues(records: Record<string, unknown>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const key in records) {
    if (Object.prototype.hasOwnProperty.call(records, key)) {
      result[key] = records[key] === undefined ? "undefined" : JSON.stringify(records[key]);
    }
  }
  return result;
}

// tslint:disable:object-literal-sort-keys
export default async function config(env: any, argv: Record<string, string>): Promise<webpack.Configuration> {
  const isProduction = argv.mode === "production";
  const outputPath = path.resolve(__dirname, "dist");
  console.info("mode:", argv.mode);
  console.info("isProduction:", isProduction);
  return {
    mode: isProduction ? "production" : "development",
    entry: "./src/index.tsx",
    devtool: isProduction ? "source-map" : "inline-source-map",
    devServer: {
      contentBase: path.join(__dirname, "assets"),
      compress: true,
      port: 3080,
      watchContentBase: true
    },
    module: {
      rules: [
        {
          loader: "ts-loader",
          test: /\.tsx?$/,
          exclude: [
            /[/\\]node_modules[/\\]/,
            /[/\\]test[/\\]/
          ],
          options: {
            experimentalWatchApi: true,
            transpileOnly: true
          }
        },
        {
          test: /\.s[ac]ss$/i,
          loader: [
            // Creates `style` nodes from JS strings
            "style-loader",
            // Translates CSS into CommonJS
            "css-loader",
            // Compiles Sass to CSS
            "sass-loader",
          ],
        },
      ]
    },
    resolve: {
      extensions: [".tsx", ".ts", ".js"]
    },
    plugins: [
      new CopyPlugin([
        { from: path.join(__dirname, "assets"), to: outputPath }
      ]),
      new DefinePlugin(await buildEnvironmentDefinitions(isProduction)),
      new ForkTsCheckerWebpackPlugin({
        useTypescriptIncrementalApi: true,
        tsconfig: path.join(__dirname, "./src/tsconfig.json"),
        reportFiles: ["!**/node_modules/**"]
      })
    ],
    optimization: {
      minimize: isProduction,
      minimizer: [
        new TerserPlugin({
          cache: true,
          parallel: true,
          sourceMap: true, // Must be set to true if using source-maps in production
          terserOptions: {
            // https://github.com/webpack-contrib/terser-webpack-plugin#terseroptions
          }
        }),
      ],
    },
    output: {
      path: outputPath,
      filename: "index.js"
    }
  };
}
