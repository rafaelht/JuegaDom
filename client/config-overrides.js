const webpack = require('webpack');

module.exports = function override(config, env) {
  // Add fallbacks for Node.js modules
  config.resolve.fallback = {
    ...config.resolve.fallback,
    "http": false,
    "https": false,
    "util": false,
    "zlib": false,
    "stream": false,
    "url": false,
    "crypto": false,
    "assert": false,
  };

  return config;
}; 