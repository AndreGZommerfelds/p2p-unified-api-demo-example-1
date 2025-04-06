import { exec } from "child_process";
import path from "path";
import util from "util";
import fs from "fs";

const execPromise = util.promisify(exec);

/**
 * Signs a Celestia transaction by executing a script that uses the CosmJS libraries
 */
export async function signCelestiaTransaction({
  rpcProvider,
  mnemonic,
  stakerAddress,
  rawTransaction,
}: {
  rpcProvider: string;
  mnemonic: string;
  stakerAddress: string;
  rawTransaction: any;
}): Promise<string> {
  console.log(`[signCelestiaTransaction] Starting signing process...`);

  // Prepare transaction data - ensure it's an object we can validate
  let txData: any;

  // Verify the rawTransaction has the expected structure
  try {
    // Parse if it's a string, or use directly if it's already an object
    txData =
      typeof rawTransaction === "string"
        ? JSON.parse(rawTransaction)
        : rawTransaction;

    // Validate required fields for signing
    if (!txData.messages || !Array.isArray(txData.messages)) {
      throw new Error(
        "Missing or invalid 'messages' field in transaction data"
      );
    }

    if (!txData.fee || !txData.fee.amount || !txData.fee.gas) {
      throw new Error("Missing or invalid 'fee' field in transaction data");
    }

    // For the script, always serialize to string
    const serializedTxData = JSON.stringify(txData);
  } catch (error: any) {
    console.error(`[signCelestiaTransaction] Invalid transaction data:`, error);
    throw new Error(`Failed to validate transaction data: ${error.message}`);
  }

  // Create a temporary script in the project directory where node_modules are accessible
  const tempScriptPath = path.join(
    process.cwd(),
    `temp-celestia-signing-${Date.now()}.js`
  );

  // Write a CommonJS version of the signing script
  const tempScriptContent = `
// CommonJS version of the Celestia signing script
const { DirectSecp256k1HdWallet } = require('@cosmjs/proto-signing');
const { SigningCosmWasmClient } = require('@cosmjs/cosmwasm-stargate');
const { TxRaw } = require('cosmjs-types/cosmos/tx/v1beta1/tx');

async function sign() {
  // Environment variables
  const rpcProvider = "${rpcProvider}";
  const mnemonic = "${mnemonic}";
  const stakerAddress = "${stakerAddress}";
  const rawTransaction = ${JSON.stringify(
    txData
  )}; // Directly use the validated object

  console.log("Using provider:", rpcProvider);
  console.log("Using staker address:", stakerAddress);
  console.log("Raw transaction type:", typeof rawTransaction);
  console.log("Raw transaction has messages:", !!rawTransaction.messages);
  console.log("Raw transaction has fee:", !!rawTransaction.fee);

  // Initialize wallet with mnemonic
  const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
    prefix: 'celestia',
  });
  
  console.log("Wallet initialized");

  try {
    // Connect to Celestia node
    console.log("Connecting to Celestia RPC at:", rpcProvider);
    const client = await SigningCosmWasmClient.connectWithSigner(rpcProvider, wallet);
    console.log("Connected to Celestia node");

    try {
      // Sign the transaction
      const signedTx = await client.sign(
        stakerAddress,
        rawTransaction.messages,
        rawTransaction.fee,
        rawTransaction.memo || ''
      );
      console.log("Transaction signed successfully");

      // Convert to hex format
      const txRawBytes = TxRaw.encode(signedTx).finish();
      const signedHex = Array.from(txRawBytes)
        .map((byte) => byte.toString(16).padStart(2, '0'))
        .join('');
      
      console.log("Transaction encoded to hex format");
      return signedHex;
    } catch(error) {
      console.error("Error during signing:", error);
      throw error;
    }
  } catch(error) {
    console.error("Error connecting to RPC:", error);
    if (error.message && error.message.includes('ENOTFOUND')) {
      throw new Error(\`RPC connection failed: Cannot resolve hostname \${rpcProvider}. Please check network connectivity or try an alternative RPC endpoint.\`);
    } else if (error.message && error.message.includes('ECONNREFUSED')) {
      throw new Error(\`RPC connection failed: Connection refused to \${rpcProvider}. The RPC endpoint may be down or blocking requests.\`);
    } else if (error.message && error.message.includes('timeout')) {
      throw new Error(\`RPC connection failed: Connection to \${rpcProvider} timed out. The network may be congested or the RPC endpoint is slow.\`);
    } else {
      throw error;
    }
  }
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
      `[signCelestiaTransaction] Executing script in project directory...`
    );
    // Execute in the current working directory where node_modules is accessible
    const { stdout, stderr } = await execPromise(`node ${tempScriptPath}`);

    // Clean up temp file immediately
    fs.unlinkSync(tempScriptPath);

    if (stderr) {
      console.error(`[signCelestiaTransaction] Error from script: ${stderr}`);
    }

    console.log(`[signCelestiaTransaction] Script output: ${stdout}`);

    // Extract the signed transaction from the output
    const signedTxMatch = stdout.match(/SIGNED_TRANSACTION:([a-fA-F0-9]+)/);

    if (!signedTxMatch || !signedTxMatch[1]) {
      throw new Error("Failed to parse signed transaction from script output");
    }

    const signedTransaction = signedTxMatch[1];
    console.log(
      `[signCelestiaTransaction] Successfully extracted signed tx: ${signedTransaction.substring(
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
      "[signCelestiaTransaction] Error executing signing script:",
      error
    );

    // If the error contains SIGNING_ERROR, extract the more detailed error message
    if (error instanceof Error && error.message.includes("SIGNING_ERROR:")) {
      const errorMatch = error.message.match(/SIGNING_ERROR:\s*(.*?)$/m);
      if (errorMatch && errorMatch[1]) {
        throw new Error(`Celestia signing error: ${errorMatch[1]}`);
      }
    }

    throw error;
  }
}
