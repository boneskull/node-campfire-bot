var request = require('request'),
  format = require('util').format,
  Q = require('q'),
  JSONStream = require('JSONStream'),
  es = require('event-stream'),
  fogbugz = require('fogbugz'),
  redis = require('redis'),
  conf = require('../campfire.conf.json');

var savedRooms, client = redis.createClient();

function campfire(endpoint, payload) {
  var protocol = conf.useSSL ? 'https' : 'http',
    dfrd = Q.defer();
  console.log('making req: ' +
              format('%s://%s.campfirenow.com/%s.json', protocol, conf.site,
                endpoint));
  if (payload) {
    console.log('w/ payload:');
    console.log(payload);
  }
  var options = {
    url: format('%s://%s.campfirenow.com/%s.json', protocol, conf.site,
      endpoint),
    auth: {
      user: conf.apiKey,
      pass: 'X'
    },
    method: 'POST',
    headers: {
      'User-Agent': 'node-campfire-bot (chiller@badwing.com)'
    }
  };
  if (payload) {
    options.json = payload
  }
  request(options, function (err, res, body) {
    if (err) {
      console.error(err);
      return dfrd.reject(err);
    }
    console.log(body);
    try {
      if (typeof body === 'string') {
        body = JSON.parse(body);
      }
      dfrd.resolve(body);
    } catch (e) {
      dfrd.resolve();
    }
  });
  return dfrd.promise;
}

function handleData(data) {
  var match;
  if (data.type === 'TextMessage' && data.user_id !== 1367582) {
    console.log(data);
    if (match = data.body.match(new RegExp("\\b(\\d{4,5})\\b"))) {
      var bugId = match[1];
      fogbugz.getBug(bugId)
        .then(function (bug) {
          console.log(bug);
          campfire(format('room/%d/speak', data.room_id),
            {
              message: {
                type: 'PasteMessage',
                body: format('#%d: %s\n%s\nAssigned to: %s; Fix for %s\nTags: %s',
                  bug.id, bug.title, bug.url, bug.assignedTo, bug.fixFor,
                  bug.tags)
              }
            });
        }, function () {
          console.warn('could not find bug with id ' + bugId);
        });
    }
    if (match = data.body.match(new RegExp("^(.+?)\\+\\+$"))) {
      var thing = match[1];
      client.get(thing, function (err, res) {
        var karma = res ? parseInt(res, 10) + 1 : 1;
        client.set(thing, karma);
        campfire(format('room/%d/speak', data.room_id), {
          message: {
            type: 'TextMessage',
            body: format('%s has %d karma', thing, karma)
          }
        });
      });
    }
    if (match = data.body.match(new RegExp("^(.+?)--$"))) {
      var thing = match[1];
      client.get(thing, function (err, res) {
        var karma = res ? parseInt(res, 10) - 1 : -1;
        client.set(thing, karma);
        campfire(format('room/%d/speak', data.room_id), {
          message: {
            type: 'TextMessage',
            body: format('%s has %d karma', thing, karma)
          }
        });
      });
    }
  }
}

function campfireStream(endpoint, debug) {
  var protocol = conf.useSSL ? 'https' : 'http',
    dfrd = Q.defer();
  if (debug) {
    console.log('making streaming DEBUG req: ' +
                format('%s://streaming.campfirenow.com/%s.json', protocol,
                  endpoint));

    request({
      url: format('%s://streaming.campfirenow.com/%s.json', protocol,
        endpoint),
      auth: {
        user: conf.apiKey,
        pass: 'X'
      },
      headers: {
        'User-Agent': 'node-campfire-bot (chiller@badwing.com)'
      }
    }, function (err, res, body) {
      dfrd.resolve(arguments);
    });
  }
  else {
    console.log('making streaming req: ' +
                format('%s://streaming.campfirenow.com/%s.json', protocol,
                  endpoint));

    var stream = JSONStream.parse(/type|body/);
    stream.on('data', handleData);

    request({
      url: format('%s://streaming.campfirenow.com/%s.json', protocol,
        endpoint),
      auth: {
        user: conf.apiKey,
        pass: 'X'
      },
      headers: {
        'User-Agent': 'node-campfire-bot (chiller@badwing.com)'
      }
    })
      .pipe(stream);

  }

  return dfrd.promise;
}

function getRooms() {
  return campfire('rooms').then(function (res) {
    return res.rooms;
  });
}


function joinRooms(name) {
  var room, i, dfrd = Q.defer(), promises = [];

  function findRoom(name) {

    function lookIn(rooms) {
      var i = rooms.length, foundRoom;
      while (i--) {
        if (rooms[i].name == name) {
          foundRoom = rooms[i];
          break;
        }
      }
      return foundRoom;
    }

    if (savedRooms) {
      room = lookIn(savedRooms);
      return campfire(format('room/%d/join', room.id)
        .then(function () {
          return campfireStream(format('room/%d/live', room.id));
        }))
    }

    return getRooms()
      .then(function (rooms) {
        savedRooms = rooms;
        return lookIn(savedRooms);
      })
      .then(function (room) {
        return campfire(format('room/%d/join', room.id))
          .then(function () {
            return room;
          });
      })
      .then(function (room) {
        return campfireStream(format('room/%d/live', room.id));
      }, function (err) {
        console.error(err);
      });
  }

  if (typeof name === 'string') {
    return findRoom(name);
  } else if (Array.isArray(name)) {
    i = name.length;
    while (i--) {
      promises.push(findRoom(name));
    }
    Q.all(promises).then(function (res) {
      dfrd.resolve(res);
    });
  }
  return dfrd.promise;
}

fogbugz.logon()
  .then(function () {
    return joinRooms(conf.rooms);
  })
  .then(function (res) {
    console.log(res);
  });

