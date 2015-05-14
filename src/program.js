var fs = require('fs');

//main backup locations
var dirs = [];
for (var i = 2; i< process.argv.length; i++) {
    dirs.push(process.argv[i]);
}

//list of folders for every group directory arg
var dirResults = new Array(dirs.length);
for (var j = 0; j < dirResults.length; j++) {
    dirResults[j] = null;
}

//depending on where backup is located, instructions on how to use backup
var notesObject = {};
//json object that will eventually be output into a file
var jsonObject = [];
//full path locations to every game backup folder
var gameDirs = [];

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
 * Translates the array of game folders, divided by directory (length = total directories scanned), into a an array
 * of JSON objects
 * @param dirResultsParam array of game folder names
 */
function constructDirResultsJson2(dirResultsParam) {
    var singleJsonObject = {};
    for (var i = 0; i < dirResultsParam.length; i++) {
        var dirResult = dirResultsParam[i];
        for (var j = 0; j < dirResult.length; j++) {
            singleJsonObject = {};
            singleJsonObject.name = dirResult[j];
            singleJsonObject.status = true;
            singleJsonObject.date = "";
            singleJsonObject.notes = notesObject[dirResult[j]];
            jsonObject.push(singleJsonObject);
        }
    }
}

/**
 * Scan main backup locations to get sub-folder names
 * Once we have all the folder names, then call startGameDirScanning to get specific information about the folders
 */
function startDirScanning() {
    for (var i = 0; i < dirs.length; i++) {
        (function (i) {
            fs.readdir(dirs[i], function (err, list) {
                console.log("Scanning directory: " + dirs[i]);

                var k;
                //steam game
                if (dirs[i].indexOf("Steam") !== -1) {
                    for (k = 0; k < list.length; k++) {
                        notesObject[list[k]] = "Steam Game";
                    }
                }
                //origin game
                else if (dirs[i].indexOf("Origin") !== -1) {
                    //remove useless cache entry that Origin puts in the directory
                    var cacheIndex = 0;
                    for (k = 0; k < list.length; k++) {
                        if (list[i] === "cache") {
                            cacheIndex = k - 1;
                        }
                    }
                    list.splice(cacheIndex, 1);

                    for (k = 0; k < list.length; k++) {
                        notesObject[list[k]] = "Start Origin install, then copy files in";
                    }

                }
                //ubisoft game
                else if (dirs[i].indexOf("UPlay") !== -1) {
                    for (k = 0; k < list.length; k++) {
                        notesObject[list[k]] = "Start UPlay install, then copy files in";
                    }
                }
                //blizard game
                else if (dirs[i].indexOf("Battle.net") !== -1) {
                    for (k = 0; k < list.length; k++) {
                        notesObject[list[k]] = "Copy to disc and link in Battle.net client";
                    }
                }
                //other game
                else if (dirs[i].indexOf("Other") !== -1) {
                    for (k = 0; k < list.length; k++) {
                        notesObject[list[k]] = "Other Game";
                    }
                }

                //debug log
                var listFoundString = "";
                for (k = 0; k < list.length; k++) {
                    if (k === list.length - 1) {
                        listFoundString += list[k];
                    }
                    else {
                        listFoundString += list[k] + ", ";
                    }
                }
                console.log("Game backups found: " + listFoundString);

                dirResults[i] = list;
                //construct/append to an array with full paths to all of the folders
                constructGamesDirArray(list, dirs[i]);

                var resultCount = 0;
                for (var j = 0; j < dirResults.length; j++) {
                    if (dirResults[j] !== null) {
                        resultCount++;
                    }
                }

                if (resultCount == dirResults.length) {
                    constructDirResultsJson2(dirResults);
                    startGameDirScanning();
                }
            });
        })(i);
    }
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
        gameDirs.push(parentDirectory + "/" + dirResultsParam[i]);
    }
}

/**
 * Set the modified date of a game's JSON entry to that which we obtained using fs.stat
 * @param gameDir full directory to a game backup folder
 * @param modDate modified date in String form
 */
function setModDate(gameDir, modDate) {
    var gameName = null;

    //extract game name from the directory
    for(var i = 2; i < process.argv.length; i++) {
        if (gameDir.indexOf(process.argv[i]) !== -1) {
            gameName = gameDir.substr(process.argv[i].length + 1, gameDir.length);
            break;
        }
    }


    //did it find a game and parse correctly?
    if (gameName) {
        //loop through json object, match game name, and set mod date of the folder, representing backup date
        for (var j = 0; j < jsonObject.length; j++) {
            if (gameName === jsonObject[j].name) {
                jsonObject[j].date = modDate;
            }
        }
    }
}

/**
 * Save JSON after scanning all game dirs
 */
function finish() {
    fs.writeFile('games.json', JSON.stringify(jsonObject), function(err) {
        if (err) {
            throw err;
        }

        console.log("Writing game JSON!");
    });
}

var gameDirsProcessed = 0;

//read all information about folders
function startGameDirScanning() {
    for (var i = 0; i < gameDirs.length; i++) {
        (function (i) {
            fs.stat(gameDirs[i], function (err, stats) {
                var modDate = padNumber(stats.mtime.getMonth() + 1) + "/" + padNumber(stats.mtime.getDate()) + "/" + stats.mtime.getFullYear();
                setModDate(gameDirs[i], modDate);
                gameDirsProcessed++;

                //processed all dirs?
                if (gameDirsProcessed === gameDirs.length) {
                    finish();
                }
            });
        })(i);
    }
}