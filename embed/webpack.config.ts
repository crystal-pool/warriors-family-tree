import ForkTsCheckerWebpackPlugin from "fork-ts-checker-webpack-plugin";
import path from "path";
import TerserPlugin from "terser-webpack-plugin";
import webpack, { DefinePlugin } from "webpack";
import { IEnvironmentInfo } from "../shared/environment";
import { getGitHead } from "../shared/git";
import { flattenKeyPath, serializeRecordValues } from "../shared/utility";

async function buildEnvironmentDefinitions(isProduction: boolean) {
  const definitions = serializeRecordValues(flattenKeyPath({
    environment: ({
      commitId: await getGitHead(),
      buildTimestamp: Date.now(),
      isProduction,
      aiInstrumentationKey: undefined
    }) as IEnvironmentInfo
  }));
  return definitions;
}

// tslint:disable:object-literal-sort-keys
export default async function config(env: any, argv: Record<string, string>): Promise<webpack.Configuration> {
  const isProduction = argv.mode === "production";
  const outputPath = path.resolve(__dirname, "dist");
  console.info("mode:", argv.mode);
  console.info("isProduction:", isProduction);
  return {
    mode: isProduction ? "production" : "development",
    entry: path.join(__dirname, "./src/index.ts"),
    devtool: isProduction ? "source-map" : "inline-source-map",
    devServer: {
      contentBase: path.join(__dirname, "assets"),
      compress: true,
      port: 3082,
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
      new ForkTsCheckerWebpackPlugin({
        useTypescriptIncrementalApi: true,
        tsconfig: path.join(__dirname, "./src/tsconfig.json"),
        reportFiles: ["!**/node_modules/**"]
      }),
      new DefinePlugin(await buildEnvironmentDefinitions(isProduction)),
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
      filename: "wft-embed-umd.js",
      library: "WarriorsFamilyTreeEmbed",
      libraryTarget: "umd"
    }
  };
}
