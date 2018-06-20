const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const Blockchain = require('./jschain');
const uuid = require('uuid/v1');

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

app.post('/mine', function(req, res) {
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

app.listen(3000, function() {
	console.log(' --| Listening |-- ');
});