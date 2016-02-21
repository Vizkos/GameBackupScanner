var fs = require('fs');

var gameInfo = [];

var BACKUPS_PATH = require('../data/backups-path');


/**
 * Pads numbers to have two digits
 * @param number
 * @returns {*}
 */
function padNumber(number) {
    return (number >= 10 ? number : "0" + number);
}

//read all information about folders
function gameInstallerScan(savePath) {
    var gameDirsProcessed = 0;
    for (var i = 0; i < gameInfo.length; i++) {
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
                if (gameDirsProcessed === gameInfo.length) {
                    finish(savePath);
                }
            });
        })(i);
    }
}

/**
 * Save JSON after scanning all game dirs
 */
function finish(savePath) {
    for (var i = 0; i < gameInfo.length; i++) {
        delete gameInfo[i].path;
    }

    console.log(gameInfo);

    fs.writeFile(savePath + "/backedUpGames.json", JSON.stringify(gameInfo, null, 2), (err) => {
        if (err) {
            throw err;
        }

        console.log("Writing game JSON!");
    });
}

module.exports = {
    scanGameDir: function(savePath) {
        fs.readdir(BACKUPS_PATH, (err, gameList) => {
            var gamesProcessed = 0;
            for (var i = 0; i < gameList.length; i++) {
                (function(j) {
                    var game = gameList[j];
                    var installerPath = `${BACKUPS_PATH}/${game}/Installer`;
                    fs.readdir(installerPath, (err, gameFolder) => {
                        if (!err && game.indexOf("Z - Template") === -1) {
                            gameInfo.push({
                                "name": game,
                                "date": null,
                                "notes": null,
                                "path": installerPath
                            });
                        }
                        gamesProcessed++;

                        if (gamesProcessed === gameList.length - 1) {
                            gameInstallerScan(savePath);
                        }
                    });
                })(i);
            }
        });
    }
};