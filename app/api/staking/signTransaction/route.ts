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

    // Get chain information from metadata
    const chain = txData.chain || txData._metadata?.originatingRequest?.chain;
    const network =
      txData.network || txData._metadata?.originatingRequest?.network;

    // Special handling for Celestia transactions
    let rawTransaction;
    if (chain === "celestia") {
      // For Celestia, we need to extract the unsignedTransactionData specifically
      rawTransaction =
        txData.result?.unsignedTransactionData || txData.unsignedTransaction; // Add our fallback

      if (!rawTransaction) {
        throw new Error(
          "Transaction data does not contain unsignedTransactionData"
        );
      }
    } else {
      // For other chains, use the regular rawTransaction field
      rawTransaction =
        txData.result?.rawTransaction ||
        txData.result?.extraData?.unsignedTransaction ||
        txData.unsignedTransaction;
    }

    if (!rawTransaction) {
      throw new Error("Transaction data does not contain raw transaction");
    }

    // Get network with fallback, prioritizing:
    // 1. Network from the request
    // 2. Network from txData
    // 3. Network from metadata
    // 4. Default based on chain
    let networkWithFallback =
      requestNetwork ||
      txData.network ||
      txData._metadata?.originatingRequest?.network;

    if (!networkWithFallback) {
      console.log("Network is undefined, defaulting based on chain");
      networkWithFallback = chain === "solana" ? "testnet" : "mainnet";
    }

    console.log(`Using chain: ${chain}, network: ${networkWithFallback}`);

    // Safe logging of transaction data that handles both string and object types
    if (typeof rawTransaction === "string") {
      console.log(
        `Raw transaction first 100 chars:`,
        rawTransaction.substring(0, 100)
      );
    } else {
      console.log(
        `Raw transaction (object):`,
        JSON.stringify(rawTransaction).substring(0, 100) + "..."
      );
    }

    try {
      // Sign the transaction using the unified signing function
      const signedTransaction = await signTransaction({
        chain,
        network: networkWithFallback,
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
