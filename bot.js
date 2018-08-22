var Discord = require('discord.io');
var auth = require('./auth.json');
var Logger = require('bunyan');
var log = new Logger({name: "colosson"});

var bot = new Discord.Client({
    token: auth.token,
    autorun: true
})

var numberWords = [
    "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "twenty", "thirty", "forty", "fifty", "hundred", "thousand", "million", "billion", "trillion", "kajillion", "bazillion", "threve"
];

var wordRegex = new RegExp(numberWords.join("|"));
var numberRegex = new RegExp(/\S*\d+\S*/);

var preBoards = {};
var boards = {};
var history = {};

bot.on('ready', function (evt) {
    log.info("Connected to Discord as " + bot.username + " (" + bot.id + ")");        
});

bot.on('message', function (user, userId, channelId, message, evt) {
    if (userId == bot.id)
        return;                
                
    if (boards[channelId] == undefined) {
        log.debug(message);
        if (history[channelId] == undefined)
            history[channelId] = "";
        history[channelId] += " " + message;
        
        if (getRandom(0, 3) == 1) {
            if (preBoards[channelId] == undefined) {            
                preBoards[channelId] = { user: userId, message: message };            
                log.info("Waiting for another one...");
            } else if (userId != preBoards[channelId].user) {
                log.info("Starting the game...");
                var word = randomWord(message + " " + preBoards[channelId].message);
                var word2 = randomWord(message + " " + preBoards[channelId].message);
                var loc = randomWord(history[channelId]);
                var loc2 = randomWord(history[channelId]);
                
                msg = "It's time for NumberWang!\n";
                msg += makeIntro(preBoards[channelId].user, loc, null, word, null) + ".\n";
                msg += makeIntro(userId, loc, loc2, word, word2)
                bot.sendMessage({
                    to: channelId,
                    message: msg
                });
    
                boards[channelId] = { odds: { numberWang: getRandom(5, 25), board: getRandom(1, 5) } };                  
            }    
        }
    } else {
        var words = message.split(' ');    
        for (var i = 0; i < words.length; i++) {
            var word = words[i];
            if (wordRegex.test(word) || numberRegex.test(word)) {
                if (boards[channelId] == undefined) {
                } else if (checkNumberWang(word, channelId)) {
                    return;
                }                        
            }    
        }    
    }    
});

function getRandom(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

function randomWord(msg) {
    var words = msg.split(' ');
    return words[getRandom(0, words.length - 1)];
}

function makeIntro(userId, loc, loc2, word, word2) {    
    var msg = "<@" + userId + "> is "
    if (loc2 == null)
        msg += "from " + loc;
    else {
        var rnd = getRandom(1, 3);
        if (rnd == 1)
            msg += "also from " + loc;        
        else
            msg += "from " + loc2;
    }

    if (word2 != null) {
        var rnd = getRandom(1, 4);
        if (rnd == 1)
            word = word2;
    }

    var intro = getRandom(1, 5);
    switch (intro) {
        case 1:        
            msg += " and loves " + word;
        break;
        case 2:
            msg += " and hates " + word;
        break;
        case 3:
            msg += " and likes " + word;
        break;
        case 4:
            msg += " and enjoys " + word;
        break;
        case 5:
            msg += " and loathes " + word;
        break;
    }
    
    return msg;
}

function checkNumberWang(number, channelId) {    
    var board = boards[channelId];    
    var random = getRandom(1, board.odds.numberWang)    
    if (random == 1) {     
        var message = "" + number + "! That's NumberWang!"; 
        var random = getRandom(1, board.odds.board);
        if (random == 1) {
            message += "\nLet's rotate the board!";
            boards[channelId].odds.numberWang = getRandom(5, 25);
            boards[channelId].odds.board = getRandom(1, 5);            
        }

        bot.sendMessage({
            to: channelId,
            message: message
        })        

        return true;
    }

    return false;
}