import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { CHAINS_REQUIRING_UNSTAKE_AMOUNT } from "@/lib/constants";

export async function POST(req: NextRequest) {
  console.log("Create unstake API endpoint called");

  try {
    // Clone the request to avoid reading the body twice
    const clonedReq = req.clone();
    const rawBody = await clonedReq.text();
    console.log("Raw request body:", rawBody);

    // Now parse the original request
    const {
      chain,
      network,
      stakerAddress,
      amount,
      extra,
      transactionId: clientTransactionId,
    } = await req.json();

    console.log("Extracted values from request:");
    console.log("- chain:", chain);
    console.log("- network:", network);
    console.log("- stakerAddress:", stakerAddress);
    console.log("- amount:", amount, "type:", typeof amount);
    console.log("- extra:", extra, "type:", typeof extra);
    console.log("- clientTransactionId:", clientTransactionId);

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

    console.log(
      `Creating unstake request for ${chain}/${network}, staker: ${stakerAddress}${
        amount ? `, amount: ${amount}` : ""
      }`
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

    // Use the proper REST endpoint for unstaking
    const apiUrl = `${apiBaseUrl}/unified/staking/unstake`;
    console.log(`Using API URL: ${apiUrl}`);

    try {
      // Prepare request body based on whether amount is provided
      const requestBody: {
        chain: string;
        network: string;
        stakerAddress: string;
        amount?: string | number;
        extra?: {
          amount: number;
        };
      } = {
        chain,
        network,
        stakerAddress,
      };

      // Check if this chain requires an amount parameter for unstaking
      if (CHAINS_REQUIRING_UNSTAKE_AMOUNT.includes(chain as any)) {
        // First check if extra already exists in the request
        if (extra && typeof extra === "object" && "amount" in extra) {
          // The client already provided the correctly formatted extra object
          requestBody.extra = extra;
          console.log(
            `Using provided extra object with amount:`,
            JSON.stringify(extra)
          );
        }
        // Then check if amount is provided separately
        else if (amount) {
          // Ensure proper handling of string amounts like "0.1"
          let amountValue: number;

          if (typeof amount === "string") {
            amountValue = parseFloat(amount);
            console.log(
              `Parsed string amount "${amount}" to number: ${amountValue}`
            );
          } else if (typeof amount === "number") {
            amountValue = amount;
            console.log(`Amount is already a number: ${amountValue}`);
          } else {
            console.error(
              `Unexpected amount type: ${typeof amount}, value: ${amount}`
            );
            amountValue = 0;
          }

          if (isNaN(amountValue) || amountValue <= 0) {
            console.error(`Invalid amount value after parsing: ${amountValue}`);
            return NextResponse.json(
              { error: "Invalid amount value for unstaking" },
              { status: 400 }
            );
          }

          requestBody.extra = { amount: amountValue };
          console.log(
            `Chain ${chain} requires amount. Using value: ${amountValue}`
          );
        } else {
          console.log(
            `Chain ${chain} requires amount but none was provided. Proceeding without amount.`
          );
          // For chains requiring an amount, do not proceed without an amount
          return NextResponse.json(
            { error: "Amount is required for this chain" },
            { status: 400 }
          );
        }
      } else if (amount) {
        // For other chains that don't require amount but one was provided
        requestBody.amount = amount;
        console.log(`Including amount directly: ${amount}`);
      }

      console.log(
        `Request body before final check:`,
        JSON.stringify(requestBody)
      );

      // Final check to ensure amount is included for chains that require it
      if (CHAINS_REQUIRING_UNSTAKE_AMOUNT.includes(chain as any)) {
        // If we got this far, we should have an amount, but let's double-check
        if (!requestBody.extra || !requestBody.extra.amount) {
          console.error(
            "ERROR: Missing extra.amount for chain that requires it"
          );
          return NextResponse.json(
            {
              error:
                "Amount is required for this chain but was not included in the request",
            },
            { status: 400 }
          );
        }
      }

      console.log(
        `Final request body to P2P API:`,
        JSON.stringify(requestBody)
      );

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      // Check for HTTP errors
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: `HTTP ${response.status}: ${response.statusText}`,
        }));
        console.error("API responded with error:", errorData);
        return NextResponse.json(
          {
            error: "API request failed",
            details: JSON.stringify(errorData),
          },
          { status: response.status }
        );
      }

      // Parse API response
      const responseData = await response.json();
      console.log("API response:", responseData);

      // Check if the response has the expected structure
      if (!responseData.result?.unsignedTransactionData) {
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

        // For convenience in other functions, ensure we have unsignedTransaction in a consistent place
        unsignedTransaction: responseData.result.unsignedTransactionData,

        // Add some metadata for our tracking
        _metadata: {
          createdAt: new Date().toISOString(),
          status: "created",
          originatingRequest: {
            chain,
            network,
            amount: amount || undefined,
            extra: extra || undefined,
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
