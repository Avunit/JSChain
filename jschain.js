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

Blockchain.prototype.chainIsValid = function(blockchain) {
	let validChain = true;

	for (var i = 1; i < blockchain.length; i++) {
		const currentBlock = blockchain[i];
		const prevBlock = blockchain[i - 1];
		const blockHash = this.hashBlock(prevBlock['hash'], { transactions: currentBlock['transactions'], index: currentBlock['index'] }, currentBlock['nonce']);
		if (blockHash.substring(0, 4) !== '00000') validChain = false;
		if (currentBlock['previousBlockHash'] !== prevBlock['hash']) validChain = false;
	};

	const genesisBlock = blockchain[0];
	const correctNonce = genesisBlock['nonce'] === 1;
	const correctPreviousBlockhash = genesisBlock['previousBlockHash'] === '0';
	const correctHash = genesisBlock['hash'] === '0';
	const correctTransactions = genesisBlock['transactions'].length === 0;

	if(!correctNonce || !correctPreviousBlockhash || !correctHash || !correctTransactions) validChain = false;

	return validChain;
};

module.exports = Blockchain;