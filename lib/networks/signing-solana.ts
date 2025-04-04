import { exec } from "child_process";
import path from "path";
import util from "util";
import fs from "fs";

const execPromise = util.promisify(exec);

/**
 * Signs a Solana transaction by executing the existing signing-solana.js script
 * This wrapper adapts our environment variable conventions to what the script expects
 */
export async function signSolanaTransaction({
  network,
  unsignedTransactionData,
}: {
  network: string;
  unsignedTransactionData: string;
}): Promise<string> {
  console.log(`[signSolanaTransaction] Starting signing process...`);

  // Get the appropriate private key based on the network
  const networkUpperCase = network.toUpperCase().replace(/-/g, "_");
  const privateKeyEnvVar = `PRIVATE_KEYS_SOLANA_${networkUpperCase}`;
  const privateKey = process.env[privateKeyEnvVar];

  if (!privateKey) {
    throw new Error(
      `Missing private key for Solana ${network}. Set ${privateKeyEnvVar} in .env file`
    );
  }

  // Create a temporary script that wraps the signing-solana.js with our environment variables
  const tempScriptPath = path.join(
    process.cwd(),
    `temp-solana-signing-${Date.now()}.js`
  );

  // Write a script that sets environment variables and requires the original signing script
  const tempScriptContent = `
// Set environment variables required by signing-solana.js
process.env.PRIVATE_KEYS = "${privateKey}";
process.env.TX = "${unsignedTransactionData}";

// Run the original signing script
require("${path
    .join(process.cwd(), "lib/networks/signing-solana.js")
    .replace(/\\/g, "\\\\")}");
  `;

  fs.writeFileSync(tempScriptPath, tempScriptContent);

  try {
    console.log(
      `[signSolanaTransaction] Executing script in project directory...`
    );
    // Execute in the current working directory where node_modules is accessible
    const { stdout, stderr } = await execPromise(`node ${tempScriptPath}`);

    // Clean up temp file immediately
    fs.unlinkSync(tempScriptPath);

    if (stderr) {
      console.error(`[signSolanaTransaction] Error from script: ${stderr}`);
    }

    console.log(`[signSolanaTransaction] Script output: ${stdout}`);

    // The signing-solana.js script logs the base64 encoded signed transaction
    // We need to extract it from the output
    const signedTxBase64 = stdout.trim();

    if (!signedTxBase64 || signedTxBase64.length === 0) {
      throw new Error("Failed to get signed transaction from script output");
    }

    console.log(
      `[signSolanaTransaction] Successfully extracted signed tx: ${signedTxBase64.substring(
        0,
        20
      )}...`
    );

    return signedTxBase64;
  } catch (error) {
    // Clean up temp file in case of error
    if (fs.existsSync(tempScriptPath)) {
      fs.unlinkSync(tempScriptPath);
    }

    console.error(
      "[signSolanaTransaction] Error executing signing script:",
      error
    );
    throw error;
  }
}
