const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const TerserWebpackPlugin = require("terser-webpack-plugin");
const OptimizeCssAssetsPlugin = require("optimize-css-assets-webpack-plugin");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
const WorkboxPlugin = require("workbox-webpack-plugin");

module.exports = function(_env, argv) {
  const isProduction = argv.mode === "production";
  const isDevelopment = !isProduction;

  return {
    devtool: isDevelopment && "cheap-module-source-map",
    entry: "./src/index.tsx",
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "assets/js/[name].[contenthash:8].js",
      publicPath: "/"
    },
    module: {
      rules:[
        {
          test: /\.(js|jsx|ts|tsx)$/,
          exclude: /node_modules/,
          use: {
            loader: "babel-loader",
            options:{
              cacheDirectory: true,
              cacheCompression: false,
              envName: isProduction ? "production" : "development"
            }
          }
        },
        {
          test: /\.worker\.js$/,
          loader: "worker-loader"
        },
        {
          test: /\.css$/,
          use: [
            isProduction ? MiniCssExtractPlugin.loader : "style-loader",
            "css-loader"
          ]
        },
        //With this rule, any file ending in .module.css will be processed with CSS Modules enabled
        {
          test: /\.module.css$/,
          use: [
            isProduction ? MiniCssExtractPlugin.loader : "style-loader",
            {
              loader: "css-loader",
              options: {
                modules: true,
                importLoaders: 1
              }
            },
            "postcss-loader"
          ]
        },
        {
          test: /\.s[ac]ss$/,
          use: [
            isProduction ? MiniCssExtractPlugin.loader : "style-loader",
            {
              loader: "css-loader",
              options: {
                importLoaders: 2
              }
            },
            "resolve-url-loader",
            {
              loader: "sass-loader",
              options: {
                sourceMap: true
              }
            }
          ]
        },
        {
          test: /\.(png|jpg|gif)$/i,
          use: {
            loader: "url-loader",
            options: {
              limit: 8192,
              name: "static/media/[name].[hash:8].[ext]"
            }
          }
        },
        {
          test: /\.svg$/,
          use: ["@svgr/webpack"]
        },
        {
          test: /\.(eot|otf|ttf|woff|woff2)$/,
          loader: require.resolve("file-loader"),
          options: {
            name: "static/media/[name].[hash:8].[ext]"
          }
        },
        
      ]
    },
    resolve: {
      extensions: [".js", ".jsx", ".ts", ".tsx"]
     },
    plugins: [
      isProduction &&
      new MiniCssExtractPlugin({
        filename: "assets/css/[name].[contenthash:8].css",
        chunkFilename: "assets/css/[name].[contenthash:8].chunk.css"
      }),
      new webpack.DefinePlugin({
        "process.env.NODE_ENV": JSON.stringify(
          isProduction ? "production" : "development"
        )
      }),
      new HtmlWebpackPlugin({
        template: path.resolve(__dirname, "public/index.html"),
        inject: true
      }),
      new ForkTsCheckerWebpackPlugin({
        async: false
      }),
      new WorkboxPlugin.GenerateSW({
        swDest: "service-worker.js",
        clientsClaim: true,
        skipWaiting: true
      })
    ].filter(Boolean),
    optimization: {
      minimize: isProduction,
      minimizer: [
        new TerserWebpackPlugin({
          terserOptions: {
            compress: {
              comparisons: false
            },
            mangle: {
              safari10: true
            },
            output: {
              comments: false,
              ascii_only: true
            },
            warnings: false
          }
        }),
        new OptimizeCssAssetsPlugin()
      ],
      splitChunks: {
        chunks: "all",
        minSize: 0,
        maxInitialRequests: 20,
        maxAsyncRequests: 20,
        cacheGroups: {
          vendors: {
            test: /[\\/]node_modules[\\/]/,
            name(module, chunks, cacheGroupKey) {
              const packageName = module.context.match(
                /[\\/]node_modules[\\/](.*?)([\\/]|$)/
                )[1];
                return `${cacheGroupKey}.${packageName.replace("@", "")}`;
              }
            },
            common: {
              minChunks: 2,
              priority: -10
            }
          }
        },
      runtimeChunk: "single"
    },
    devServer: {
      compress: true,
      historyApiFallback: true,
      open: true,
      overlay: true
    }
  };
};

