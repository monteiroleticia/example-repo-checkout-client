export interface DinteroAuthResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
}

export interface DinteroSessionRequest {
    url: {
        return_url: string;
        callback_url?: string;
    };
    order: {
        amount: number;
        currency: string;
        merchant_reference: string;
    };
    profile_id: string;
}

export interface DinteroSessionResponse {
    id: string;
    url: string;
}

export interface DinteroSessionStatusResponse {
    id: string;
    events?: Array<{
        id: string;
        name: string;
        created_at: string;
    }>;
}
