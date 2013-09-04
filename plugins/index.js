var conf = require('../campfire.conf.json'),

  plugins = [];

var registerPlugins = function registerPlugins() {
  var i = conf.plugins.length;
  while (i--) {
    plugins.push(require('./' + conf.plugins[i]));
    console.log('added plugin ' + conf.plugins[i]);
  }
};

module.exports = {
  handle: function (data) {
    var i = plugins.length, plugin, j, handler;

    if (!i) {
      registerPlugins();
      i = plugins.length;
    }

    while (i--) {
      plugin = plugins[i];
      j = plugin.length;
      while (j--) {
        handler = plugin[j];
        if (data && handler.on == data.type) {
          handler.handle(data);
        }
      }
    }
  },
  init: function (rooms) {
    var i = plugins.length, plugin, j, handler;
    if (!i) {
      registerPlugins();
      i = plugins.length;
    }
    while (i--) {
      plugin = plugins[i];
      j = plugin.length;
      while (j--) {
        handler = plugin[j];
        if (handler.run) {
          handler.run(rooms);
        }
      }
    }
  }
};
