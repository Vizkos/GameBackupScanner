var http = require('http');
var fs = require('fs');
var path = require('path');

var STEAM_KEY = require('./../data/steam-api-key');
var USER = require('./../data/steam-user');

function getOwnedGames(steamid, savePath, callback) {
    console.log("fetching owned games...");
    http.get(`http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${STEAM_KEY}&include_played_free_games=1&include_appinfo=1&steamid=${steamid}&format=json`, (response) => {
        var responseStr = "";
        response.on('data', function(chunk) {
            responseStr += chunk;
        });

        response.on('end', function() {
            parseGameInfo(JSON.parse(responseStr).response.games, savePath, callback);
        });
    }).on('error', (e) => {
        console.log(`Got error: ${e.message}`);
    });
}

function parseGameInfo(games, savePath, callback) {
    var ownedGames = {};

    games.forEach(function(curr) {
        ownedGames[curr.appid] = curr.name;
    });

    fs.writeFileSync(savePath + "/ownedGames.json", JSON.stringify(ownedGames, null, 2), 'utf8');
    callback(ownedGames);
}

module.exports = {
    getGameInfo: function(savePath, callback) {
        console.log("fetching steam id from vanity url...");
        http.get(`http://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key=${STEAM_KEY}&vanityurl=${USER}`, (response) => {
            var responseStr = "";
            response.on('data', function(chunk) {
                responseStr += chunk;
            });

            response.on('end', function() {
                var steamid = JSON.parse(responseStr).response.steamid;
                getOwnedGames(steamid, savePath, callback);
            });
        }).on('error', (e) => {
            console.log(`Got error: ${e.message}`);
        });
    }
};

