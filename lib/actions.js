/**
 * @module actions
 */

var campfire = require('./campfire'),
  send = campfire.send,
  stream = campfire.stream,
  format = require('util').format,
  _ = require('lodash'),
  Q = require('q');

var savedRooms = [];

var getRooms = function getRooms() {
  return send('rooms')
    .then(function (res) {
      return res.rooms;
    });
};

var findRoom = function findRoom(name) {
  var room;

  if (savedRooms.length) {
    room = _.findWhere(savedRooms, {
      name: name
    });
    return send(format('room/%d/join', room.id)
      .then(function () {
        return stream(format('room/%d/live', room.id));
      }))
  }

  return getRooms()
    .then(function (rooms) {
      savedRooms = rooms;
      room = _.findWhere(savedRooms, {
        name: name
      });
    })
    .then(function () {
      return send(format('room/%d/join', room.id));
    })
    .then(function () {
      return stream(format('room/%d/live', room.id));
    });
};

var joinRooms = function joinRooms(name) {
  var i, dfrd = Q.defer(), promises = [];

  if (typeof name === 'string') {
    return findRoom(name);
  } else if (Array.isArray(name)) {
    i = name.length;
    while (i--) {
      promises.push(findRoom(name[i]));
    }
    Q.all(promises).then(function (res) {
      dfrd.resolve(res);
    });
  }
  return dfrd.promise;
};

/**
 * Sends a message to a joined room.
 * @method speak
 * @param {Object} msg FogBugz message object
 * @param {number} roomId Room ID to send message to
 * @returns {Q.promise}
 */
var speak = function speak(msg, roomId) {
  return send(format('room/%d/speak', roomId), {
    message: msg
  });
};

module.exports = {
  speak: speak,
  getRooms: getRooms,
  findRoom: findRoom,
  joinRooms: joinRooms
};
