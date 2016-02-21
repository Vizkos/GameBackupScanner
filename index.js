var path = require('path');
var steamInfo = require('./src/steamInfo');
var gameDirScan = require('./src/gameDirScan');

var dataPath = path.resolve("./data");

steamInfo.getGameInfo(dataPath, function(ownedGames) {
    gameDirScan.scanGameDir(dataPath, ownedGames);
});