/**
 * @title node-campfire-bot
 * @overview Campfire bot written in Node.

 Supports plugins and a host of actions.
 */

/**
 * `bot` module joins configured rooms and executes any plugin initialization
 routines.  Exports nothing.
 * @module bot
 */

var joinRooms = require('./actions').joinRooms,
  campfire = require('./campfire'),
  conf = require('../campfire.conf.json');

// TODO get user
joinRooms(conf.rooms).then(function (rooms) {
  campfire.run(rooms);
});

