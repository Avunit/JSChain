function Blockchain() {
	this.chain = [];
	this.newTransactions = [];
}

Blockchain.prototype.createNewBlock = function() {
	const newBlock = {
		index: this.chain.length + 1,
		timestamp: Date.now(),
		transactions: this.newTransactions,
		nonce:
		hash:
		previousBlockHash:
	};
}