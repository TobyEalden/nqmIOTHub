"use strict";

module.exports = (function() {
  var console = process.console ? process.console : global.console;
  var config = require("./config.js");

  var cacheLib = require("nqmFileCache");
  var cache = new cacheLib.FileCache(config.getLocal("cacheConfig",{}));

  var syncConfig = config.getLocal("syncConfig",{ syncType: "nqmHTTPSync" });
  var syncLib = require(syncConfig.syncType);
  var sync = new syncLib.Sync(syncConfig);
  sync.initialise(function(err, reconnect) {
    if (!err) {
      cache.setSyncHandler(sync);
    } else {
      console.log("failed to initialise sync: " + e.message);
    }
  });

  var handleDriverData = function(feedId, data) {
    var feedData = {
      feedId: feedId,
      payload: data
    };
    cache.cacheThis(feedData);
  };

  // For each driver in config.
  var driversConfig = config.getLocal("drivers",[]);
  for (var d in driversConfig) {
    var driverConfig = driversConfig[d];
    console.log("loading driver " + driverConfig.type);
    // Load driver module.
    var moduleName = "nqm" + driverConfig.type + "Driver";
    try {
      var driverLib = require(moduleName);

      // Init with config
      var driverObj = new driverLib.Driver(driverConfig);

      // Subscribe to "data" event
      driverObj.on("data", handleDriverData);
      driverObj.start();
    } catch (e) {
      console.log("failed to load driver '" + moduleName + "': " + e.message);
    }
  }

  return {};
}());
