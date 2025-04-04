import { NextRequest, NextResponse } from "next/server";
import { readTransactionFile, updateTransactionFile } from "@/lib/serverUtils";

// Explorer URLs by chain and network
const BLOCK_EXPLORERS: Record<string, Record<string, string>> = {
  polkadot: {
    mainnet: "https://polkadot.subscan.io/extrinsic/",
    westend: "https://westend.subscan.io/extrinsic/",
  },
  kusama: {
    mainnet: "https://kusama.subscan.io/extrinsic/",
  },
  // Add more chains as needed
};

export async function POST(req: NextRequest) {
  try {
    const { transactionId } = await req.json();

    console.log(
      `[broadcast] Received request for transaction: ${transactionId}`
    );

    if (!transactionId) {
      return NextResponse.json(
        { error: "Missing transaction ID" },
        { status: 400 }
      );
    }

    console.log(
      `[broadcast] Looking for transaction file with ID: ${transactionId}`
    );
    // Read the transaction data using our utility function
    const txData = readTransactionFile(transactionId);

    if (!txData) {
      console.error(`[broadcast] Transaction not found: ${transactionId}`);
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    console.log(
      `[broadcast] Found transaction data: ${JSON.stringify({
        transactionId: txData.transactionId,
        hasSignedTx: !!txData.signedTransaction,
      })}`
    );

    // Check if transaction has been signed
    if (!txData.signedTransaction) {
      console.error(`[broadcast] Transaction has not been signed yet`);
      return NextResponse.json(
        { error: "Transaction has not been signed yet" },
        { status: 400 }
      );
    }

    // Get chain/network information from the metadata
    let chain, network, stakerAddress;

    if (txData._metadata?.originatingRequest) {
      chain = txData._metadata.originatingRequest.chain.toLowerCase();
      network = txData._metadata.originatingRequest.network.toLowerCase();
    } else {
      // Fallback
      chain = "polkadot";
      network = "mainnet";
    }

    // Get staker address from the original API response or fallback
    stakerAddress =
      txData.stakerAddress || txData.result?.extraData?.stashAccountAddress;
    const signedTransaction = txData.signedTransaction;

    // Get API key from environment variables
    const apiKey = process.env.P2P_API_KEY;

    // Prepare broadcast request
    const broadcastRequest = {
      chain,
      network,
      stakerAddress,
      signedTransaction,
    };

    console.log(`[broadcast] Broadcasting transaction to P2P API`);
    console.log(
      `[broadcast] Request: chain=${chain}, network=${network}, stakerAddress=${stakerAddress}, signedTx length=${signedTransaction.length}`
    );

    try {
      // Make the API request to the P2P API
      const response = await fetch("https://apis.p2p.org/api/v1/rpc", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": apiKey || "",
        },
        body: JSON.stringify({
          method: "unified.transaction.send",
          params: {
            chain,
            network,
            stakerAddress,
            signedTransaction,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error(
          `[broadcast] API responded with error status ${response.status}:`,
          errorData
        );
        return NextResponse.json(
          {
            error: "Failed to broadcast transaction",
            details: errorData
              ? JSON.stringify(errorData)
              : `Status ${response.status}`,
          },
          { status: 500 }
        );
      }

      // Process the response according to P2P API specification
      // Expected format: { "result": { "status": "success", "extraData": {} }, "error": {} }
      const data = await response.json();
      console.log(`[broadcast] Received response:`, data);

      // Extract transaction hash from response based on P2P API format
      let transactionStatus = "pending";
      let transactionHash = null;

      if (data && data.result) {
        transactionStatus = data.result.status || "pending";

        if (data.result.extraData) {
          // Try to get transactionHash from extraData, which might be under "transactionHash" or "hash"
          transactionHash =
            data.result.extraData.transactionHash ||
            data.result.extraData.hash ||
            null;
        }
      }

      console.log(
        `[broadcast] Transaction status: ${transactionStatus}, hash: ${transactionHash}`
      );

      // Generate explorer URL if transaction hash is available
      const explorerUrl = transactionHash
        ? getExplorerUrl(chain, network, transactionHash)
        : null;

      // Update the transaction data with the broadcast results
      // Keep the original structure intact but add our broadcast results
      const updatedTxData = updateTransactionFile(transactionId, {
        broadcastResponse: data,
        transactionHash,
        explorerUrl,
        _metadata: {
          ...txData._metadata,
          status: transactionStatus,
          broadcastedAt: new Date().toISOString(),
        },
      });

      if (!updatedTxData) {
        throw new Error("Failed to update transaction file");
      }

      return NextResponse.json({
        success: true,
        transactionId,
        transactionHash,
        explorerUrl,
        status: transactionStatus,
        message: `Transaction broadcast with status: ${transactionStatus}`,
      });
    } catch (error) {
      console.error(`[broadcast] Error during broadcasting:`, error);
      return NextResponse.json(
        {
          error: "Failed to broadcast transaction",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error(`[broadcast] Error:`, error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to broadcast transaction",
      },
      { status: 500 }
    );
  }
}

function getExplorerUrl(
  chain: string,
  network: string,
  transactionHash: string
): string | null {
  const explorerBaseUrl = BLOCK_EXPLORERS[chain]?.[network];
  return transactionHash && explorerBaseUrl
    ? `${explorerBaseUrl}${transactionHash}`
    : null;
}
