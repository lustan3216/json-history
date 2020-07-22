const path = require('path');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: {
    app: './src/index.js',
  },
  plugins: [
    // new CleanWebpackPlugin(['dist/*']) for < v2 versions of CleanWebpackPlugin
    new CleanWebpackPlugin()
  ],
  output: {
    filename: 'json-history.min.js',
    path: path.resolve(__dirname, 'dist'),
  },
};
