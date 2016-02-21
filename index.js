var path = require('path');
var steamInfo = require('./src/steamInfo');
var gameDirScan = require('./src/gameDirScan');

var dataPath = path.resolve("./data");

//TODO: promises to clean up param pyramid
steamInfo.getGameInfo(dataPath, function(ownedGames) {
    gameDirScan.scanGameDir(dataPath, ownedGames);
});