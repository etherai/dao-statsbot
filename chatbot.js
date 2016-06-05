var Web3 = require("web3");
var theDAOInterface = require('./thedao.js');
var Botkit = require('botkit');

var web3 = new Web3();
web3.setProvider(new web3.providers.HttpProvider());
var theDAO = web3.eth.contract(theDAOInterface).at('0xbb9bc244d798123fde783fcc1c72d3bb8c189413');


var DIRECT = ['direct_message','direct_mention','mention'];
var RAW_LISTENERS = [];
var VOTE_LISTENERS = [];
var statsbot;

var controller = Botkit.slackbot({
  debug: false
  //include "log: false" to disable logging
  //or a "logLevel" integer from 0 to 7 to adjust logging verbosity
});

// connect the bot to a stream of messages
controller.spawn({
  token: '<slack-bot-user-token',
}).startRTM()

// get all DAO events
var events = theDAO.allEvents();
events.watch(function(err, evt){
    dispatcher(evt);    
});

var handlers = [];

// this is a bad way to do this
// RAW TX HANDLER
handlers.push(function(evt) { for (rl in RAW_LISTENERS) { if (evt.event != 'Transfer') { RAW_LISTENERS[rl](evt) } } })
// LISTEN FOR VOTES
handlers.push(function(evt) { for (vl in VOTE_LISTENERS) { if (evt.event === 'Voted') { VOTE_LISTENERS[vl](evt) } } })
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
});

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
