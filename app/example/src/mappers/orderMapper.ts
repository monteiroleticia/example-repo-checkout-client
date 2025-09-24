import type { Payment } from "../models/payment";

export interface OrderResponse {
    id: string;
    created_at: Date;
    amount: number;
    currency: string;
    receipt: string;
    status: string;
    links?: Array<{
        rel: string;
        href: string;
    }>;
}

export function toResponse(
    order: Payment,
    includeLinks = false,
): OrderResponse {
    const response: OrderResponse = {
        id: order.id,
        created_at: order.created_at,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
        status: order.status,
    };

    if (includeLinks && order.session_url) {
        response.links = [
            {
                rel: "session_link",
                href: order.session_url,
            },
        ];
    }

    return response;
}

export function toListResponse(orders: Payment[]): { orders: OrderResponse[] } {
    return {
        orders: orders.map((order) => toResponse(order)),
    };
}
