var Q = require('q'),
  request = require('request'),
  JSONStream = require('JSONStream'),
  plugins = require('../plugins'),
  format = require('util').format,
  conf = require('../campfire.conf.json');

module.exports = {
  send: function send(endpoint, payload) {
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
  },
  stream: function campfireStream(endpoint, debug) {
    var protocol = conf.useSSL ? 'https' : 'http',
      dfrd = Q.defer();
    if (debug) {
      console.log('making streaming DEBUG req (does not actually stream): ' +
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
      stream.on('data', plugins.handle);

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
};
