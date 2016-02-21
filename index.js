var path = require('path');
var steamInfo = require('./src/steamInfo');

steamInfo.getGameInfo(path.resolve("./data"), function() {
    console.log("done");
});