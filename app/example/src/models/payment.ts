export interface Payment {
    id: string;
    amount: number;
    currency: string;
    receipt: string;
    status: String;
    session_id?: string;
    session_url?: string;
    created_at: Date;
}
