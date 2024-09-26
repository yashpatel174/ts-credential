module.exports = function override(config, env) {
  config.devServer.setupMiddlewares = (middlewares, devServer) => {
    return middlewares;
  };
  return config;
};
