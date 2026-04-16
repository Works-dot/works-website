export default (config) => {
  config.server = config.server || {};
  config.server.allowedHosts = true;
  config.server.hmr = false;
  config.server.watch = null;
  return config;
};
