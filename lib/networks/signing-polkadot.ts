import { exec } from "child_process";
import path from "path";
import util from "util";
import fs from "fs";
import os from "os";

const execPromise = util.promisify(exec);

/**
 * Signs a Polkadot transaction by executing a CommonJS version of the signing script
 * This wrapper adapts our existing environment variable conventions to what the script expects
 */
export async function signPolkadotTransaction({
  rpcProvider,
  keystorePath,
  password,
  rawTransaction,
}: {
  rpcProvider: string;
  keystorePath: string;
  password: string;
  rawTransaction: string;
}): Promise<string> {
  console.log(`[signPolkadotTransaction] Starting signing process...`);

  // Create a temporary script in the project directory where node_modules are accessible
  const tempScriptPath = path.join(
    process.cwd(),
    `temp-polkadot-signing-${Date.now()}.js`
  );

  // Write a CommonJS version of the signing script
  const tempScriptContent = `
// CommonJS version of the signing script
const fs = require('fs');
const { ApiPromise, WsProvider, Keyring } = require('@polkadot/api');
require('@polkadot/api-augment');

async function sign() {
  // Environment variables
  const provider = "${rpcProvider}";
  const secretFileName = "${keystorePath.replace(/\\/g, "\\\\")}";
  const password = "${password}";
  const rawTransaction = "${rawTransaction}";

  console.log("Using provider:", provider);
  console.log("Using keystore:", secretFileName);
  console.log("Password length:", password.length);
  console.log("Raw transaction:", rawTransaction.substring(0, 20) + "...");

  // connect to polkadot node
  const wsProvider = new WsProvider(provider);
  const api = await ApiPromise.create({ provider: wsProvider });
  await api.isReady;
  console.log("Connected to Polkadot node");

  // load keyring file
  const keyring = new Keyring({ type: "sr25519" });
  const fileContent = fs.readFileSync(secretFileName, "utf8");
  const keyInfo = JSON.parse(fileContent);
  const sender = keyring.addFromJson(keyInfo);
  // decode secret key
  sender.decodePkcs8(password);
  console.log("Loaded keyring and decoded with password");

  const unsigned = api.tx(rawTransaction);
  console.log("Created unsigned transaction");

  // sign transaction
  const signedExtrinsic = await unsigned.signAsync(sender);
  console.log("signedExtrinsic", signedExtrinsic.toHuman());

  // print signed transaction
  const hexEx = signedExtrinsic.toHex();
  console.log("signedExtrinsic toHex", hexEx);

  await api.disconnect();
  return hexEx;
}

// run sign function
sign().then(signedTx => {
  console.log("SIGNED_TRANSACTION:" + signedTx);
  process.exit(0);
}).catch((error) => {
  console.error("SIGNING_ERROR:", error);
  process.exit(1);
});
  `;

  fs.writeFileSync(tempScriptPath, tempScriptContent);

  try {
    console.log(
      `[signPolkadotTransaction] Executing script in project directory...`
    );
    // Execute in the current working directory where node_modules is accessible
    const { stdout, stderr } = await execPromise(`node ${tempScriptPath}`);

    // Clean up temp file immediately
    fs.unlinkSync(tempScriptPath);

    if (stderr) {
      console.error(`[signPolkadotTransaction] Error from script: ${stderr}`);
    }

    console.log(`[signPolkadotTransaction] Script output: ${stdout}`);

    // Extract the signed transaction hexadecimal from the output
    // Look for our special marker
    const signedTxMatch = stdout.match(/SIGNED_TRANSACTION:(0x[a-fA-F0-9]+)/);

    if (!signedTxMatch || !signedTxMatch[1]) {
      // Fall back to the original pattern if our marker is not found
      const fallbackMatch = stdout.match(
        /signedExtrinsic toHex\s(0x[a-fA-F0-9]+)/
      );
      if (!fallbackMatch || !fallbackMatch[1]) {
        throw new Error(
          "Failed to parse signed transaction from script output"
        );
      }
      return fallbackMatch[1];
    }

    const signedTransaction = signedTxMatch[1];
    console.log(
      `[signPolkadotTransaction] Successfully extracted signed tx: ${signedTransaction.substring(
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
      "[signPolkadotTransaction] Error executing signing script:",
      error
    );

    // If the error contains SIGNING_ERROR, extract the more detailed error message
    if (error instanceof Error && error.message.includes("SIGNING_ERROR:")) {
      const errorMatch = error.message.match(/SIGNING_ERROR:\s*(.*?)$/m);
      if (errorMatch && errorMatch[1]) {
        throw new Error(`Polkadot signing error: ${errorMatch[1]}`);
      }
    }

    throw error;
  }
}
