export interface PayWayTransaction {
    transactionId: string;
    receiptNumber: string;
    responseCode: string;
    responseMessage: string;
    timestamp?: string;
}

export interface PayWayResponse {
    success: boolean;
    transaction: PayWayTransaction;
    error?: string;
    response?: Record<string, unknown>;
}
