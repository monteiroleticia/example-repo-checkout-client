import { describe, expect, it } from "@jest/globals";
import { toListResponse, toResponse } from "../../src/mappers/orderMapper";
import type { Payment } from "../../src/models/payment";

describe("OrderMapper", () => {
    const mockPayment: Payment = {
        id: "payment-123",
        amount: 1000,
        currency: "USD",
        receipt: "receipt-123",
        status: "PENDING",
        session_id: "session-123",
        session_url: "https://checkout.dintero.com/session-123",
        created_at: new Date("2024-01-01T00:00:00Z"),
    };

    const mockPaymentWithoutSession: Payment = {
        id: "payment-456",
        amount: 2000,
        currency: "EUR",
        receipt: "receipt-456",
        status: "CAPTURED",
        created_at: new Date("2024-01-02T00:00:00Z"),
    };

    describe("toResponse", () => {
        it("should map payment to response without links when includeLinks is false", () => {
            const result = toResponse(mockPayment, false);

            expect(result).toEqual({
                id: "payment-123",
                created_at: new Date("2024-01-01T00:00:00Z"),
                amount: 1000,
                currency: "USD",
                receipt: "receipt-123",
                status: "PENDING",
            });
            expect(result.links).toBeUndefined();
        });

        it("should map payment to response without links when includeLinks is true but no session_url", () => {
            const result = toResponse(mockPaymentWithoutSession, true);

            expect(result).toEqual({
                id: "payment-456",
                created_at: new Date("2024-01-02T00:00:00Z"),
                amount: 2000,
                currency: "EUR",
                receipt: "receipt-456",
                status: "CAPTURED",
            });
            expect(result.links).toBeUndefined();
        });

        it("should map payment to response with links when includeLinks is true and session_url exists", () => {
            const result = toResponse(mockPayment, true);

            expect(result).toEqual({
                id: "payment-123",
                created_at: new Date("2024-01-01T00:00:00Z"),
                amount: 1000,
                currency: "USD",
                receipt: "receipt-123",
                status: "PENDING",
                links: [
                    {
                        rel: "session_link",
                        href: "https://checkout.dintero.com/session-123",
                    },
                ],
            });
        });

        it("should default to includeLinks false when not specified", () => {
            const result = toResponse(mockPayment);

            expect(result.links).toBeUndefined();
        });
    });

    describe("toListResponse", () => {
        it("should map array of payments to list response", () => {
            const payments = [mockPayment, mockPaymentWithoutSession];
            const result = toListResponse(payments);

            expect(result).toEqual({
                orders: [
                    {
                        id: "payment-123",
                        created_at: new Date("2024-01-01T00:00:00Z"),
                        amount: 1000,
                        currency: "USD",
                        receipt: "receipt-123",
                        status: "PENDING",
                    },
                    {
                        id: "payment-456",
                        created_at: new Date("2024-01-02T00:00:00Z"),
                        amount: 2000,
                        currency: "EUR",
                        receipt: "receipt-456",
                        status: "CAPTURED",
                    },
                ],
            });
        });

        it("should handle empty array", () => {
            const result = toListResponse([]);

            expect(result).toEqual({
                orders: [],
            });
        });

        it("should handle single payment array", () => {
            const result = toListResponse([mockPayment]);

            expect(result).toEqual({
                orders: [
                    {
                        id: "payment-123",
                        created_at: new Date("2024-01-01T00:00:00Z"),
                        amount: 1000,
                        currency: "USD",
                        receipt: "receipt-123",
                        status: "PENDING",
                    },
                ],
            });
        });
    });
});
