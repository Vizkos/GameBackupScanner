var fs = require('fs');

var gameInfo = {};

var BACKUPS_PATH = require('../data/backups-path');


/**
 * Pads numbers to have two digits
 * @param number
 * @returns {*}
 */
function padNumber(number) {
    return (number >= 10 ? number : "0" + number);
}

Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

//read all information about folders
function gameInstallerScan(savePath, ownedGames) {
    var gameDirsProcessed = 0;

    var gameInfoLength = Object.size(gameInfo);

    console.log("fetching backup game dir stats...");
    for (var i in gameInfo) {
        if (gameInfo.hasOwnProperty(i)) {
            (function (i) {
                var game = gameInfo[i];
                fs.stat(`${game.path}/${game.name}`, (err, stats) => {
                    if (!err) {
                        game.date = padNumber(stats.mtime.getMonth() + 1) + "/" + padNumber(stats.mtime.getDate()) + "/" + stats.mtime.getFullYear();
                        game.status = true;
                    }
                    else {
                        game.status = false;
                    }
                    gameDirsProcessed++;

                    //processed all dirs?
                    if (gameDirsProcessed === gameInfoLength) {
                        finish(savePath, ownedGames);
                    }
                });
            })(i);
        }
    }
}

/**
 * Save JSON after scanning all game dirs
 */
function finish(savePath, ownedGames) {
    var i;
    for (i = 0; i < gameInfo.length; i++) {
        delete gameInfo[i].path;
    }

    //add games pulled from steam that have not been found to the object
    for (i in ownedGames) {
        if (ownedGames.hasOwnProperty(i)) {
            var game = ownedGames[i].replace(/[|&;:\\/$%@"<>()+,]/g, "");
            if (!gameInfo[game.toLowerCase()]) {
                gameInfo[game.toLowerCase()] = {
                    "name": game,
                    "date": null,
                    "notes": null
                };
            }
        }
    }

    fs.writeFile(savePath + "/backedUpGames.json", JSON.stringify(gameInfo, null, 2), (err) => {
        if (err) {
            throw err;
        }

        console.log("Wrote game JSON!");
    });
}

module.exports = {
    scanGameDir: function(savePath, ownedGames) {
        console.log("fetching backup game dirs...");
        fs.readdir(BACKUPS_PATH, (err, gameList) => {
            var gamesProcessed = 0;
            for (var i = 0; i < gameList.length; i++) {
                (function(j) {
                    var game = gameList[j];
                    var installerPath = `${BACKUPS_PATH}/${game}/Installer`;
                    fs.readdir(installerPath, (err, gameFolder) => {
                        if (!err && game.indexOf("Z - Template") === -1) {
                            gameInfo[game.toLowerCase()] = {
                                "name": game,
                                "date": null,
                                "notes": null,
                                "path": installerPath
                            };
                        }
                        gamesProcessed++;

                        if (gamesProcessed === gameList.length - 1) {
                            gameInstallerScan(savePath, ownedGames);
                        }
                    });
                })(i);
            }
        });
    }
};