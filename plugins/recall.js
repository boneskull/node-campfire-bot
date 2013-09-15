var redis = require('redis'),
  client = redis.createClient(),
  format = require('util').format,
  speak = require('../lib/actions').speak;

var HASH = 'node-campfire-recall';

module.exports = [
  {
    on: 'TextMessage',
    handle: function (data) {
      var match;
      if (match = data.body.match(new RegExp("^\\!(.+?)(?:\\s+(.+?))?$"))) {
        if (match[1] && match[2]) {
          client.hset(HASH, match[1], match[2], function (err) {
            if (!err) {
              speak({
                type: 'TextMessage',
                body: format('recalling "%s"', match[1])
              }, data.room_id);
            } else {
              console.error(err);
            }
          })
        } else if (match[1]) {
          client.hget(HASH, match[1], function (err, res) {
            if (err) {
              console.error(err);
            }
            else {
              speak({
                type: 'TextMessage',
                body: res
              }, data.room_id);
            }
          });
        }
      }
    }
  },
  {
    on: 'TextMessage',
    handle: function(data) {
      var match;
      if (match = data.body.match(new RegExp("^\\-(.+?)$"))) {
        if(match[1]) {
          client.hdel(HASH, match[1], function(err) {
            if(err) {
             console.error(err);
            } else {
              speak({
                type: 'TextMessage',
                body: format('forgetting "%s"', match[1])
              }, data.room_id);
            }
          })
        }
      }
    }
  }
];
