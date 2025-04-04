import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { signPolkadotTransaction } from "@/lib/networks/signing-polkadot";
import {
  getPolkadotRpcProvider,
  getPolkadotKeystorePath,
  getPolkadotKeystorePassword,
} from "@/lib/networks/polkadot.config";

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

    const { transactionId, chain, network: requestNetwork } = body;

    if (!transactionId || !chain) {
      console.error("Missing required parameters");
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Check if chain is supported
    if (chain !== "polkadot") {
      console.error("Unsupported chain:", chain);
      return NextResponse.json(
        { error: "Only Polkadot chain is currently supported for signing" },
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

    // Check if rawTransaction exists
    if (!txData.rawTransaction) {
      console.error("Transaction data does not contain raw transaction");

      // Check if it might be in the P2P.ORG API response format
      if (txData.result?.extraData?.unsignedTransaction) {
        console.log(
          "Found unsigned transaction in P2P.ORG API response format"
        );
        txData.rawTransaction = txData.result.extraData.unsignedTransaction;
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
    // 3. Default to mainnet
    let network = requestNetwork || txData.network;

    if (!network) {
      console.log("Network is undefined, defaulting to mainnet");
      network = "mainnet";
    } else {
      console.log(
        `Network specified in ${
          requestNetwork ? "request" : "transaction data"
        }: ${network}`
      );
    }

    // Always update txData with the correct network
    txData.network = network;

    // Save updated network info to transaction file
    fs.writeFileSync(txFilePath, JSON.stringify(txData, null, 2));

    console.log("Using network:", network);

    // Get environment variables using utility functions
    let rpcProvider, keystorePath, password;
    try {
      rpcProvider = getPolkadotRpcProvider(network);
      keystorePath = getPolkadotKeystorePath(network);
      password = getPolkadotKeystorePassword(network);
    } catch (error) {
      console.error("Error getting configuration:", error);
      return NextResponse.json(
        {
          error: "Missing configuration for signing",
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 500 }
      );
    }

    console.log("Environment variables loaded:");
    console.log("RPC Provider:", rpcProvider);
    console.log("Keystore path:", keystorePath);
    console.log("Network:", network);
    console.log(
      "Available env vars:",
      Object.keys(process.env).filter((key) => key.startsWith("KEY"))
    );

    console.log("Attempting to sign transaction...");
    console.log("RPC Provider:", rpcProvider);
    console.log("Keystore path:", keystorePath);
    console.log(
      "Raw transaction first 100 chars:",
      txData.rawTransaction?.substring(0, 100) || "UNDEFINED"
    );

    try {
      // Sign the transaction
      const signedTransaction = await signPolkadotTransaction({
        rpcProvider,
        keystorePath,
        password,
        rawTransaction: txData.rawTransaction,
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
      throw signingError;
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
