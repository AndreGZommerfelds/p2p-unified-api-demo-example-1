const web3 = require("@solana/web3.js");
const bs58 = require("bs58");
const { Transaction } = web3(async () => {
  // base58 signer private keys devided by comma `,`
  const privateKeys = process.env.PRIVATE_KEYS;
  // base64 unsigned transaction
  const transaction = process.env.TX;

  let tx = Transaction.from(Buffer.from(transaction, "base64"));

  // sign transaction for each signer
  for (const pk of privateKeys) {
    const signer = web3.Keypair.fromSecretKey(new Uint8Array(bs58.decode(pk)));
    tx.sign(signer);
  }
  // print signed transaction
  console.log(tx.serialize().toString("base64"));
})();
