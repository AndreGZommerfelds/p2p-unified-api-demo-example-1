import fs from "fs";
import path from "path";

// Types for the staking API
export type StakeRequest = {
  chain: string;
  network: string;
  stakerAddress: string;
  amount: string;
};

export type UnstakeRequest = {
  chain: string;
  network: string;
  stakerAddress: string;
  amount?: string;
  extra?: {
    amount: number;
  };
};

export type StakeResponse = {
  success: boolean;
  transactionId?: string;
  chain?: string;
  network?: string;
  amount?: string;
  message?: string;
  // Add other fields from the API response as needed
};

export type UnstakeResponse = {
  success: boolean;
  transactionId?: string;
  chain?: string;
  network?: string;
  message?: string;
  // Add other fields from the API response as needed
};

export type SignRequest = {
  transactionId: string;
  chain: string;
  network?: string;
};

export type SignResponse = {
  success: boolean;
  transactionId?: string;
  signedTransaction?: string;
  message?: string;
  // Add other fields from the API response as needed
};

export type BroadcastRequest = {
  transactionId: string;
  chain?: string;
  network?: string;
};

export type BroadcastResponse = {
  success: boolean;
  transactionId?: string;
  transactionHash?: string;
  status?: string;
  explorerUrl?: string;
  message?: string;
  // Add support for the nested result structure from P2P API
  result?: {
    status?: string;
    extraData?: {
      transactionHash?: string;
      network?: string;
      blockHash?: string;
      blockId?: number;
      extrinsicId?: number;
      signerAccount?: string;
      data?: any;
      createdAt?: string;
    };
  };
  // Add other fields from the API response as needed
};

/**
 * Creates a staking request using our API proxy
 */
export async function createStakingRequest(
  request: StakeRequest
): Promise<StakeResponse> {
  try {
    console.log("[p2pApiClient] Sending stake request to API:", request);

    if (
      !request.chain ||
      !request.network ||
      !request.stakerAddress ||
      !request.amount
    ) {
      throw new Error(
        "Missing required parameters: chain, network, stakerAddress, amount"
      );
    }

    const response = await fetch("/api/staking/createStake", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      let errorMessage = `HTTP error ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch (e) {
        errorMessage = await response.text();
      }

      throw new Error(`Failed to create staking request: ${errorMessage}`);
    }

    const responseData = await response.json();
    console.log("[p2pApiClient] Received stake response:", responseData);

    if (responseData.success !== true) {
      console.error(
        "[p2pApiClient] Invalid API response - success flag missing:",
        responseData
      );
      throw new Error(
        `API response indicates failure: ${JSON.stringify(responseData)}`
      );
    }

    return responseData;
  } catch (error) {
    console.error("[p2pApiClient] Error creating staking request:", error);
    throw error;
  }
}

/**
 * Creates an unstaking request using our API proxy
 */
export async function createUnstakingRequest(
  request: UnstakeRequest
): Promise<UnstakeResponse> {
  try {
    console.log(
      "[p2pApiClient] Sending unstake request to API:",
      JSON.stringify(request)
    );
    console.log("[p2pApiClient] Specific fields check:");
    console.log("- chain:", request.chain);
    console.log("- network:", request.network);
    console.log("- stakerAddress:", request.stakerAddress);
    console.log("- amount:", request.amount);
    console.log(
      "- extra:",
      request.extra,
      request.extra ? JSON.stringify(request.extra) : "undefined"
    );

    if (!request.chain || !request.network || !request.stakerAddress) {
      throw new Error(
        "Missing required parameters: chain, network, stakerAddress"
      );
    }

    // Debug the request we're about to send
    const requestBody = JSON.stringify(request);
    console.log("[p2pApiClient] Request body being sent:", requestBody);

    const response = await fetch("/api/staking/createUnstake", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: requestBody,
    });

    if (!response.ok) {
      let errorMessage = `HTTP error ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch (e) {
        errorMessage = await response.text();
      }

      throw new Error(`Failed to create unstaking request: ${errorMessage}`);
    }

    const responseData = await response.json();
    console.log("[p2pApiClient] Received unstaking response:", responseData);

    if (responseData.success !== true) {
      console.error(
        "[p2pApiClient] Invalid API response - success flag missing:",
        responseData
      );
      throw new Error(
        `API response indicates failure: ${JSON.stringify(responseData)}`
      );
    }

    return responseData;
  } catch (error) {
    console.error("[p2pApiClient] Error creating unstaking request:", error);
    throw error;
  }
}

/**
 * Signs a transaction using our API proxy
 */
export async function signTransaction(
  request: SignRequest
): Promise<SignResponse> {
  try {
    console.log("[p2pApiClient] Sending sign request to API:", request);

    if (!request.transactionId) {
      throw new Error("Missing required parameter: transactionId");
    }

    const response = await fetch("/api/staking/signTransaction", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      let errorMessage = `HTTP error ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch (e) {
        errorMessage = await response.text();
      }

      throw new Error(`Failed to sign transaction: ${errorMessage}`);
    }

    const responseData = await response.json();
    console.log("[p2pApiClient] Received sign response:", responseData);

    if (responseData.success !== true) {
      console.error(
        "[p2pApiClient] Invalid API response - success flag missing:",
        responseData
      );
      throw new Error(
        `API response indicates failure: ${JSON.stringify(responseData)}`
      );
    }

    return responseData;
  } catch (error) {
    console.error("[p2pApiClient] Error signing transaction:", error);
    throw error;
  }
}

/**
 * Broadcasts a signed transaction using our API proxy
 */
export async function broadcastTransaction(
  request: BroadcastRequest
): Promise<BroadcastResponse> {
  try {
    console.log("[p2pApiClient] Sending broadcast request to API:", request);

    if (!request.transactionId) {
      throw new Error("Missing required parameter: transactionId");
    }

    const response = await fetch("/api/staking/broadcastTransaction", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      let errorMessage = `HTTP error ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch (e) {
        errorMessage = await response.text();
      }

      throw new Error(`Failed to broadcast transaction: ${errorMessage}`);
    }

    const responseData = await response.json();
    console.log("[p2pApiClient] Received broadcast response:", responseData);

    if (responseData.success !== true) {
      console.error(
        "[p2pApiClient] Invalid API response - success flag missing:",
        responseData
      );
      throw new Error(
        `API response indicates failure: ${JSON.stringify(responseData)}`
      );
    }

    // Extract transaction hash from nested structure if needed
    if (
      responseData.result?.extraData?.transactionHash &&
      !responseData.transactionHash
    ) {
      responseData.transactionHash =
        responseData.result.extraData.transactionHash;
      console.log(
        "[p2pApiClient] Extracted transaction hash from nested structure:",
        responseData.transactionHash
      );
    }

    // Extract status from nested structure if needed
    if (responseData.result?.status && !responseData.status) {
      responseData.status = responseData.result.status;
      console.log(
        "[p2pApiClient] Extracted status from nested structure:",
        responseData.status
      );
    }

    return responseData;
  } catch (error) {
    console.error("[p2pApiClient] Error broadcasting transaction:", error);
    throw error;
  }
}
