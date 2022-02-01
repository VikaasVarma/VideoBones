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
      }
    ]
  },
  resolve: {
    extensions: [ '.tsx', '.ts', '.js' ]
  },
}

module.exports = [
  Object.assign({}, common_config, {
    target: 'electron-main',
    entry: {
      main: './src/main/index.ts',
    },
    output: {
      filename: 'index.cjs',
      path: path.join(__dirname, 'dist/main')
    },
  }),
  Object.assign({}, common_config, {
    target: 'electron-renderer',
    entry: {
      renderer: './src/renderer/index.ts',
    },
    output: {
      filename: 'index.cjs',
      path: path.join(__dirname, 'dist/renderer'),
      asyncChunks: true
    },
  })
]