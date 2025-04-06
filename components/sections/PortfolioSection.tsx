"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DUMMY_BALANCES,
  initializeDummyBalances,
  CHAINS_REQUIRING_UNSTAKE_AMOUNT,
  type Chain,
} from "@/lib/constants";
import { useStaking } from "@/lib/store";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StakingForm } from "@/components/sections/StakingForm";
import { UnstakingForm } from "@/components/sections/UnstakingForm";
import { TransactionStatus } from "@/components/shared/TransactionStatus";
import {
  StakeRequest,
  createStakingRequest,
  signTransaction,
  broadcastTransaction,
  UnstakeRequest,
  createUnstakingRequest,
} from "@/lib/p2pApiClient";

// Transaction state type
type TransactionState =
  | "form"
  | "created"
  | "signing"
  | "broadcasting"
  | "completed"
  | "error";

export function PortfolioSection() {
  const { selectedChain, selectedNetwork, selectedWalletAddress } =
    useStaking();
  const [isStakingDialogOpen, setIsStakingDialogOpen] = useState(false);
  const [isUnstakingDialogOpen, setIsUnstakingDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [transactionState, setTransactionState] =
    useState<TransactionState>("form");
  const [transactionData, setTransactionData] = useState<{
    transactionId?: string;
    amount?: string;
    transactionHash?: string;
    explorerUrl?: string;
    status?: string;
    error?: string;
  }>({});

  // Debug transaction state
  useEffect(() => {
    console.log("Transaction state changed:", transactionState);
    console.log("Transaction data:", transactionData);
  }, [transactionState, transactionData]);

  // Add this useEffect to initialize the balances:
  useEffect(() => {
    // Initialize the dummy balances with addresses from environment variables
    async function loadBalances() {
      try {
        await initializeDummyBalances();
        // Force a re-render since we're updating a static object
        setIsLoading(false);
      } catch (error) {
        console.error("Error initializing dummy balances:", error);
      }
    }

    loadBalances();
  }, []);

  if (!selectedChain || !selectedWalletAddress || !selectedNetwork) return null;

  // And then update the balance access with a fallback
  const balance = DUMMY_BALANCES[selectedChain][selectedWalletAddress] || {
    total: 0,
    available: 0,
    staked: 0,
    unstaking: 0,
    rewards: 0,
  };

  // Get the appropriate token symbol for the selected chain
  const getTokenSymbol = (chain: string) => {
    switch (chain) {
      case "polkadot":
        return "DOT";
      case "celestia":
        return "TIA";
      case "solana":
        return "SOL";
      default:
        return "TOKENS";
    }
  };

  const tokenSymbol = getTokenSymbol(selectedChain);

  const handleStake = async (amount: string) => {
    try {
      setIsLoading(true);
      console.log("Starting stake process");

      // Create stake request
      const stakeRequest: StakeRequest = {
        chain: selectedChain,
        network: selectedNetwork,
        stakerAddress: selectedWalletAddress,
        amount: amount,
      };

      console.log("Creating stake request:", stakeRequest);

      // Make API request using our client
      const response = await createStakingRequest(stakeRequest);
      console.log("Stake response:", response);

      // If the response doesn't include a transactionId, we need an identifier for the UI
      // We'll create one from the chain, address, and a timestamp
      const transactionId =
        response.transactionId ||
        `${selectedChain}-${selectedNetwork}-${Date.now()}`;

      console.log("Using transaction ID:", transactionId);

      // Save transaction data and update state
      setTransactionData({
        transactionId: transactionId,
        amount: amount,
      });
      setTransactionState("created");
    } catch (error) {
      console.error("Error creating staking request:", error);
      let errorMessage = "Failed to create staking request";

      if (error instanceof Error) {
        errorMessage = error.message;
      }

      // Include more details for troubleshooting
      console.error("Detailed error:", {
        error,
        chain: selectedChain,
        network: selectedNetwork,
        address: selectedWalletAddress,
      });

      setTransactionData({
        error: errorMessage,
      });
      setTransactionState("error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnstake = async (amount: string) => {
    try {
      setIsLoading(true);
      console.log("Starting unstake process");
      console.log(
        "Amount parameter received:",
        amount,
        "type:",
        typeof amount,
        "value stringified:",
        JSON.stringify(amount)
      );

      // Debugging - explicitly check the amount to see if it's coming through correctly
      if (!amount) {
        console.error("CRITICAL ERROR: Amount is empty or undefined");
      } else if (amount === "") {
        console.error("CRITICAL ERROR: Amount is an empty string");
      } else if (amount === "0.1") {
        console.log("Amount is exactly 0.1 as expected");
      }

      // Create unstake request
      const unstakeRequest: UnstakeRequest = {
        chain: selectedChain,
        network: selectedNetwork,
        stakerAddress: selectedWalletAddress,
      };

      // For Celestia and other chains requiring amount, add it to the request
      // Important: Check specifically if amount is valid rather than just non-empty
      const isValidAmount =
        amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0;
      console.log(
        "Is valid amount:",
        isValidAmount,
        "parseFloat result:",
        parseFloat(amount)
      );

      if (isValidAmount) {
        const numericAmount = parseFloat(amount);
        console.log(`Valid numeric amount: ${numericAmount}`);

        if (CHAINS_REQUIRING_UNSTAKE_AMOUNT.includes(selectedChain as Chain)) {
          // For chains requiring an amount, it should be a number inside an extra object
          unstakeRequest.extra = { amount: numericAmount };
          console.log(
            `Including amount ${numericAmount} in extra object:`,
            JSON.stringify(unstakeRequest.extra) // Make sure it's being stringified correctly
          );

          // Debug: check if extra is correctly added to the request
          console.log("Full request object: ", JSON.stringify(unstakeRequest));
        } else {
          // For other chains, keep as-is
          unstakeRequest.amount = amount;
          console.log(`Including amount: ${amount} in unstake request`);
        }
      } else {
        console.warn(
          `Invalid or missing amount: "${amount}". This may cause validation errors for chains requiring amounts.`
        );
      }

      console.log("Final unstake request:", JSON.stringify(unstakeRequest));

      // Make sure the API can see every field in the request
      console.log("Making request to createUnstakingRequest with data:", {
        chain: unstakeRequest.chain,
        network: unstakeRequest.network,
        stakerAddress: unstakeRequest.stakerAddress,
        extra: unstakeRequest.extra,
        amount: unstakeRequest.amount,
      });

      // Make API request using our client
      const response = await createUnstakingRequest(unstakeRequest);
      console.log("Unstake response:", response);

      // If the response doesn't include a transactionId, we need an identifier for the UI
      // We'll create one from the chain, address, and a timestamp
      const transactionId =
        response.transactionId ||
        `${selectedChain}-${selectedNetwork}-${Date.now()}`;

      console.log("Using transaction ID:", transactionId);

      // Save transaction data and update state
      setTransactionData({
        transactionId: transactionId,
        amount: amount,
      });
      setTransactionState("created");
    } catch (error) {
      console.error("Error creating unstaking request:", error);
      let errorMessage = "Failed to create unstaking request";

      if (error instanceof Error) {
        errorMessage = error.message;
      }

      // Include more details for troubleshooting
      console.error("Detailed error:", {
        error,
        chain: selectedChain,
        network: selectedNetwork,
        address: selectedWalletAddress,
      });

      setTransactionData({
        error: errorMessage,
      });
      setTransactionState("error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignAndBroadcast = async () => {
    if (!transactionData.transactionId) {
      console.error("No transaction ID found");
      return;
    }

    setTransactionData((prevData) => ({
      ...prevData,
      error: undefined,
    }));

    try {
      console.log("Sign & Broadcast button clicked");

      // Sign transaction
      setTransactionState("signing");
      const signResponse = await signTransaction({
        transactionId: transactionData.transactionId,
        chain: selectedChain,
        network: selectedNetwork,
      });

      if (!signResponse.success) {
        throw new Error(signResponse.message || "Signing failed");
      }

      // Start broadcasting process
      setTransactionState("broadcasting");
      console.log(
        "Starting broadcast process for transaction:",
        transactionData.transactionId
      );

      // We use a polling mechanism in case of timeout
      const MAX_ATTEMPTS = 3;
      const POLLING_INTERVAL = 5000; // 5 seconds
      let attempts = 0;
      let broadcastSuccess = false;
      let broadcastResponse;

      while (attempts < MAX_ATTEMPTS && !broadcastSuccess) {
        try {
          // Call our broadcast transaction API
          broadcastResponse = await broadcastTransaction({
            transactionId: transactionData.transactionId,
            chain: selectedChain,
            network: selectedNetwork,
          });

          console.log("Broadcast response:", broadcastResponse);
          broadcastSuccess = broadcastResponse.success;
          break; // Exit the loop if successful
        } catch (broadcastError: any) {
          console.error("Broadcast attempt failed:", broadcastError);
          attempts++;

          // If it's a timeout error, and we have attempts left, wait and try checking status
          if (
            attempts < MAX_ATTEMPTS &&
            broadcastError.message?.includes("timeout")
          ) {
            console.log(
              `Broadcast timeout, will check status in ${POLLING_INTERVAL}ms (attempt ${attempts}/${MAX_ATTEMPTS})`
            );
            // Wait before checking transaction status
            await new Promise((resolve) =>
              setTimeout(resolve, POLLING_INTERVAL)
            );

            // Instead of retrying the broadcast, we could implement a transaction status check here
            // This would require an additional API endpoint to check transaction status
            // For now, we'll just retry the broadcast
          } else if (attempts >= MAX_ATTEMPTS) {
            // We've exhausted all attempts
            throw new Error(
              broadcastError.message ||
                "Broadcasting failed after multiple attempts"
            );
          } else {
            // Other error type, just throw
            throw broadcastError;
          }
        }
      }

      if (!broadcastSuccess || !broadcastResponse) {
        throw new Error("Broadcasting failed after multiple attempts");
      }

      // Extract transaction hash from deeply nested structure if needed
      const transactionHash =
        broadcastResponse.transactionHash ||
        broadcastResponse.result?.extraData?.transactionHash;

      if (!transactionHash) {
        console.warn("No transaction hash found in broadcast response");
      } else {
        console.log("Transaction hash:", transactionHash);
      }

      // Transaction was successful!
      setTransactionData((prevData) => ({
        ...prevData,
        transactionHash: transactionHash,
        status: broadcastResponse.status || broadcastResponse.result?.status,
        explorerUrl: broadcastResponse.explorerUrl,
      }));
      setTransactionState("completed");
    } catch (error: any) {
      console.error("Error in sign and broadcast process:", error);
      setTransactionData((prevData) => ({
        ...prevData,
        error: error.message || "Unknown error",
      }));
      setTransactionState("error");
    }
  };

  const resetStakingFlow = () => {
    setTransactionState("form");
    setTransactionData({});
  };

  const closeStakingDialog = () => {
    setIsStakingDialogOpen(false);
    // Reset after animation completes
    setTimeout(() => {
      resetStakingFlow();
    }, 300);
  };

  const closeUnstakingDialog = () => {
    setIsUnstakingDialogOpen(false);
    // Reset after animation completes
    setTimeout(() => {
      resetStakingFlow();
    }, 300);
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Portfolio</h2>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="p-6 bg-white border rounded-xl shadow-sm dark:bg-gray-950 dark:border-gray-800">
          <div className="flex justify-between mb-4">
            <h3 className="font-semibold">Available</h3>
            <span className="font-mono">
              {balance.available} {tokenSymbol}
            </span>
          </div>
          <Dialog
            open={isStakingDialogOpen}
            onOpenChange={setIsStakingDialogOpen}
          >
            <DialogTrigger asChild>
              <Button className="w-full">Stake</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              {transactionState === "form" ? (
                <StakingForm onStake={handleStake} isLoading={isLoading} />
              ) : (
                <TransactionStatus
                  transactionId={transactionData.transactionId || ""}
                  chain={selectedChain}
                  network={selectedNetwork}
                  amount={transactionData.amount || ""}
                  transactionHash={transactionData.transactionHash}
                  explorerUrl={transactionData.explorerUrl}
                  status={transactionData.status}
                  currentState={transactionState}
                  error={transactionData.error}
                  onSignAndBroadcast={handleSignAndBroadcast}
                  onClose={closeStakingDialog}
                />
              )}
            </DialogContent>
          </Dialog>
        </div>

        <div className="p-6 bg-white border rounded-xl shadow-sm dark:bg-gray-950 dark:border-gray-800">
          <div className="flex justify-between mb-4">
            <h3 className="font-semibold">Staked</h3>
            <span className="font-mono">
              {balance.staked} {tokenSymbol}
            </span>
          </div>
          <Dialog
            open={isUnstakingDialogOpen}
            onOpenChange={setIsUnstakingDialogOpen}
          >
            <DialogTrigger asChild>
              <Button
                className="w-full"
                variant="outline"
                disabled={balance.staked <= 0}
              >
                Unstake
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              {transactionState === "form" ? (
                <UnstakingForm
                  onUnstake={handleUnstake}
                  isLoading={isLoading}
                />
              ) : (
                <TransactionStatus
                  transactionId={transactionData.transactionId || ""}
                  chain={selectedChain}
                  network={selectedNetwork}
                  amount={transactionData.amount || ""}
                  transactionHash={transactionData.transactionHash}
                  explorerUrl={transactionData.explorerUrl}
                  status={transactionData.status}
                  currentState={transactionState}
                  error={transactionData.error}
                  onSignAndBroadcast={handleSignAndBroadcast}
                  onClose={closeUnstakingDialog}
                />
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
