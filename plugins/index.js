var conf = require('../campfire.conf.json'),

  plugins = [];

module.exports = {
  handle: function (data) {
    if (!plugins.length) {
      i = conf.plugins.length;
      while (i--) {
        plugins.push(require('./' + conf.plugins[i]));
        console.log('added plugin ' + conf.plugins[i]);
      }
    }

    var i = plugins.length, plugin, j, handler;
    while (i--) {
      plugin = plugins[i];
      j = plugin.length;
      while (j--) {
        handler = plugin[j];
        if (handler.on == data.type) {
          handler.handle(data);
        }
      }
    }
  }
}
