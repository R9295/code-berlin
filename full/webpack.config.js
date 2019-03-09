var webpack = require("webpack");
var path = require("path");

var BUILD_DIR = path.resolve(__dirname, "./static/build");
var APP_DIR = path.resolve(__dirname, "./src/");

const config = {
  entry: {
    main: APP_DIR + "/App.js",
  },
  output: {
    filename: "[name].js",
    path: BUILD_DIR
  },
  module: {
    rules: [
      {
        test: /\.(jsx|js)?$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "babel-loader"
          }
        ]
      }
    ]
  }
};

module.exports = config;
