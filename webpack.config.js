const HtmlWebpackPlugin = require('html-webpack-plugin')
const path = require('path')

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
        use: ['style-loader', 'css-loader', 'sass-loader'],
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
    plugins: [ new HtmlWebpackPlugin() ]
  })
]
