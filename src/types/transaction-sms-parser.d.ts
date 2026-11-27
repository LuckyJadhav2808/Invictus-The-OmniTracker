declare module "transaction-sms-parser" {
  export interface TransactionSmsInfo {
    account: {
      type: "CARD" | "WALLET" | "ACCOUNT" | null;
      number: string | null;
      name: string | null;
    };
    balance: {
      available: string | null;
      outstanding: string | null;
    } | null;
    transaction: {
      type: "debit" | "credit" | null;
      amount: string | null;
      referenceNo: string | null;
      merchant: string | null;
    };
  }

  export function getTransactionInfo(message: string): TransactionSmsInfo;
}
