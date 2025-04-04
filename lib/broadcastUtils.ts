import { readTransactionFile, updateTransactionFile } from "@/lib/serverUtils";

/**
 * Get explorer URL based on chain, network and transaction hash
 */
export function getExplorerUrl(
  chain: string,
  network: string,
  transactionHash: string
): string | null {
  // Define explorer URLs for different chains and networks
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

  // Try to get the explorer URL
  try {
    return BLOCK_EXPLORERS[chain.toLowerCase()]?.[network.toLowerCase()]
      ? `${
          BLOCK_EXPLORERS[chain.toLowerCase()][network.toLowerCase()]
        }${transactionHash}`
      : null;
  } catch (error) {
    console.warn(`Could not generate explorer URL for ${chain}/${network}`);
    return null;
  }
}

/**
 * Broadcast a transaction to the P2P.org API
 * This is a shared utility used by both staking and unstaking flows
 */
export async function broadcastTransactionToAPI(transactionId: string) {
  console.log(`[broadcastUtils] Broadcasting transaction: ${transactionId}`);

  if (!transactionId) {
    throw new Error("Missing transaction ID");
  }

  // Read the transaction data using our utility function
  const txData = readTransactionFile(transactionId);

  if (!txData) {
    throw new Error(`Transaction not found: ${transactionId}`);
  }

  console.log(
    `[broadcastUtils] Found transaction data: ${JSON.stringify({
      transactionId: txData.transactionId,
      hasSignedTx: !!txData.signedTransaction,
    })}`
  );

  // Check if transaction has been signed
  if (!txData.signedTransaction) {
    throw new Error("Transaction is not signed yet");
  }

  // Get chain/network information from the metadata
  let chain, network, stakerAddress;

  if (txData._metadata?.originatingRequest) {
    chain = txData._metadata.originatingRequest.chain.toLowerCase();
    network = txData._metadata.originatingRequest.network.toLowerCase();
  } else {
    // Fallback
    chain = txData.chain || "polkadot";
    network = txData.network || "mainnet";
  }

  // Get staker address from the original API response or fallback
  stakerAddress =
    txData.stakerAddress || txData.result?.extraData?.stashAccountAddress;
  const signedTransaction = txData.signedTransaction;

  // Get API key from environment variables
  const apiKey = process.env.P2P_API_KEY;
  const apiBaseUrl =
    process.env.P2P_API_URL || "https://api-test-holesky.p2p.org/api/v1";

  // Use the proper REST endpoint for transaction broadcasting
  const apiUrl = `${apiBaseUrl}/unified/transaction/broadcast`;
  console.log(`[broadcastUtils] Using API URL: ${apiUrl}`);

  // Prepare broadcast request
  const broadcastRequest = {
    chain,
    network,
    stakerAddress,
    signedTransaction,
  };

  console.log(`[broadcastUtils] Broadcasting transaction to P2P API`);
  console.log(
    `[broadcastUtils] Request: chain=${chain}, network=${network}, stakerAddress=${stakerAddress}, signedTx length=${signedTransaction.length}`
  );

  // Make the API request to the P2P API
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey || ""}`,
    },
    body: JSON.stringify(broadcastRequest),
  });

  const responseText = await response.text();
  console.log("[broadcastUtils] Broadcast response:", responseText);

  if (!response.ok) {
    throw new Error(
      `Failed to broadcast transaction: ${response.status} ${responseText}`
    );
  }

  // Parse the response
  let responseData;
  try {
    responseData = JSON.parse(responseText);
  } catch (error) {
    throw new Error(
      `Invalid JSON response from broadcast endpoint: ${responseText}`
    );
  }

  // Extract transaction hash from nested structure if available
  const transactionHash =
    responseData.result?.extraData?.transactionHash ||
    responseData.transactionHash;

  // Extract status from nested structure if available
  const status =
    responseData.result?.status || responseData.status || "pending";

  // Update transaction data with broadcast result
  const updatedTxData = updateTransactionFile(transactionId, {
    broadcastResponse: responseData,
    transactionHash,
    status,
    explorerUrl: getExplorerUrl(chain, network, transactionHash),
    _metadata: {
      ...(txData._metadata || {}),
      status,
      broadcastedAt: new Date().toISOString(),
    },
  });

  if (!updatedTxData) {
    throw new Error("Failed to update transaction file");
  }

  return {
    success: true,
    transactionId,
    transactionHash,
    status,
    explorerUrl: getExplorerUrl(chain, network, transactionHash),
  };
}
