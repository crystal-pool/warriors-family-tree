/// <reference types="webpack-dev-server" />
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

const exportModuleName = "WarriorsFamilyTreeEmbed";

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
      static: {
        directory: path.join(__dirname, "assets"),
        watch: true,
        staticOptions: {}
      },
      compress: true,
      port: 3082,
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
            // We need to turn off transpileOnly to generate .d.ts files.
            transpileOnly: !isProduction,
            compilerOptions: {
              outDir: outputPath
            }
          }
        },
        {
          test: /\.s[ac]ss$/i,
          use: [
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
      isProduction || new ForkTsCheckerWebpackPlugin({
        typescript: {
          configFile: path.join(__dirname, "./src/tsconfig.json"),
        },
        issue: {
          exclude: [
            (issue) => !!issue.file?.match(/[\\\/]node_modules[\\\/]/),
          ],
        },
      }),
      new DefinePlugin(await buildEnvironmentDefinitions(isProduction)),
    ].filter((p): p is ForkTsCheckerWebpackPlugin | DefinePlugin => typeof p === "object"),
    optimization: {
      minimize: isProduction,
      minimizer: [
        new TerserPlugin({
          parallel: true,
          terserOptions: {
            // https://github.com/webpack-contrib/terser-webpack-plugin#terseroptions
            ecma: 2018,
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
      filename: "wft-embed-umd.js",
      library: exportModuleName,
      libraryTarget: "umd",
      umdNamedDefine: true
    }
  };
}
