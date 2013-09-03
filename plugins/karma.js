var redis = require('redis'),
  client = redis.createClient(),
  format = require('util').format,
  speak = require('../lib/actions').speak;

module.exports = [
  {
    on: 'TextMessage',
    handle: function (data) {
      var match, thing;
      if (match = data.body.match(new RegExp("^(.+?)\\+\\+$"))) {
        thing = match[1];
        client.get(thing, function (err, res) {
          var karma = res ? parseInt(res, 10) + 1 : 1;
          client.set(thing, karma);
          speak({
            type: 'TextMessage',
            body: format('%s has %d karma', thing, karma)
          }, data.room_id);
        });
      }
    }
  },
  {
    on: 'TextMessage',
    handle: function (data) {
      var match, thing;
      if (match = data.body.match(new RegExp("^(.+?)--$"))) {
        thing = match[1];
        client.get(thing, function (err, res) {
          var karma = res ? parseInt(res, 10) - 1 : -1;
          client.set(thing, karma);
          speak({
            type: 'TextMessage',
            body: format('%s has %d karma', thing, karma)
          }, data.room_id);
        });
      }
    }

  }
]
