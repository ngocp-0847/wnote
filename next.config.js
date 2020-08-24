const withSass = require('@zeit/next-sass');
const withCSS = require('@zeit/next-css');
// const webpack = require('webpack');
// const path = require('path');
// const withPlugins = require('next-compose-plugins');

module.exports = withCSS(withSass({
  /* config options here */
  webpack: (config, { isServer }) => {
    // Fixes npm packages that depend on `fs` module
    if (!isServer) {
      config.node = {
        fs: 'empty'
      }

      // config.plugins.push(new webpack.ProvidePlugin({
      //   "window.hljs": "highlight.js",
      //   "window.katex": "katex"
      // }));
    }

    return config
  }
}))
