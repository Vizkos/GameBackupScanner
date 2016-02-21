var http = require('http');
var fs = require('fs');
var path = require('path');

var STEAM_KEY = require('./../data/steam-api-key');
var USER = require('./../data/steam-user');
var gameCache = require('./../data/gameCache.json');

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
    http.get(`http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${STEAM_KEY}&include_played_free_games=1&include_appinfo=1&steamid=${steamid}&format=json`, (response) => {
        var responseStr = "";
        response.on('data', function(chunk) {
            responseStr += chunk;
        });

        response.on('end', function() {
            parseGameInfo(JSON.parse(responseStr).response.games);
        });
    }).on('error', (e) => {
        console.log(`Got error: ${e.message}`);
    });
}


function parseGameInfo(games) {
    var ownedGames = {};

    games.forEach(function(curr) {
        ownedGames[curr.appid] = curr.name;
    });

    fs.writeFileSync(path.resolve('../data/ownedGames.json'), JSON.stringify(ownedGames, null, 2), 'utf8');
}