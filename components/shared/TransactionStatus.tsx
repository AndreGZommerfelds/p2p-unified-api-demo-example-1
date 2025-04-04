"use client";

import { Button } from "@/components/ui/button";
import { EXPLORERS } from "@/lib/constants";
import { useState } from "react";
import { AlertTriangle } from "lucide-react";

type TransactionState =
  | "created"
  | "signing"
  | "broadcasting"
  | "completed"
  | "error";

interface TransactionStatusProps {
  transactionId: string;
  chain: string;
  network: string;
  amount?: string;
  transactionHash?: string;
  explorerUrl?: string;
  status?: string;
  currentState: TransactionState;
  error?: string;
  onSignAndBroadcast: () => void;
  onClose: () => void;
}

export function TransactionStatus({
  transactionId,
  chain,
  network,
  amount,
  transactionHash,
  explorerUrl,
  status,
  currentState,
  error,
  onSignAndBroadcast,
  onClose,
}: TransactionStatusProps) {
  const tokenSymbol = chain === "polkadot" ? "DOT" : "SOL";

  // Add debug handlers that log before calling the actual handlers
  const handleSignAndBroadcastClick = () => {
    console.log("TransactionStatus: Sign & Broadcast button clicked");
    onSignAndBroadcast();
  };

  const handleCloseClick = () => {
    console.log("TransactionStatus: Close button clicked");
    onClose();
  };

  const renderState = () => {
    switch (currentState) {
      case "created":
        return (
          <div className="space-y-6">
            <div className="space-y-2 text-center">
              <h3 className="text-xl font-bold">Transaction Created</h3>
              <p className="text-muted-foreground">
                {amount
                  ? `Your staking request for ${amount} ${tokenSymbol} has been created.`
                  : `Your unstaking request has been created.`}{" "}
                The transaction needs to be signed and broadcasted to the
                network.
              </p>
            </div>

            <div className="p-3 bg-secondary/20 rounded-lg space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Chain</span>
                <span className="capitalize font-medium">{chain}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Network</span>
                <span className="capitalize font-medium">{network}</span>
              </div>
              {amount && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-medium">
                    {amount} {tokenSymbol}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Transaction ID</span>
                <span className="font-mono text-xs">{transactionId}</span>
              </div>
            </div>

            <Button className="w-full" onClick={handleSignAndBroadcastClick}>
              Sign & Broadcast Transaction
            </Button>
          </div>
        );

      case "signing":
        return (
          <div className="space-y-6">
            <div className="space-y-2 text-center">
              <h3 className="text-xl font-bold">Signing Transaction</h3>
              <p className="text-muted-foreground">
                Your transaction is being signed. Please wait a moment...
              </p>
              <div className="flex justify-center mt-4">
                <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
              </div>
            </div>
          </div>
        );

      case "broadcasting":
        return (
          <div className="space-y-6">
            <div className="space-y-2 text-center">
              <h3 className="text-xl font-bold">Broadcasting Transaction</h3>
              <p className="text-muted-foreground">
                Your signed transaction is being broadcasted to the network.
                This may take a moment...
              </p>
              <div className="flex justify-center mt-4">
                <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
              </div>
            </div>
          </div>
        );

      case "completed":
        // Use provided explorerUrl if available, otherwise try to generate it
        const txExplorerUrl =
          explorerUrl ||
          (transactionHash
            ? getExplorerUrl(chain, network, transactionHash)
            : "");

        // Determine status color based on status value
        const getStatusColor = (status: string) => {
          switch (status?.toLowerCase()) {
            case "success":
            case "completed":
              return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
            case "pending":
            case "processing":
              return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
            case "failed":
            case "error":
              return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
            default:
              return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
          }
        };

        return (
          <div className="space-y-6">
            <div className="space-y-2 text-center">
              <h3 className="text-xl font-bold">Transaction Broadcasted</h3>
              <p className="text-muted-foreground">
                {amount
                  ? `Your staking transaction for ${amount} ${tokenSymbol} has been sent to the network.`
                  : `Your unstaking transaction has been sent to the network.`}
              </p>
              {status && (
                <div
                  className={`mt-2 px-3 py-1 ${getStatusColor(
                    status
                  )} rounded-full inline-block`}
                >
                  Status: {status}
                </div>
              )}
            </div>

            {transactionHash && (
              <div className="mt-4 p-3 bg-secondary/30 rounded-lg text-center">
                <div className="text-sm text-muted-foreground mb-1">
                  Transaction Hash
                </div>
                <div className="font-mono text-xs break-all">
                  {transactionHash}
                </div>
              </div>
            )}

            <div className="p-3 bg-secondary/20 rounded-lg space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Chain</span>
                <span className="capitalize font-medium">{chain}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Network</span>
                <span className="capitalize font-medium">{network}</span>
              </div>
              {amount && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-medium">
                    {amount} {tokenSymbol}
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3">
              {txExplorerUrl && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => window.open(txExplorerUrl, "_blank")}
                >
                  View in Explorer
                </Button>
              )}
              <Button className="w-full" onClick={handleCloseClick}>
                Close
              </Button>
            </div>
          </div>
        );

      case "error":
        let errorMessage = "There was an error processing your transaction.";
        if (error) {
          // Make timeout errors more user-friendly
          if (error.includes("timeout") || error.includes("timed out")) {
            errorMessage =
              "The transaction is taking longer than expected. The blockchain network might be congested. Your transaction may still be processed, please check back later.";
          } else {
            errorMessage = error;
          }
        }

        return (
          <div className="flex flex-col items-center gap-4 text-center">
            <AlertTriangle
              className="h-12 w-12 text-destructive"
              aria-hidden="true"
            />
            <h3 className="text-xl font-bold">Transaction Failed</h3>
            <div className="text-muted-foreground mt-1 max-w-lg">
              {errorMessage}
            </div>
            <Button
              className="w-full"
              variant="outline"
              onClick={handleCloseClick}
            >
              Try Again
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  /**
   * Get the blockchain explorer URL for a given chain, network, and transaction hash
   */
  const getExplorerUrl = (
    chain: string,
    network: string,
    txHash: string
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

  return <div className="space-y-4">{renderState()}</div>;
}
