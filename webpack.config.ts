import child_process from "child_process";
import CopyPlugin from "copy-webpack-plugin";
import path from "path";
import { PromiseResolutionSource } from "tasklike-promise-library";
import TerserPlugin from "terser-webpack-plugin";
import webpack, { DefinePlugin } from "webpack";
import { IEnvironmentInfo } from "./shared/environment";
import { flattenKeyPath } from "./shared/utility";

function getGitHead(): Promise<string> {
  const prs = new PromiseResolutionSource<string>();
  child_process.exec("git rev-parse HEAD", (error, stdout) => {
    if (error) {
      prs.tryReject(error);
    } else {
      prs.tryResolve(stdout.trim());
    }
  });
  return prs.promise;
}

function serializeRecordValues(records: Record<string, unknown>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const key in records) {
    if (Object.prototype.hasOwnProperty.call(records, key)) {
      result[key] = JSON.stringify(records[key]);
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
      new DefinePlugin(serializeRecordValues(flattenKeyPath({
        environment: ({
          commitId: await getGitHead(),
          buildTimestamp: Date.now(),
          isProduction
        }) as IEnvironmentInfo
      })))
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
