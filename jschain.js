const sha256 = require('sha256');
const currentNodeUrl = process.argv[2];
const uuid = require('uuid/v1');

function Blockchain() {
	this.chain = [];
	this.newTransactions = [];

	this.currentNodeUrl = currentNodeUrl;
	this.networkNodes = [];
	//Arb values for genesis block
	this.createNewBlock(1, '0', '0');
};

Blockchain.prototype.createNewBlock = function(nonce, previousBlockHash, hash) {
	const newBlock = {
		index: this.chain.length + 1,
		timestamp: Date.now(),
		transactions: this.newTransactions,
		nonce: nonce,
		hash: hash,
		previousBlockHash: previousBlockHash
	};

	this.newTransactions = [];
	this.chain.push(newBlock);

	return newBlock;
};

Blockchain.prototype.getLastBlock = function() {
	return this.chain[this.chain.length -1];
};

Blockchain.prototype.createNewTransaction = function(quantity, sender, recipient) {
	const newTransaction = {
		quantity: quantity,
		sender: sender,
		recipient: recipient
		transactionId: uuid().split('-').join('');
	};

	//this.newTransactions.push(newTransaction);
	//return this.getLastBlock()['index'] + 1;
	return newTransaction;
};

Blockchain.prototype.addTransactionToPending = function(transactionObj) {
	this.pendingTransactions.push(transactionObj);
	return this.getLastBlock()['index'] +1;
};

Blockchain.prototype.hashBlock = function(previousBlockHash, currentBlockData, nonce) {
	const dataString = previousBlockHash + nonce.toString() + JSON.stringify(currentBlockData);
	const hash = sha256(dataString);

	return hash;
};

Blockchain.prototype.proofOfWork = function(previousBlockHash, currentBlockData) {
	let nonce = 0;
	let hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);

	while(hash.substring(0, 5) !== '00000') {
		nonce++;
		hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
	};

	return nonce;
};

module.exports = Blockchain;