var kiln = require('kiln'),
  format = require('util').format,
  speak = require('../lib/actions').speak;

module.exports = [
  {
    run: function (rooms) {
      function onMeta(meta) {
        var i = rooms.length;
        while (i--) {
          speak({
            type: 'TextMessage',
            body: format('Connected to feed %s', meta['rss:title']['#'])
          }, rooms[i].id);
        }
      }

      function onData(data) {
        var i = rooms.length;
        while (i--) {
          if (data['rss:title']['#'].indexOf('Automated merge') === -1 &&
              data['rss:title']['#'].indexOf('resolved review') === -1) {
            speak({
              type: 'TextMessage',
              body: format('%s pushed changeset %s: %s',
                data['rss:author']['#'],
                data['rss:link']['#'], data['rss:title']['#'])
            }, rooms[i].id);
          } else if (data['rss:title']['#'].indexOf('resolved review') >= 0) {
            speak({
              type: 'TextMessage',
              body: format('%s: %s',
                data['rss:link']['#'], data['rss:title']['#'])
            }, rooms[i].id);
          }
        }
      }

      kiln.watchActivity(onData, onMeta);

    }
  }
];
