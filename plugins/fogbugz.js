var fogbugz = require('fogbugz'),
  format = require('util').format,
  speak = require('../lib/actions').speak;

module.exports = [
  {
    on: 'TextMessage',
    handle: function (data) {
      fogbugz.logon()
        .then(function () {
          var match;
          //todo handle this elsewhere
          if (data.user_id !== 1367582) {
            if (match = data.body.match(new RegExp("\\b(\\d{4,5})\\b"))) {
              var bugId = match[1];
              fogbugz.getBug(bugId)
                .then(function (bug) {
                  var msg = {
                    type: 'TextMessage',
                    body: format('#%s: %s [%s] *%s* ',
                      bug.id, bug.title, bug.url, bug.status.toUpperCase())
                  };
                  if (bug.assignedTo !== 'CLOSED') {
                    msg.body +=
                    format(' Assigned to: [%s]', bug.assignedTo);
                  }
                  msg.body += format(' Fix for [%s]', bug.fixFor);
                  if (bug.tags) {
                    msg.body += format(' Tags: %s', bug.tags);
                  }
                  speak(msg, data.room_id);
                }, function () {
                  console.warn('could not find bug with id ' + bugId);
                });
            }

          }
        });
    }
  }
];
