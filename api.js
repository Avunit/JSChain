const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const Blockchain = require('./jschain');
const uuid = require('uuid/v1');
const rp = require('request-promise');

const nodeID = uuid().split('-').join('');

const jsChain = new Blockchain();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/blockchain', function(req, res) {
	res.send(jsChain);
});

app.post('/transaction', function(req, res) {
	const blockIndex = jsChain.createNewTransaction(req.body.quantity, req.body.sender, req.body.recipient);
	res.json({ note: `Transaction pending, will be added in block ${blockIndex}.`});
});

app.get('/mine', function(req, res) {
	const lastBlock = jsChain.getLastBlock();
	const previousBlockHash = lastBlock['hash'];
	const currentBlockData = {
		transactions: jsChain.pendingTransactions,
		index: lastBlock['index'] + 1;
	};
	const nonce = jsChain.proofOfWork(previousBlockHash, currentBlockData);
	const blockHash = jsChain.hashBlock(previousBlockHash, currentBlockData, nonce);

	const newBlock = jsChain.createNewBlock(nonce, previousBlockHash, blockHash);
	res.json({
		note: "Block mined successfully",
		block: newBlock
	});
});

//Register new node and broadcast to network
app.post('/register-broadcast', function(req, res)) {
	const newNodeUrl = req.body.newNodeUrl;
	if (jsChain.networkNodes.indexOf(newNodeUrl) == -1) jsChain.networkNodes.push(newNodeUrl);

	const regNodesPromises = [];
	jsChain.networkNodes.forEach(networkNodeUrl => {
		//Register endpoint
		const requestOptions = {
			uri: networkNodeUrl + '/register',
			method: 'POST',
			body: { newNodeUrl: newNodeUrl },
			json: true
		};

		regNodesPromises.push(rp(requestOptions));
	});

	Promise.all(regNodesPromises)
	.then(data => {
		const bulkRegisterOptions = {
			uri: newNodeUrl + '/register-bulk',
			method: 'POST',
			body: { allNetworkNodes: [ ...jsChain.networkNodes, jsChain.currentNodeUrl ] },
			json: true
		};

		return rp(bulkRegisterOptions);
	});
	.then(data => {
		res.json({ note: 'Node registered with network.' });
	});
});

//Register node with network
app.post('/register', function(req, res)) {

});

//Register multiple nodes with network
app.post('/register-bulk', function(req, res)) {

});

app.listen(3000, function() {
	console.log(' --| Listening |-- ');
});