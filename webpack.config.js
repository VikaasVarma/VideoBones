const HtmlWebpackPlugin = require('html-webpack-plugin')
const path = require('path')

let common_config = {
  mode: process.env.NODE_ENV || 'development',
  devtool: 'inline-source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: [
          /node_modules/,
          path.join(__dirname, 'dist')
        ]
      },
      {
        test: /\.s(c|a)ss$/,
        use: ['style-loader', 'css-loader', 'sass-loader'],
        exclude: [
          /node_modules/,
          path.join(__dirname, 'dist')
        ]
      },
      {
        test: /\.(png|svg|woff2?|ttf)$/,
        type: 'asset/resource'
      }
    ]
  },
  resolve: {
    extensions: [ '.tsx', '.ts', '.js' ]
  }
}

module.exports = [
  Object.assign({}, common_config, {
    target: 'electron-main',
    entry: {
      main: './src/main/index.ts'
    },
    output: {
      filename: 'index.js',
      path: path.join(__dirname, 'dist/main')
    }
  }),
  Object.assign({}, common_config, {
    target: 'electron-renderer',
    entry: {
      renderer: './src/renderer/index.ts'
    },
    output: {
      filename: 'index.js',
      path: path.join(__dirname, 'dist/renderer')
    },
    plugins: [ new HtmlWebpackPlugin() ]
  })
]
