const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const { VueLoaderPlugin } = require('vue-loader');

let common_config = {
  devServer: {
    hot: true,
    static: './build'
  },
  devtool: 'inline-source-map',
  mode: process.env.NODE_ENV || 'development',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: [
          /node_modules/,
          path.join(__dirname, 'build'),
          path.join(__dirname, 'dist')
        ]
      },
      {
        test: /\.s(c|a)ss$/,
        use: [ 'style-loader', 'css-loader', 'sass-loader' ],
        exclude: [
          /node_modules/,
          path.join(__dirname, 'build'),
          path.join(__dirname, 'dist')
        ]
      },
      {
        test: /\.(png|svg|woff2?|ttf)$/,
        type: 'asset/resource'
      }
    ]
  },
  optimization: {
    usedExports: true
  },
  resolve: {
    alias: {
      'vue': '@vue/runtime-dom'
    },
    extensions: [ '.vue', '.tsx', '.ts', '.js' ]
  }
};

module.exports = [
  Object.assign({}, common_config, {
    target: 'electron-main',
    entry: {
      main: './src/main/index.ts'
    },
    output: {
      filename: 'index.js',
      path: path.join(__dirname, 'build/main')
    }
  }),
  Object.assign({}, common_config, {
    target: 'electron-renderer',
    entry: {
      renderer: './src/renderer/index.ts'
    },
    output: {
      filename: 'index.js',
      path: path.join(__dirname, 'build/renderer')
    },
    module: {
      rules: [
        {
          test: /\.vue$/,
          loader: 'vue-loader'
        },
        {
          test: /\.ts$/,
          loader: 'ts-loader',
          options: {
            appendTsSuffixTo: [ /\.vue$/ ]
          }
        },
        {
          test: /\.scss$/,
          use: [
            'vue-style-loader',
            'css-loader',
            'sass-loader'
          ]
        },
        {
          test: /\.(jpe?g|png|gif|svg)$/, 
          loader: 'file-loader'
        }
      ]
    },
    plugins: [ new VueLoaderPlugin(), new HtmlWebpackPlugin({
      inject: false,
      templateContent: ({htmlWebpackPlugin}) => `<html><head>${htmlWebpackPlugin.tags.headTags}</head><body><div id="app"></div>${htmlWebpackPlugin.tags.bodyTags}</body></html>`
    })
    ]
  })
];
