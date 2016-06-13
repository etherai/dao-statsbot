var WebSocketClient = require('websocket').client;

var client = new WebSocketClient();

DAOfunctions={
    "013cf08b": "proposals(uint256)",
    "0e708203": "rewardAccount()",
    "149acf9a": "daoCreator()",
    "237e9492": "executeProposal(uint256,bytes)",
    "2632bf20": "unblockMe()",
    "34145808": "totalRewardToken()",
    "4df6d6cc": "allowedRecipients(address)",
    "4e10c3ee": "transferWithoutReward(address,uint256)",
    "612e45a3": "newProposal(address,uint256,string,bytes,uint256,bool)",
    "643f7cdd": "DAOpaidOut(address)",
    "674ed066": "minQuorumDivisor()",
    "6837ff1e": "newContract(address)",
    "749f9889": "changeAllowedRecipients(address,bool)",
    "78524b2e": "halveMinQuorum()",
    "81f03fcb": "paidOut(address)",
    "82661dc4": "splitDAO(uint256,address)",
    "82bf6464": "DAOrewardAccount()",
    "8b15a605": "proposalDeposit()",
    "8d7af473": "numberOfProposals()",
    "96d7f3f5": "lastTimeMinQuorumMet()",
    "a1da2fb9": "retrieveDAOReward(bool)",
    "a3912ec8": "receiveEther()",
    "be7c29c1": "getNewDAOAddress(uint256)",
    "c9d27afe": "vote(uint256,bool)",
    "cc9ae3f6": "getMyReward()",
    "cdef91d0": "rewardToken(address)",
    "dbde1988": "transferFromWithoutReward(address,address,uint256)",
    "e33734fd": "changeProposalDeposit(uint256)",
    "e5962195": "blocked(address)",
    "e66f53b7": "curator()",
    "eceb2945": "checkProposalCode(uint256,address,uint256,bytes)"
}



function setUp(cb) {
client.connect('ws://socket.etherscan.io/wshandler')
client.on('connectFailed', function(err) { console.log(err) });
client.on('connect', function(conn) {
    console.log('Connected to etherscan');
    conn.on('error', function(error) {
        console.log("Connection Error: " + error.toString());
    });
    conn.on('message', function(msg) {
        var data = JSON.parse(msg['utf8Data'])
        if (data['event'] === 'pong')
            return
        var functionHash = null;
        if (!('result' in data))
            return
        var tx = data['result'][0]['input'];
        if (tx){
            functionHash = tx.slice(2,10);
            cb({func:functionHash, tx:data});
        }
        else
            console.log('unknow function call: ', functionHash);

    });
    conn.on('close', function() {
        console.log('echo-protocol Connection Closed');
    });
    setInterval(function() { conn.sendUTF(JSON.stringify({event:"ping"}))}, 7500);
    conn.sendUTF(JSON.stringify({event:"txlist", address:"0xbb9bc244d798123fde783fcc1c72d3bb8c189413"}));
});
}



module.exports = setUp;
