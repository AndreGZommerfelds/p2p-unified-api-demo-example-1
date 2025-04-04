import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

/**
 * Ensures that the transactions directory exists
 * @returns The path to the transactions directory
 */
export function ensureTransactionsDir(): string {
  const transactionsDir = path.join(process.cwd(), "transactions");

  if (!fs.existsSync(transactionsDir)) {
    fs.mkdirSync(transactionsDir, { recursive: true });
  }

  return transactionsDir;
}

/**
 * Creates a new transaction file with the given data
 * @param transactionData The transaction data to save
 * @returns The transaction ID and path to the transaction file
 */
export function createTransactionFile(transactionData: any): {
  transactionId: string;
  transactionPath: string;
} {
  // Validate that we have a transactionId - this is critically important
  if (!transactionData.transactionId) {
    console.error("[serverUtils] ERROR: Missing transactionId in data!");
    // Generate an emergency UUID as fallback
    transactionData.transactionId = uuidv4();
    console.log(
      `[serverUtils] Generated emergency transaction ID: ${transactionData.transactionId}`
    );
  }

  const transactionId = transactionData.transactionId;
  console.log(
    `[serverUtils] Creating transaction file with ID: ${transactionId}`
  );

  const transactionsDir = ensureTransactionsDir();
  const transactionPath = path.join(
    transactionsDir,
    `tx-${transactionId}.json`
  );

  // We don't need to add metadata since it's already provided by the caller
  // Just ensure the transactionId is included
  const fullTransactionData = {
    ...transactionData,
  };

  // Write the transaction file
  fs.writeFileSync(
    transactionPath,
    JSON.stringify(fullTransactionData, null, 2)
  );

  console.log(
    `[serverUtils] Successfully wrote transaction file: ${transactionPath}`
  );

  return { transactionId, transactionPath };
}

/**
 * Reads a transaction file by ID
 * @param transactionId The ID of the transaction to read
 * @returns The transaction data or null if not found
 */
export function readTransactionFile(transactionId: string): any | null {
  if (!transactionId) return null;

  try {
    const transactionsDir = ensureTransactionsDir();
    const transactionPath = path.join(
      transactionsDir,
      `tx-${transactionId}.json`
    );

    if (!fs.existsSync(transactionPath)) {
      return null;
    }

    const fileContent = fs.readFileSync(transactionPath, "utf-8");
    return JSON.parse(fileContent);
  } catch (error) {
    console.error(`Error reading transaction file: ${error}`);
    return null;
  }
}

/**
 * Updates a transaction file with new data
 * @param transactionId The ID of the transaction to update
 * @param updateData The data to update in the transaction
 * @returns The updated transaction data or null if not found
 */
export function updateTransactionFile(
  transactionId: string,
  updateData: any
): any | null {
  if (!transactionId) return null;

  try {
    const transactionData = readTransactionFile(transactionId);
    if (!transactionData) return null;

    const transactionsDir = ensureTransactionsDir();
    const transactionPath = path.join(
      transactionsDir,
      `tx-${transactionId}.json`
    );

    // Merge the existing data with the update data
    const updatedData = {
      ...transactionData,
      ...updateData,
      updatedAt: new Date().toISOString(),
    };

    // Write the updated transaction file
    fs.writeFileSync(transactionPath, JSON.stringify(updatedData, null, 2));

    return updatedData;
  } catch (error) {
    console.error(`Error updating transaction file: ${error}`);
    return null;
  }
}
