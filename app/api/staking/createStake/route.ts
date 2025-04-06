import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  console.log("Create stake API endpoint called");

  try {
    const {
      chain,
      network,
      stakerAddress,
      amount,
      transactionId: clientTransactionId,
    } = await req.json();

    // Validate required fields
    if (!chain || !network || !stakerAddress || !amount) {
      console.error("Missing required parameters:", {
        chain,
        network,
        stakerAddress,
        amount,
      });
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    console.log(
      `Creating stake request for ${chain}/${network}, amount: ${amount}, staker: ${stakerAddress}`
    );

    // Generate our own transaction ID with a specific format to ensure uniqueness
    const transactionId =
      clientTransactionId || `${chain}-${network}-${Date.now()}`;
    console.log(`Using transaction ID: ${transactionId}`);

    console.log("P2P API URL:", process.env.P2P_API_URL);
    console.log("P2P API Key exists:", !!process.env.P2P_API_KEY);

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
    console.log(`Using API URL: ${apiUrl}`);

    try {
      // Create the request to P2P.ORG API
      console.log("Sending request with payload:", {
        chain,
        network,
        stakerAddress,
        amount,
      });

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

      console.log("P2P API request completed with status:", response.status);
      const responseText = await response.text();
      console.log("P2P API response body:", responseText);

      if (!response.ok) {
        throw new Error(
          `API request failed: ${response.status} ${responseText}`
        );
      }

      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        console.error("Error parsing P2P API response:", e);
        throw new Error("Invalid JSON response from P2P API");
      }

      console.log("P2P API request successful, response data:", responseData);

      // Ensure the directory exists
      const dirPath = path.join(process.cwd(), "transactions");
      if (!fs.existsSync(dirPath)) {
        console.log("Creating transactions directory");
        fs.mkdirSync(dirPath, { recursive: true });
      }

      // Add our transaction ID to the data
      const dataToSave = {
        transactionId, // Add our transaction ID to the saved data
        ...responseData,
        stakerAddress,
        chain, // Explicitly add the chain parameter
        network, // Ensure network is also explicitly added
      };

      // Save transaction data to a file using our transaction ID
      const filePath = path.join(dirPath, `tx-${transactionId}.json`);
      console.log("Saving transaction data to:", filePath);

      fs.writeFileSync(filePath, JSON.stringify(dataToSave, null, 2));
      console.log("Transaction data saved successfully");

      return NextResponse.json({
        success: true,
        transactionId: transactionId, // Return our generated transaction ID
        chain: responseData.chain || chain,
        network: responseData.network || network,
        amount: responseData.amount || amount,
      });
    } catch (apiError) {
      console.error("Error during P2P API call:", apiError);
      throw apiError;
    }
  } catch (error) {
    console.error("Error in create stake endpoint:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create staking request",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
