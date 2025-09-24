export enum PaymentStatus {
    PENDING = "PENDING",
    INITIATED = "INITIATED",
    AUTHORIZED = "AUTHORIZED",
    CAPTURED = "CAPTURED",
    FAILED = "FAILED",
    CANCELLED = "CANCELLED",
}

export interface Payment {
    id: string;
    amount: number;
    currency: string;
    receipt: string;
    status: PaymentStatus;
    session_id?: string;
    session_url?: string;
    created_at: Date;
}
