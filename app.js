var express = require('express');
var app = express();

var id = 1;

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

var clientId = 0;
var clients = {};  // <- Keep a map of attached clients

// Called once for each new client. Note, this response is left open!
app.get('/events/', function(req, res) {
	req.socket.setTimeout(Number.MAX_VALUE);
    res.writeHead(200, {
    	'Content-Type': 'text/event-stream',  // <- Important headers
    	'Cache-Control': 'no-cache',
		'Connection': 'keep-alive'
    });
    res.write('\n');
    (function(clientId) {
        clients[clientId] = res;  // <- Add this client to those we consider "attached"
        req.on("close", function(){delete clients[clientId]});  // <- Remove this client when he disconnects
    })(++clientId)
});
app.get('/existingevents', function(req, res) {
	var msgs = [];
	res.setHeader('Content-Type', 'application/json');
	for (var i = 0; i < 50; i++) {
		msgs.push({
			id: 10000 + i,
			dataAttr: Math.random(),
			label: 'test',
			date: new Date()
		});
	}
	res.send(JSON.stringify({ 'dummies' : msgs }));
});


setInterval(function(){
	var msg = JSON.stringify({
		id: id,
		dataAttr: Math.random(),
		label: 'test',
		date: new Date()
	});
	++id;
	
	console.log("Clients: " + Object.keys(clients) + " <- " + msg);
	for (clientId in clients) {
		clients[clientId].write("data: "+ msg + "\n\n"); // <- Push a message to a single attached client
	};
}, 2000);

app.listen(process.env.PORT || 8181);
