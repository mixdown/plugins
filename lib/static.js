var _ = require('lodash');
var fs = require('fs');
var mime = require('mime');
var crypto = require('crypto');

var Static = function() {};

Static.prototype.attach = function(options) {
  _.defaults(options, {
    headers: {},
    etag: true
  });

  var app = options.app;
  var global = options.headers;
  var etag = options.etag;
  var that = this;

  /**
   * @param options.path - the path to the file
   * @param options.res - response object for streaming
   * @param options.headers - hash containing key/val pairs for headers
   **/
  this.static = {
    file: function(opt, callback) {
      opt = opt || {};

      if (!opt.path) {
        callback(new Error("options.path required"));
        return;
      }
      if (!opt.res) {
        callback(new Error("options.res required"));
        return;
      }

      fs.readFile(opt.path, function(err, content) {
        if (err) {
          callback(err);
          return;
        }

        that.static.stream(_.extend(opt, { content: content }), callback);        
      });

    },

    stream: function(opt, callback) {
      var res = opt.res;
      var path = opt.path;
      var optHeaders = opt.headers;
      var content = opt.content;
      var headers = _.clone(global);

      if (!path) {
        callback(new Error("options.path required"));
        return;
      }
      if (!res) {
        callback(new Error("options.res required"));
        return;
      }

      _.extend(headers, optHeaders);
      _.extend(headers, {'Content-Type': mime.lookup(path)});

      if (etag) {
        var hashProvider = crypto.createHash('md5');
        headers.ETag = hashProvider.update(content).digest('hex');
      }

      res.on('close', callback).on('error', callback);
      res.writeHead(200, headers);
      res.end(content);
    }
  };
};

module.exports = Static;