var kiln = require('kiln'),
  format = require('util').format,
  speak = require('../lib/actions').speak,
  conf = require('../kiln-plugin.conf.json');

var queue = {}, t,
  report = function report() {
    var roomIds = Object.keys(queue),
      i = roomIds.length, roomId, bodies;
    while (i--) {
      roomId = roomIds[i];
      if (queue[roomId].length) {
        bodies = queue[roomId].join('\n');
        speak({
          type: 'PasteMessage',
          body: bodies
        }, roomId);
        queue[roomId] = [];
      }
    }
  };

module.exports = [
  {
    run: function (rooms) {
      function onMeta() {
        var i = rooms.length;
        while (i--) {
          queue[rooms[i].id] = [];
          t = setInterval(report, conf.reportInterval)
        }
      }

      function onData(data) {
        var i = rooms.length, roomId;
        while (i--) {
          roomId = rooms[i].id;
          if (data['rss:title']['#'].indexOf('Automated merge') === -1 &&
              data['rss:title']['#'].indexOf('resolved review') === -1) {
            queue[roomId].push(format('%s pushed changeset %s: %s',
              data['rss:author']['#'],
              data['rss:link']['#'], data['rss:title']['#']));
          } else if (data['rss:title']['#'].indexOf('resolved review') >= 0) {
            queue[roomId].push(format('%s: %s',
              data['rss:link']['#'], data['rss:title']['#']));
          }
        }
      }

      kiln.watchActivity(onData, onMeta);

    }
  }
];
