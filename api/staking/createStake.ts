import { NextRequest, NextResponse } from "next/server";
import { createTransactionFile } from "@/lib/serverUtils";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  try {
    const { chain, network, stakerAddress, amount } = await req.json();

    // Validate required fields
    if (!chain || !network || !stakerAddress || !amount) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    console.log(
      `[createStake] Creating stake request for ${chain}/${network}, amount: ${amount}, staker: ${stakerAddress}`
    );

    // Generate our own transaction ID with a specific format to ensure uniqueness
    // P2P.org API doesn't provide a transaction ID, so we create our own
    const transactionId = `${chain}-${network}-${Date.now()}`;
    console.log(`[createStake] Using transaction ID: ${transactionId}`);

    // Make request to P2P.ORG API
    const apiKey = process.env.P2P_API_KEY;
    if (!apiKey) {
      throw new Error(
        "Required environment variable P2P_API_KEY is not defined"
      );
    }

    const apiBaseUrl = process.env.P2P_API_URL;
    if (!apiBaseUrl) {
      throw new Error(
        "Required environment variable P2P_API_URL is not defined"
      );
    }

    // Use the proper REST endpoint for staking
    const apiUrl = `${apiBaseUrl}/unified/staking/stake`;
    console.log(`[createStake] Using API URL: ${apiUrl}`);

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        chain,
        network,
        stakerAddress,
        amount: parseFloat(amount),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error(
        `[createStake] API error:`,
        errorData || response.statusText
      );
      return NextResponse.json(
        {
          error: "Failed to create staking request",
          details: errorData
            ? JSON.stringify(errorData)
            : `Status ${response.status}`,
        },
        { status: response.status }
      );
    }

    const responseData = await response.json();
    console.log(
      "[createStake] API response:",
      JSON.stringify(responseData, null, 2)
    );

    // Check if the response has the expected structure
    // The P2P.ORG API response structure is { error: null, result: {...}, stakerAddress: "..." }
    if (!responseData.result?.extraData?.unsignedTransaction) {
      console.error(
        "[createStake] Invalid API response structure:",
        responseData
      );
      return NextResponse.json(
        { error: "Missing unsigned transaction in API response" },
        { status: 500 }
      );
    }

    // Prepare transaction data - exactly following the P2P.ORG API response structure
    // but adding our own transactionId field to ensure we can track it
    const transactionData = {
      // First, set our tracking field
      transactionId: transactionId,

      // Then include the entire P2P API response
      error: responseData.error,
      result: responseData.result,
      stakerAddress: responseData.stakerAddress || stakerAddress,

      // Add some metadata for our tracking
      _metadata: {
        createdAt: new Date().toISOString(),
        status: "created",
        originatingRequest: {
          chain,
          network,
          amount,
        },
      },
    };

    // Create transaction file using our utility function - specify the ID explicitly
    const { transactionPath } = createTransactionFile(transactionData);

    console.log(
      `[createStake] Created transaction file: ${transactionPath} with ID: ${transactionId}`
    );

    // Return success response with the transaction ID
    return NextResponse.json({
      success: true,
      transactionId: transactionId,
      chain,
      network,
      amount: responseData.result?.amount || amount,
    });
  } catch (error) {
    console.error("[createStake] Error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create staking request",
      },
      { status: 500 }
    );
  }
}
