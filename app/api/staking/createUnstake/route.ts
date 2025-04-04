import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  console.log("Create unstake API endpoint called");

  try {
    const body = await req.json();
    console.log("Request body:", body);

    const {
      chain,
      network,
      stakerAddress,
      amount,
      transactionId: clientTransactionId,
    } = body;

    // Validate required fields
    if (!chain || !network || !stakerAddress) {
      console.error("Missing required parameters:", {
        chain,
        network,
        stakerAddress,
      });
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Generate our own transaction ID with a specific format to ensure uniqueness
    // Use client-provided ID if available, otherwise generate one
    const transactionId =
      clientTransactionId || `${chain}-${network}-${Date.now()}`;
    console.log(`Using transaction ID: ${transactionId}`);

    console.log("P2P API URL:", process.env.P2P_API_URL);
    console.log("P2P API Key exists:", !!process.env.P2P_API_KEY);

    // Make request to P2P.ORG API
    console.log("Making request to P2P.ORG API...");
    const apiKey = process.env.P2P_API_KEY;
    const apiBaseUrl =
      process.env.P2P_API_URL || "https://api-test-holesky.p2p.org/api/v1";

    // Use the proper REST endpoint for unstaking
    const apiUrl = `${apiBaseUrl}/unified/staking/unstake`;
    console.log(`Using API URL: ${apiUrl}`);

    try {
      // Prepare request body based on whether amount is provided
      const requestBody: any = {
        chain,
        network,
        stakerAddress,
      };

      // Add extra object with amount if provided
      if (amount) {
        requestBody.extra = {
          amount: amount,
        };
        console.log(`Including amount ${amount} in extra object`);
      }

      // Create the request to P2P.ORG API
      console.log("Sending request with payload:", requestBody);

      const apiResponse = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey || ""}`,
        },
        body: JSON.stringify(requestBody),
      });

      // Check for HTTP errors
      if (!apiResponse.ok) {
        const errorData = await apiResponse.json().catch(() => ({
          error: `HTTP ${apiResponse.status}: ${apiResponse.statusText}`,
        }));
        console.error("API responded with error:", errorData);
        return NextResponse.json(
          {
            error: "API request failed",
            details: JSON.stringify(errorData),
          },
          { status: apiResponse.status }
        );
      }

      // Parse API response
      const responseData = await apiResponse.json();
      console.log("API response:", responseData);

      // Check if the response has the expected structure
      if (!responseData.result?.extraData?.unsignedTransaction) {
        console.error("Invalid API response structure:", responseData);
        return NextResponse.json(
          { error: "Missing unsigned transaction in API response" },
          { status: 500 }
        );
      }

      // Save transaction data to file for later use
      const txDir = path.join(process.cwd(), "transactions");
      if (!fs.existsSync(txDir)) {
        fs.mkdirSync(txDir, { recursive: true });
      }

      const transactionFilePath = path.join(txDir, `tx-${transactionId}.json`);

      // Add our tracking metadata
      const transactionData = {
        // First, set our tracking field
        transactionId: transactionId,

        // Then include the entire P2P API response
        ...responseData,

        // Add some metadata for our tracking
        _metadata: {
          createdAt: new Date().toISOString(),
          status: "created",
          originatingRequest: {
            chain,
            network,
            amount: amount || undefined,
          },
        },
      };

      // Write to file
      fs.writeFileSync(
        transactionFilePath,
        JSON.stringify(transactionData, null, 2)
      );
      console.log(`Transaction data saved to ${transactionFilePath}`);

      return NextResponse.json({
        success: true,
        transactionId: transactionId, // Return our generated transaction ID
        chain: responseData.chain || chain,
        network: responseData.network || network,
      });
    } catch (apiError) {
      console.error("Error during P2P API call:", apiError);
      throw apiError;
    }
  } catch (error) {
    console.error("Error in create unstake endpoint:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create unstaking request",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
