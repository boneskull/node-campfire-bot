var campfire = require('./campfire'),
  send = campfire.send,
  stream = campfire.stream,
  format = require('util').format,
  Q = require('q'),

  savedRooms = [],
  joinedRooms = [],

  getRooms = function getRooms() {
    return send('rooms').then(function (res) {
      return res.rooms;
    });
  },

  findRoom = function findRoom(name) {
    var room;

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

    if (savedRooms.length) {
      room = lookIn(savedRooms);
      return send(format('room/%d/join', room.id)
        .then(function () {
          return stream(format('room/%d/live', room.id));
        }))
    }

    return getRooms()
      .then(function (rooms) {
        savedRooms = rooms;
        return lookIn(savedRooms);
      })
      .then(function (room) {
        return send(format('room/%d/join', room.id))
          .then(function () {
            joinedRooms.push(room);
            return room;
          });
      })
      .then(function (room) {
        return stream(format('room/%d/live', room.id));
      }, function (err) {
        console.error(err);
      });
  };


module.exports = {
  speak: function speak(msg, roomId) {
    console.log(msg);
    send(format('room/%d/speak', roomId), {message: msg});
  },

  getRooms: getRooms,

  findRoom: findRoom,

  joinRooms: function joinRooms(name) {
    var i, dfrd = Q.defer(), promises = [];

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
};
