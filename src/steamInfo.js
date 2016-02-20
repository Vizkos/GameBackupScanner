var http = require('http');
var https = require('https');

var STEAM_KEY = require('./../data/steam-api-key');
var USER = require('./../data/steam-user');

http.get(`http://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key=${STEAM_KEY}&vanityurl=${USER}`, (response) => {
    var responseStr = "";
    response.on('data', function(chunk) {
        responseStr += chunk;
    });

    response.on('end', function() {
        var steamid = JSON.parse(responseStr).response.steamid;
        getOwnedGames(steamid);
    });
}).on('error', (e) => {
    console.log(`Got error: ${e.message}`);
});

function getOwnedGames(steamid) {
    http.get(`http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${STEAM_KEY}&steamid=${steamid}&format=json`, (response) => {
        var responseStr = "";
        response.on('data', function(chunk) {
            responseStr += chunk;
        });

        response.on('end', function() {
            getGameNames(JSON.parse(responseStr).response.games);
        });
    }).on('error', (e) => {
        console.log(`Got error: ${e.message}`);
    });
}

var ownedGames = [];

function getGameNames(games) {
    var i = -1;

    var checkInterval = function() {
        clearInterval(interval);
        console.log(ownedGames);
    };

    //steam store limits to 200 requests every 5 minutes...-_-
    var interval = setInterval(() => {
        i++;
        if (games[i]) {
            getGameInfo(games[i], i);
        }
        else {
            checkInterval();
        }
    }, 1500);
}

//some of the app ids are duplicates.  Check to ensure none already exist before pushing
function checkAndPush(gameName) {
    for (var i = 0; i < ownedGames.length; i++) {
        if (ownedGames[i] === gameName) {
            return;
        }
    }

    ownedGames.push(gameName);
}

function getGameInfo(game, gameNo) {
    //steam api returns empty objects for many app ids -_-
    //http.get(`http://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/?key=${STEAM_KEY}&appid=${game.appid}`, (response) => {
    http.get(`http://store.steampowered.com/api/appdetails/?appids=${game.appid}`, (response) => {
        response.setEncoding('utf8');
        var responseStr = "";
        response.on('data', function(chunk) {
            responseStr += chunk;
        });

        response.on('end', function() {
            console.log(game.appid);
            var responseJson = JSON.parse(responseStr);
            var gameData = responseJson['' + game.appid];
            if (gameData.data && gameData.data.name) {
                var gameName = gameData.data.name;
                checkAndPush(gameName);
            }
        });
    }).on('error', (e) => {
        console.log(`Got error: ${e.message}`);
    });
}