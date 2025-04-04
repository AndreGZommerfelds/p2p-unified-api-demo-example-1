import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

interface TransactionData {
  transactionId: string;
  chain: string;
  network: string;
  stakerAddress: string;
  signedTransaction: string;
  [key: string]: any;
}

/**
 * Get the blockchain explorer URL for a given chain, network, and transaction hash
 */
const getExplorerUrl = (
  chain: string,
  network: string,
  txHash?: string
): string => {
  if (!txHash) return "";

  const explorers: Record<string, Record<string, string>> = {
    polkadot: {
      mainnet: "https://polkadot.subscan.io/extrinsic/",
      westend: "https://westend.subscan.io/extrinsic/",
    },
    solana: {
      "mainnet-beta": "https://explorer.solana.com/tx/",
      testnet: "https://explorer.solana.com/tx/?cluster=testnet",
    },
  };

  // Safe access with optional chaining
  const baseUrl = explorers[chain]?.[network];
  if (!baseUrl) return "";

  return `${baseUrl}${txHash}`;
};

export async function POST(req: NextRequest) {
  console.log("Broadcast transaction API endpoint called");

  try {
    const body = await req.json();
    console.log("Request body:", body);

    const { transactionId } = body;

    if (!transactionId) {
      console.error("Missing transaction ID");
      return NextResponse.json(
        { error: "Missing transaction ID" },
        { status: 400 }
      );
    }

    // Load transaction data
    const txFilePath = path.join(
      process.cwd(),
      "transactions",
      `tx-${transactionId}.json`
    );
    console.log("Looking for transaction file at:", txFilePath);

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
    console.log(
      "Transaction data loaded, has signed transaction:",
      !!txData.signedTransaction
    );

    if (!txData.signedTransaction) {
      console.error("Transaction is not signed yet");
      return NextResponse.json(
        { error: "Transaction is not signed yet" },
        { status: 400 }
      );
    }

    // Prepare the broadcast request
    const broadcastRequest = {
      chain:
        txData.chain || (txData.network === "westend" ? "polkadot" : undefined),
      network: txData.network,
      stakerAddress: txData.stakerAddress,
      signedTransaction: txData.signedTransaction,
    };
    console.log(
      "Broadcast request prepared:",
      JSON.stringify({
        ...broadcastRequest,
        signedTransaction:
          broadcastRequest.signedTransaction.substring(0, 50) + "...", // Truncate for logs
      })
    );

    console.log("P2P API URL:", process.env.P2P_API_URL);
    console.log("P2P API Key exists:", !!process.env.P2P_API_KEY);

    // Make API request to broadcast transaction
    console.log("Making broadcast request to P2P API...");
    try {
      // Add retry logic with exponential backoff
      const MAX_RETRIES = 3;
      const INITIAL_DELAY = 2000; // 2 seconds

      let retryCount = 0;
      let responseData;

      while (retryCount <= MAX_RETRIES) {
        try {
          console.log(`Broadcast attempt ${retryCount + 1}/${MAX_RETRIES + 1}`);

          const response = await fetch(
            `${process.env.P2P_API_URL}/unified/transaction/broadcast`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.P2P_API_KEY}`,
              },
              body: JSON.stringify(broadcastRequest),
            }
          );

          console.log(
            "Broadcast request completed with status:",
            response.status
          );
          const responseText = await response.text();
          console.log("Broadcast response body:", responseText);

          if (!response.ok) {
            // Check if it's a timeout error
            if (response.status === 500 && responseText.includes("timeout")) {
              // If we've reached max retries, throw the error
              if (retryCount === MAX_RETRIES) {
                throw new Error(
                  `Failed to broadcast transaction after ${
                    MAX_RETRIES + 1
                  } attempts: ${response.status} ${responseText}`
                );
              }

              // Otherwise, retry after delay
              const delay = INITIAL_DELAY * Math.pow(2, retryCount);
              console.log(`Timeout detected, retrying in ${delay}ms...`);
              await new Promise((resolve) => setTimeout(resolve, delay));
              retryCount++;
              continue;
            }

            // For other errors, fail immediately
            throw new Error(
              `Failed to broadcast transaction: ${response.status} ${responseText}`
            );
          }

          try {
            responseData = JSON.parse(responseText);
            break; // Success, exit the retry loop
          } catch (e) {
            console.error("Error parsing broadcast response:", e);
            throw new Error("Invalid JSON response from broadcast endpoint");
          }
        } catch (error) {
          // For network errors (not response errors), retry
          if (
            typeof error === "object" &&
            error !== null &&
            "message" in error &&
            typeof error.message === "string" &&
            error.message.includes("fetch failed") &&
            retryCount < MAX_RETRIES
          ) {
            const delay = INITIAL_DELAY * Math.pow(2, retryCount);
            console.log(`Network error, retrying in ${delay}ms...`);
            await new Promise((resolve) => setTimeout(resolve, delay));
            retryCount++;
            continue;
          }
          throw error;
        }
      }

      console.log("Broadcast successful, response data:", responseData);

      // Update transaction data with broadcast result
      txData.broadcastResult = responseData;

      // Extract transaction hash from nested structure if available
      const transactionHash =
        responseData.result?.extraData?.transactionHash ||
        responseData.transactionHash;
      txData.transactionHash = transactionHash;

      // Extract status from nested structure if available
      const status = responseData.result?.status || responseData.status;
      txData.status = status;

      fs.writeFileSync(txFilePath, JSON.stringify(txData, null, 2));
      console.log("Transaction file updated with broadcast result");

      return NextResponse.json({
        success: true,
        transactionId,
        transactionHash: transactionHash,
        status: status,
        explorerUrl: getExplorerUrl(
          txData.chain,
          txData.network,
          transactionHash
        ),
      });
    } catch (broadcastError) {
      console.error("Error during broadcast API call:", broadcastError);
      throw broadcastError;
    }
  } catch (error) {
    console.error("Error in broadcast transaction endpoint:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to broadcast transaction",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
