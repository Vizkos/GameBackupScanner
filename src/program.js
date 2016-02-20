var fs = require('fs');

var gameInfo = [];

var BACKUPS_PATH = require('../data/backups-path');

//start
startDirScanning();

/**
 * Pads numbers to have two digits
 * @param number
 * @returns {*}
 */
function padNumber(number) {
    return (number >= 10 ? number : "0" + number);
}

/**********************************************************************************************************************
 * Backup directory functions - extract game names
 **********************************************************************************************************************/

/**
 * Scan main backup locations to get sub-folder names
 * Once we have all the folder names, then call startGameDirScanning to get specific information about the folders
 */
function startDirScanning() {
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
                        startGameDirScanning();
                    }
                });
            })(i);
        }
    });
}

/**********************************************************************************************************************
 * Game directory functions - extract mod dates for game backup folders
**********************************************************************************************************************/

/**
 * Constructs an array of all the game folders, with their parent directory structure (DRIVE://path/gameBackup), so we
 * can scan them for their mod dates
 * @param dirResultsParam
 * @param parentDirectory
 */
function constructGamesDirArray(dirResultsParam, parentDirectory) {
    if (dirResultsParam.length <= 0 || !parentDirectory) {
        return;
    }

    for (var i = 0; i < dirResultsParam.length; i++) {
        gameInfo.push(parentDirectory + "/" + dirResultsParam[i]);
    }
}

/**
 * Save JSON after scanning all game dirs
 */
function finish() {
    for (var i = 0; i < gameInfo.length; i++) {
        delete gameInfo[i].path;
    }

    console.log(gameInfo);

    fs.writeFile('games.json', JSON.stringify(gameInfo), (err) => {
        if (err) {
            throw err;
        }

        console.log("Writing game JSON!");
    });
}

var gameDirsProcessed = 0;

//read all information about folders
function startGameDirScanning() {
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
                    finish();
                }
            });
        })(i);
    }
}