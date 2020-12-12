import CopyPlugin from "copy-webpack-plugin";
import ForkTsCheckerWebpackPlugin from "fork-ts-checker-webpack-plugin";
import fs from "fs";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import path from "path";
import TerserPlugin from "terser-webpack-plugin";
import webpack from "webpack";
import WebpackDevServer from "webpack-dev-server";
import { IEnvironmentInfo } from "./shared/environment";
import { getGitHead, getGitVersionSpec } from "./shared/git";
import { flattenKeyPath, serializeRecordValues } from "./shared/utility";

declare module "webpack" {
  interface Configuration {
    devServer?: WebpackDevServer.Configuration;
  }
}

async function buildEnvironmentDefinitions(isProduction: boolean) {
  const version = await getGitVersionSpec();
  const definitions = serializeRecordValues(flattenKeyPath({
    environment: ({
      commitId: await getGitHead(),
      version,
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
  console.info("App version:", version);
  return definitions;
}

// tslint:disable:object-literal-sort-keys
export default async function config(env: any, argv: Record<string, string>): Promise<webpack.Configuration> {
  const isProduction = argv.mode === "production";
  const isRunAsDevServer = process.env.WEBPACK_DEV_SERVER === "true";
  const outputPath = path.resolve(__dirname, "dist");
  console.info("isRunAsDevServer:", isRunAsDevServer);
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
          use: [
            //isRunAsDevServer ? "style-loader" : MiniCssExtractPlugin.loader,
            { loader: MiniCssExtractPlugin.loader },
            "@teamsupercell/typings-for-css-modules-loader",
            // Translates CSS into CommonJS
            {
              loader: "css-loader",
              options: {
                modules: {
                  localIdentName: isProduction ? "[hash:base64]" : "[path][name]__[local]",
                  exportLocalsConvention: "camelCaseOnly",
                },
              }
            },
            // Compiles Sass to CSS
            "sass-loader",
          ]
        },
      ]
    },
    resolve: {
      extensions: [".tsx", ".ts", ".js"],
      alias: {
        fs: false,
        child_process: false
      }
    },
    plugins: [
      new CopyPlugin({
        patterns: [
          { from: path.join(__dirname, "assets"), to: outputPath }
        ]
      }),
      new webpack.DefinePlugin(await buildEnvironmentDefinitions(isProduction)),
      new ForkTsCheckerWebpackPlugin({
        typescript: {
          configFile: path.join(__dirname, "./src/tsconfig.json"),
        },
        issue: {
          exclude: [
            (issue) => !!issue.file?.match(/[\\\/]node_modules[\\\/]/),
          ],
        },
      }),
      new MiniCssExtractPlugin({ filename: "index1.css" })
    ],
    optimization: {
      minimize: isProduction,
      minimizer: [
        new TerserPlugin({
          parallel: true,
          terserOptions: {
            // https://github.com/webpack-contrib/terser-webpack-plugin#terseroptions
            ecma: 2015,
            sourceMap: true,  // Must be set to true if using source-maps in production
            parse: {
              ecma: 2018,
            },
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
