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
	const newTransaction = req.body;
	const blockIndex = jsChain.addTransactionToPending(newTransaction);
	res.json({ note: `Transaction pending for block ${blockIndex}.` });
});

app.post('/transaction/broadcast', function(req, res) {
	const newTransaction = jsChain.createNewTransaction(req.body.quantity, req.body.sender, req.body.recipient);
	jsChain.addTransactionToPending(newTransaction);

	const requestPromises = [];
	jsChain.networkNodes.forEach(networkNodeUrl => {
		const requestOptions = {
			uri: networkNodeUrl + '/transaction',
			method: 'POST',
			body: newTransaction,
			json: true
		};

		requestPromises.push(rp(requestOptions));
	});

	Promise.all(requestPromises);
	.then(data => {
		res.json({ note: 'Transaction created and broadcast.' });
	});
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

	const requestPromises = [];
	jsChain.networkNodes.forEach(networkNodeUrl => {
		const requestOptions = {
			uri: networkNodeUrl + '/new-block',
			method: 'POST',
			body: { newBlock: newBlock },
			json: true
		};

		requestPromises.push(rp(requestOptions));
	});

	Promise.all(requestPromises)
	.then(data => {
		//Mining reward will go here
		//return rp(requestOptions);
	});
	.then(data => {
		res.json({
			note: "Block mined successfully",
			block: newBlock
		});
	});

});

app.post('/new-block', function(req, res) {
	const newBlock = req.body.newBlock;
	const lastBlock = jschain.getLastBlock();
	const correctHash = lastBlock.hash === newBlock.previousBlockHash;
	const correctIndex = lastBlock['index'] + 1 === newBlock['index'];

	if (correctHash && correctIndex) {
		jsChain.chain.push(newBlock);
		jsChain.pendingTransactions = [];

		res.json({
			note: 'New block accepted',
			newBlock: newBlock
		});
	} else {
		res.json({
			note: 'New block rejected',
			newBlock: newBlock
		});
	}
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
	const newNodeUrl = req.body.newNodeUrl;
	const notPresent = jsChain.networkNodes.indexOf(newNodeUrl) == -1;
	const notCurrentNode = jsChain.currentNodeUrl !== newNodeUrl;

	if (notPresent && notCurrentNode) jsChain.networkNodes.push(newNodeUrl);
	res.json({ note: 'Node registered.' });
});

//Register multiple nodes with network
app.post('/register-bulk', function(req, res)) {
	const allNetworkNodes = req.body.allNetworkNodes;
	allNetworkNodes.forEach(networkNodeUrl => {
		const notPresent = jsChain.networkNodes.indexOf(networkNodeUrl) == -1;
		const notCurrentNode = jsChain.currentNodeUrl !== networkNodeUrl;
		if (notPresent && notCurrentNode) jsChain.networkNodes.push(networkNodeUrl);
	});

	res.json({ note: "Bulk registration successful." });
});


app.get('/consensus', function(req, res) {
	const requestPromises = [];
	jsChain.networkNodes.forEach(networkNodeUrl => {
		const requestOptions = {
			uri: networkNodeUrl + '/blockchain'.
			method: 'GET',
			json: true
		};

		requestPromises.push(rp(requestOptions));
	});

	Promise.all(requestPromises);
	.then(blockchains => {
		const currentChainLength = jsChain.chain.length;
		let maxChainLength = currentChainLength;
		let newLongestChain = null;
		let newPendingTransactions = null;

		blockchains.forEach(blockchain => {
			if (blockchain.chain.length > maxChainLength) {
				maxChainLength = blockchain.chain.length;
				newLongestChain = blockchain.chain;
				newPendingTransactions = blockchain.pendingTransactions;
			};
		});

		if (!newLongestChain || (newLongestChain && jsChain.chainIsValid(newLongestChain))) {
			res.json({
				note: 'Current chain not replaced.',
				chain: jsChain.chain
			});
		}
		else if (newLongestChain && jsChain.chainIsValid(newLongestChain)) {
			jsChain.chain = newLongestChain;
			jsChain.pendingTransactions = newPendingTransactions;
			res.json({
				note: 'Current chain replaced.',
				chain: jsChain.chain
			});
		}
	});
});

app.listen(3000, function() {
	console.log(' --| Listening |-- ');
});