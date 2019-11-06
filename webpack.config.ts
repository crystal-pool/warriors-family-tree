import CopyPlugin from "copy-webpack-plugin";
import ForkTsCheckerWebpackPlugin from "fork-ts-checker-webpack-plugin";
import fs from "fs";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import path from "path";
import TerserPlugin from "terser-webpack-plugin";
import webpack from "webpack";
import { IEnvironmentInfo } from "./shared/environment";
import { getGitHead } from "./shared/git";
import { flattenKeyPath, serializeRecordValues } from "./shared/utility";

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
          loader: [
            //isRunAsDevServer ? "style-loader" : MiniCssExtractPlugin.loader,
            {
              loader: MiniCssExtractPlugin.loader,
              options: {
                hmr: isRunAsDevServer,
              },
            },
            "@teamsupercell/typings-for-css-modules-loader",
            // Translates CSS into CommonJS
            {
              loader: "css-loader",
              options: {
                modules: {
                  localIdentName: isProduction ? "[hash:base64]" : "[path][name]__[local]"
                },
                localsConvention: "camelCaseOnly",
              }
            },
            // Compiles Sass to CSS
            "sass-loader",
          ]
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
      new webpack.DefinePlugin(await buildEnvironmentDefinitions(isProduction)),
      new ForkTsCheckerWebpackPlugin({
        useTypescriptIncrementalApi: true,
        tsconfig: path.join(__dirname, "./src/tsconfig.json"),
        reportFiles: ["!**/node_modules/**"]
      }),
      new MiniCssExtractPlugin({ filename: "index1.css" })
    ] as webpack.Plugin[],
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
