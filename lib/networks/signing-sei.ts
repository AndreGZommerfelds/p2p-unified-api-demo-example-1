import { exec } from "child_process";
import path from "path";
import util from "util";
import fs from "fs";

const execPromise = util.promisify(exec);

/**
 * Signs a SEI transaction by executing a script that uses the CosmJS libraries
 */
export async function signSeiTransaction({
  rpcProvider,
  mnemonic,
  stakerAddress,
  rawTransaction,
}: {
  rpcProvider: string;
  mnemonic: string;
  stakerAddress: string;
  rawTransaction: string;
}): Promise<string> {
  console.log(`[signSeiTransaction] Starting signing process...`);

  // Create a temporary script in the project directory where node_modules are accessible
  const tempScriptPath = path.join(
    process.cwd(),
    `temp-sei-signing-${Date.now()}.js`
  );

  // Write a CommonJS version of the signing script
  const tempScriptContent = `
// CommonJS version of the SEI signing script
const { DirectSecp256k1HdWallet } = require('@cosmjs/proto-signing');
const { SigningCosmWasmClient } = require('@cosmjs/cosmwasm-stargate');
const { TxRaw } = require('cosmjs-types/cosmos/tx/v1beta1/tx');

async function sign() {
  // Environment variables
  const rpcProvider = "${rpcProvider}";
  const mnemonic = "${mnemonic}";
  const stakerAddress = "${stakerAddress}";
  const rawTransaction = JSON.parse('${rawTransaction}');

  console.log("Using provider:", rpcProvider);
  console.log("Using staker address:", stakerAddress);
  console.log("Raw transaction:", typeof rawTransaction);

  // Initialize wallet with mnemonic
  const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
    prefix: 'sei',
  });
  
  console.log("Wallet initialized");

  // Connect to SEI node
  const client = await SigningCosmWasmClient.connectWithSigner(rpcProvider, wallet);
  console.log("Connected to SEI node");

  // Sign the transaction
  const signedTx = await client.sign(
    stakerAddress,
    rawTransaction.messages,
    rawTransaction.fee,
    rawTransaction.memo || ''
  );
  console.log("Transaction signed");

  // Convert to hex format
  const txRawBytes = TxRaw.encode(signedTx).finish();
  const signedHex = Array.from(txRawBytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
  
  console.log("Transaction encoded to hex format");
  return signedHex;
}

// Execute the sign function
sign().then(signedHex => {
  console.log("SIGNED_TRANSACTION:" + signedHex);
  process.exit(0);
}).catch((error) => {
  console.error("SIGNING_ERROR:", error);
  process.exit(1);
});
  `;

  fs.writeFileSync(tempScriptPath, tempScriptContent);

  try {
    console.log(
      `[signSeiTransaction] Executing script in project directory...`
    );
    // Execute in the current working directory where node_modules is accessible
    const { stdout, stderr } = await execPromise(`node ${tempScriptPath}`);

    // Clean up temp file immediately
    fs.unlinkSync(tempScriptPath);

    if (stderr) {
      console.error(`[signSeiTransaction] Error from script: ${stderr}`);
    }

    console.log(`[signSeiTransaction] Script output: ${stdout}`);

    // Extract the signed transaction from the output
    const signedTxMatch = stdout.match(/SIGNED_TRANSACTION:([a-fA-F0-9]+)/);

    if (!signedTxMatch || !signedTxMatch[1]) {
      throw new Error("Failed to parse signed transaction from script output");
    }

    const signedTransaction = signedTxMatch[1];
    console.log(
      `[signSeiTransaction] Successfully extracted signed tx: ${signedTransaction.substring(
        0,
        20
      )}...`
    );

    return signedTransaction;
  } catch (error) {
    // Clean up temp file in case of error
    if (fs.existsSync(tempScriptPath)) {
      fs.unlinkSync(tempScriptPath);
    }

    console.error(
      "[signSeiTransaction] Error executing signing script:",
      error
    );

    // If the error contains SIGNING_ERROR, extract the more detailed error message
    if (error instanceof Error && error.message.includes("SIGNING_ERROR:")) {
      const errorMatch = error.message.match(/SIGNING_ERROR:\s*(.*?)$/m);
      if (errorMatch && errorMatch[1]) {
        throw new Error(`SEI signing error: ${errorMatch[1]}`);
      }
    }

    throw error;
  }
}
