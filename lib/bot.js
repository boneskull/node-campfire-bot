var joinRooms = require('./actions').joinRooms,
  conf = require('../campfire.conf.json');

// TODO get user
joinRooms(conf.rooms);

