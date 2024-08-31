module.exports = function override(def_config, env) {
    return {
      ...def_config,
      webpack: (config) => {
        config.resolve = {
          ...config.resolve,
          fallback: {
            "fs": false,
            "path": false,
          }
        }
        return config
      },
    }
  }