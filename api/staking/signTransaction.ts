import { NextRequest, NextResponse } from "next/server";
import { signPolkadotTransaction } from "@/lib/networks/signing-polkadot";
import { readTransactionFile, updateTransactionFile } from "@/lib/serverUtils";
import {
  getPolkadotRpcProvider,
  getPolkadotKeystorePath,
  getPolkadotKeystorePassword,
} from "@/lib/networks/polkadot.config";

export async function POST(req: NextRequest) {
  try {
    const {
      transactionId,
      chain: requestChain,
      network: requestNetwork,
    } = await req.json();

    console.log(
      `[signTransaction] Received request for transaction: ${transactionId}`
    );

    if (!transactionId) {
      console.error(`[signTransaction] No transaction ID provided`);
      return NextResponse.json(
        { error: "Missing transaction ID" },
        { status: 400 }
      );
    }

    console.log(
      `[signTransaction] Looking for transaction file with ID: ${transactionId}`
    );
    // Read the transaction file with the given ID
    const txData = readTransactionFile(transactionId);

    if (!txData) {
      console.error(
        `[signTransaction] Transaction not found: ${transactionId}`
      );

      // If the transaction is not found with the exact ID, and it's a client-generated ID,
      // it might be worth logging this for debugging
      if (transactionId.includes("-") && /\d{13}$/.test(transactionId)) {
        console.log(
          `[signTransaction] This appears to be a client-generated ID with timestamp format`
        );
      }

      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    console.log(
      `[signTransaction] Found transaction data: ${JSON.stringify({
        transactionId: txData.transactionId,
        hasRawTx: !!txData.result?.extraData?.unsignedTransaction,
        hasSignedTx: !!txData.signedTransaction,
      })}`
    );

    // Check if transaction has already been signed
    if (txData.signedTransaction) {
      console.log(`[signTransaction] Transaction was already signed`);
      return NextResponse.json({
        success: true,
        transactionId: txData.transactionId,
        signedTransaction: txData.signedTransaction,
        message: "Transaction was already signed",
      });
    }

    // Check for unsigned transaction in the P2P.ORG API response structure
    if (!txData.result?.extraData?.unsignedTransaction) {
      console.error(
        `[signTransaction] Transaction does not contain raw transaction data`
      );
      return NextResponse.json(
        { error: "Transaction does not contain raw transaction data" },
        { status: 400 }
      );
    }

    // Extract data from the P2P.ORG API response structure
    const rawTransaction = txData.result.extraData.unsignedTransaction;

    // Get chain/network from metadata or original request
    let txChain, network;

    // First, try to get network from request parameters
    if (requestNetwork) {
      console.log(
        `[signTransaction] Using network from request: ${requestNetwork}`
      );
      network = requestNetwork.toLowerCase();
    }
    // Then, try to get from metadata if available
    else if (txData._metadata?.originatingRequest) {
      txChain =
        txData._metadata.originatingRequest.chain?.toLowerCase() || "polkadot";
      network = txData._metadata.originatingRequest.network?.toLowerCase();
    }

    // Finally, use a default if still not defined
    if (!network) {
      console.log(
        `[signTransaction] No network specified, defaulting to mainnet`
      );
      network = "mainnet"; // Default to mainnet if no network is specified
    }

    // Set chain to polkadot if not defined
    txChain = txChain || "polkadot";

    console.log(
      `[signTransaction] Using chain: ${txChain}, network: ${network}`
    );

    // Check if chain is supported
    if (txChain !== "polkadot") {
      console.error(`[signTransaction] Unsupported chain: ${txChain}`);
      return NextResponse.json(
        { error: "Only Polkadot chain is currently supported for signing" },
        { status: 400 }
      );
    }

    // Get environment variables using utility functions
    let rpcProvider, keystorePath, password;
    try {
      rpcProvider = getPolkadotRpcProvider(network);
      keystorePath = getPolkadotKeystorePath(network);
      password = getPolkadotKeystorePassword(network);
    } catch (error) {
      console.error(`[signTransaction] Error getting configuration:`, error);
      return NextResponse.json(
        {
          error: "Missing configuration for signing",
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 500 }
      );
    }

    console.log(
      `[signTransaction] Network: ${network}, RPC Provider: ${rpcProvider?.substring(
        0,
        20
      )}...`
    );
    console.log(
      `[signTransaction] Keystore Path exists: ${!!keystorePath}, Password exists: ${!!password}`
    );

    console.log(
      `[signTransaction] Signing transaction for ${txChain}/${network}...`
    );
    console.log(
      `[signTransaction] Using raw transaction: ${rawTransaction.substring(
        0,
        20
      )}...`
    );

    try {
      // Sign the transaction
      const signedTransaction = await signPolkadotTransaction({
        rpcProvider,
        keystorePath,
        password,
        rawTransaction: rawTransaction,
      });

      console.log(
        `[signTransaction] Successfully signed transaction: ${signedTransaction.substring(
          0,
          20
        )}...`
      );

      // Update transaction data with signed transaction using our utility function
      // Add the signedTransaction field directly to the txData object
      const updatedTxData = updateTransactionFile(transactionId, {
        signedTransaction,
        _metadata: {
          ...txData._metadata,
          status: "signed",
          signedAt: new Date().toISOString(),
        },
      });

      if (!updatedTxData) {
        throw new Error("Failed to update transaction file");
      }

      return NextResponse.json({
        success: true,
        transactionId: txData.transactionId,
        signedTransaction,
      });
    } catch (signingError) {
      console.error(
        "[signTransaction] Error in transaction signing process:",
        signingError
      );
      return NextResponse.json(
        {
          error: "Failed to sign transaction",
          details:
            signingError instanceof Error
              ? signingError.message
              : "Unknown error",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[signTransaction] Error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to sign transaction",
      },
      { status: 500 }
    );
  }
}
