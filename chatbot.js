var redis = require('redis');
var Web3 = require("web3");
var theDAOInterface = require('./thedao.js');
var firebase = require('firebase');
var splunk = require('splunk-sdk');
var etherScan = require('./etherscan-websocket.js');
var service = new splunk.Service({username:"admin", password:"", host:""})
service.login(function(err, success) {
    if(err)
        process.exit(1)
});

var web3 = new Web3();
web3.setProvider(new web3.providers.HttpProvider());
var theDAO = web3.eth.contract(theDAOInterface).at('0xbb9bc244d798123fde783fcc1c72d3bb8c189413');


var DIRECT = ['direct_message','direct_mention','mention'];
var RAW_LISTENERS = [];
var VOTE_LISTENERS = [];
var TX_LISTENERS = [];
var Botkit = require('botkit');
var statsbot;

var controller = Botkit.slackbot({
  debug: false
  //include "log: false" to disable logging
  //or a "logLevel" integer from 0 to 7 to adjust logging verbosity
});

// connect the bot to a stream of messages
controller.spawn({
  token: '',
}).startRTM()

// get all DAO events
var events = theDAO.allEvents();
events.watch(function(err, evt){
    dispatcher(evt);    
});

var handlers = [];

// this is a bad way to do this
// RAW TX HANDLER
handlers.push(function(evt) { for (rl in RAW_LISTENERS) { if (evt.event != 'Transfer') { RAW_LISTENERS[rl](evt) } } });
// LISTEN FOR VOTES
handlers.push(function(evt) { for (vl in VOTE_LISTENERS) { if (evt.event === 'Voted') { VOTE_LISTENERS[vl](evt) } } });
handlers.push(function(evt) { for (txl in TX_LISTENERS) { if (evt.func) {TX_LISTENERS[txl](evt)}}});
function dispatcher(evt) {
   for (handler in handlers) {
        handlers[handler](evt);
    } 
}



// give the bot something to listen for.
controller.on('hello', function(bot, msg) {
    console.log('CONNECTED to theDAO Slack');
    votingStats(controller);
    statsbot = bot;
    etherScan(function(data) {
        dispatcher(data);
    });
});

// log messages to splunk
controller.on('direct_message', function(bot, message){service.log(message, {sourcetype:"slackMessages"})});
controller.on('ambient', function(bot, message){service.log(message, {sourcetype:"slackMessages"})});

controller.hears('hello',['direct_message','direct_mention','mention'],function(bot,message) {
  bot.reply(message,'Hello yourself.');

});


function votingStats(controller) {
   controller.hears('stats', DIRECT, function(bot,message) { 
        bot.reply(message, getStats()); 
    });

    controller.hears('raw (.*)', DIRECT, function(bot, message) {
        var state = message.match[1];
        if (state == 'on') {
            registerRawListener(bot, message);
            return;
        }
    });

    controller.hears('votes (.*)', DIRECT, function(bot, message) {
        var state = message.match[1];
        if (state == 'on') {
            VOTE_LISTENERS.push(function(evt) {
                bot.reply(message, evt.args.voter + " Voted: *" + evt.args.position + "* on Proposal ID: *" + evt.args.proposalID) +"*";
            });
            return;
        }
    });

    controller.hears('etherscan (.*) (.*)', DIRECT, function(bot, message) {
        var state = message.match[1];
        var func = message.match[2];
        console.log(state, func);
        if (state === 'watch') {
            TX_LISTENERS.push(function(evt) {
               if(evt.func === func) 
                bot.reply(message, JSON.stringify(evt)); 
            });
            return;
        }
    });
}

function getStats() {
    //placeholder
    return JSON.stringify({hello:"test"});
}

function registerRawListener(bot, message) {
    RAW_LISTENERS.push(function(evt) {
        bot.reply(message, JSON.stringify(evt));
    });
}
