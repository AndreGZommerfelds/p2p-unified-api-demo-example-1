import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { signTransaction } from "@/lib/networks";

interface TransactionData {
  transactionId: string;
  chain: string;
  network?: string;
  rawTransaction: string;
  signedTransaction?: string;
  [key: string]: any;
}

export async function POST(req: NextRequest) {
  console.log("Sign transaction API endpoint called");

  try {
    const body = await req.json();
    console.log("Request body (detailed):", JSON.stringify(body, null, 2));

    const {
      transactionId,
      chain: requestChain,
      network: requestNetwork,
    } = body;

    if (!transactionId) {
      console.error("Missing required parameters");
      return NextResponse.json(
        { error: "Missing transaction ID" },
        { status: 400 }
      );
    }

    // Log file path for debugging
    const txFilePath = path.join(
      process.cwd(),
      "transactions",
      `tx-${transactionId}.json`
    );
    console.log("Looking for transaction file at:", txFilePath);

    // Load transaction data
    if (!fs.existsSync(txFilePath)) {
      console.error("Transaction file not found");
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    console.log("Transaction file found, loading data...");
    const txData = JSON.parse(
      fs.readFileSync(txFilePath, "utf8")
    ) as TransactionData;
    console.log("Transaction data loaded:", JSON.stringify(txData, null, 2));

    // Check if transaction has already been signed
    if (txData.signedTransaction) {
      console.log(`Transaction was already signed`);
      return NextResponse.json({
        success: true,
        transactionId: txData.transactionId,
        signedTransaction: txData.signedTransaction,
        message: "Transaction was already signed",
      });
    }

    // Extract chain from the transaction data or request
    const chain =
      requestChain ||
      txData.chain ||
      txData._metadata?.originatingRequest?.chain ||
      "polkadot";

    // Check if rawTransaction exists
    let rawTransaction = txData.rawTransaction;
    if (!rawTransaction) {
      console.log("Transaction data does not contain rawTransaction directly");

      // Check if it might be in the P2P.ORG API response format
      if (txData.result?.extraData?.unsignedTransaction) {
        console.log(
          "Found unsigned transaction in P2P.ORG API response format"
        );
        rawTransaction = txData.result.extraData.unsignedTransaction;
      } else {
        return NextResponse.json(
          { error: "Transaction data does not contain raw transaction" },
          { status: 400 }
        );
      }
    }

    // Get network with fallback, prioritizing:
    // 1. Network from the request
    // 2. Network from txData
    // 3. Network from metadata
    // 4. Default based on chain
    let network =
      requestNetwork ||
      txData.network ||
      txData._metadata?.originatingRequest?.network;

    if (!network) {
      console.log("Network is undefined, defaulting based on chain");
      network = chain === "solana" ? "testnet" : "mainnet";
    }

    console.log(`Using chain: ${chain}, network: ${network}`);
    console.log(
      `Raw transaction first 100 chars:`,
      rawTransaction?.substring(0, 100) || "UNDEFINED"
    );

    try {
      // Sign the transaction using the unified signing function
      const signedTransaction = await signTransaction({
        chain,
        network,
        unsignedTransactionData: rawTransaction,
      });

      console.log("Transaction signed successfully");
      console.log(
        "Signed transaction first 100 chars:",
        signedTransaction.substring(0, 100)
      );

      // Update transaction data with signed transaction
      txData.signedTransaction = signedTransaction;
      fs.writeFileSync(txFilePath, JSON.stringify(txData, null, 2));
      console.log("Transaction file updated with signed transaction");

      return NextResponse.json({
        success: true,
        transactionId,
        signedTransaction,
      });
    } catch (signingError) {
      console.error("Error during signing:", signingError);
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
    console.error("Error in sign transaction endpoint:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to sign transaction",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
