import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    jest,
} from "@jest/globals";
import { pool } from "../../src/db";
import { dinteroClient } from "../../src/integrations/dintero/index";
import { PaymentStatus } from "../../src/models/enums/paymentStatus";
import type { Payment } from "../../src/models/payment";
import {
    createPayment,
    findAll,
    findById,
    updatePaymentStatus,
} from "../../src/services/paymentService";
import type { CreatePaymentDTO } from "../../src/validation/paymentValidation";

const mockPool = pool as jest.Mocked<typeof pool>;
const mockDinteroClient = dinteroClient as jest.Mocked<typeof dinteroClient>;

describe("PaymentService", () => {
    let mockClient: any;

    beforeEach(() => {
        jest.clearAllMocks();

        mockClient = {
            query: jest.fn(),
            release: jest.fn(),
        };
        (mockPool.connect as any).mockResolvedValue(mockClient);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("createPayment", () => {
        const validPaymentData: CreatePaymentDTO = {
            amount: 1000,
            currency: "USD",
            receipt: "receipt-123",
        };

        const mockPayment: Payment = {
            id: "payment-123",
            amount: 1000,
            currency: "USD",
            receipt: "receipt-123",
            status: PaymentStatus.PENDING,
            session_id: "session-123",
            session_url: "https://checkout.dintero.com/session-123",
            created_at: new Date("2024-01-01T00:00:00Z"),
        };

        it("should successfully create a payment with valid data", async () => {
            mockClient.query
                .mockResolvedValueOnce({ rows: [] }) // BEGIN
                .mockResolvedValueOnce({ rows: [mockPayment] }) // INSERT
                .mockResolvedValueOnce({
                    rows: [
                        {
                            ...mockPayment,
                            session_id: "session-123",
                            session_url:
                                "https://checkout.dintero.com/session-123",
                        },
                    ],
                }) // UPDATE
                .mockResolvedValueOnce({ rows: [] }); // COMMIT

            mockDinteroClient.createSession.mockResolvedValue({
                id: "session-123",
                url: "https://checkout.dintero.com/session-123",
            });

            const result = await createPayment(validPaymentData);

            expect(result).toEqual({
                ...mockPayment,
                session_id: "session-123",
                session_url: "https://checkout.dintero.com/session-123",
            });
            expect(mockClient.query).toHaveBeenCalledWith("BEGIN");
            expect(mockClient.query).toHaveBeenCalledWith(
                "INSERT INTO orders.payments (amount, currency, receipt, status, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING *",
                [1000, "USD", "receipt-123", PaymentStatus.PENDING],
            );
            expect(mockDinteroClient.createSession).toHaveBeenCalledWith({
                url: {
                    return_url: expect.stringContaining(
                        "/orders/payment-123/payment-redirect",
                    ),
                },
                order: {
                    amount: 1000,
                    currency: "USD",
                    merchant_reference: "receipt-123",
                },
                profile_id: "",
            });
            expect(mockClient.query).toHaveBeenCalledWith("COMMIT");
            expect(mockClient.release).toHaveBeenCalled();
        });

        it("should handle Dintero session creation failure and update status to FAILED", async () => {
            mockClient.query
                .mockResolvedValueOnce({ rows: [] }) // BEGIN
                .mockResolvedValueOnce({ rows: [mockPayment] }) // INSERT
                .mockResolvedValueOnce({
                    rows: [{ ...mockPayment, status: PaymentStatus.FAILED }],
                }) // UPDATE status to FAILED
                .mockResolvedValueOnce({ rows: [] }); // COMMIT

            const dinteroError = new Error("Dintero API error");
            mockDinteroClient.createSession.mockRejectedValue(dinteroError);

            await expect(createPayment(validPaymentData)).rejects.toThrow(
                "Dintero API error",
            );

            expect(mockClient.query).toHaveBeenCalledWith("BEGIN");
            expect(mockClient.query).toHaveBeenCalledWith(
                "INSERT INTO orders.payments (amount, currency, receipt, status, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING *",
                [1000, "USD", "receipt-123", PaymentStatus.PENDING],
            );
            expect(mockClient.query).toHaveBeenCalledWith(
                "UPDATE orders.payments SET status = $1 WHERE id = $2",
                [PaymentStatus.FAILED, "payment-123"],
            );
            expect(mockClient.query).toHaveBeenCalledWith("COMMIT");
            expect(mockClient.release).toHaveBeenCalled();
        });

        it("should rollback transaction on database error", async () => {
            const dbError = new Error("Database connection error");
            mockClient.query.mockRejectedValueOnce(dbError);

            await expect(createPayment(validPaymentData)).rejects.toThrow(
                "Database connection error",
            );

            expect(mockClient.query).toHaveBeenCalledWith("BEGIN");
            expect(mockClient.query).toHaveBeenCalledWith("ROLLBACK");
            expect(mockClient.release).toHaveBeenCalled();
        });

        it("should release client connection in finally block", async () => {
            mockClient.query.mockRejectedValueOnce(new Error("Database error"));

            await expect(createPayment(validPaymentData)).rejects.toThrow();

            expect(mockClient.release).toHaveBeenCalled();
        });

        it("should handle errors during status update and rollback transaction", async () => {
            mockClient.query
                .mockResolvedValueOnce({ rows: [] }) // BEGIN
                .mockResolvedValueOnce({ rows: [mockPayment] }) // INSERT
                .mockRejectedValueOnce(new Error("Update failed")); // UPDATE fails

            await expect(createPayment(validPaymentData)).rejects.toThrow(
                "Update failed",
            );

            expect(mockClient.query).toHaveBeenCalledWith("ROLLBACK");
            expect(mockClient.release).toHaveBeenCalled();
        });

        it("should handle errors during session update and rollback transaction", async () => {
            mockClient.query
                .mockResolvedValueOnce({ rows: [] }) // BEGIN
                .mockResolvedValueOnce({ rows: [mockPayment] }); // INSERT

            mockDinteroClient.createSession.mockResolvedValue({
                id: "session-123",
                url: "https://checkout.dintero.com/session-123",
            });

            mockClient.query.mockRejectedValueOnce(
                new Error("Session update failed"),
            ); // UPDATE session fails

            await expect(createPayment(validPaymentData)).rejects.toThrow(
                "Session update failed",
            );

            expect(mockClient.query).toHaveBeenCalledWith("ROLLBACK");
            expect(mockClient.release).toHaveBeenCalled();
        });
    });

    describe("findById", () => {
        it("should return payment when found", async () => {
            const mockPayment: Payment = {
                id: "payment-123",
                amount: 1000,
                currency: "USD",
                receipt: "receipt-123",
                status: PaymentStatus.PENDING,
                created_at: new Date(),
            };

            (mockPool.query as any).mockResolvedValue({ rows: [mockPayment] });

            const result = await findById("payment-123");

            expect(result).toEqual(mockPayment);
            expect(mockPool.query).toHaveBeenCalledWith(
                "SELECT * FROM orders.payments WHERE id = $1",
                ["payment-123"],
            );
        });

        it("should return null when payment not found", async () => {
            (mockPool.query as any).mockResolvedValue({ rows: [] });

            const result = await findById("non-existent-id");

            expect(result).toBeNull();
            expect(mockPool.query).toHaveBeenCalledWith(
                "SELECT * FROM orders.payments WHERE id = $1",
                ["non-existent-id"],
            );
        });
    });

    describe("findAll", () => {
        it("should return all payments", async () => {
            const mockPayments: Payment[] = [
                {
                    id: "payment-1",
                    amount: 1000,
                    currency: "USD",
                    receipt: "receipt-1",
                    status: PaymentStatus.PENDING,
                    created_at: new Date(),
                },
                {
                    id: "payment-2",
                    amount: 2000,
                    currency: "EUR",
                    receipt: "receipt-2",
                    status: PaymentStatus.PENDING,
                    created_at: new Date(),
                },
            ];

            (mockPool.query as any).mockResolvedValue({ rows: mockPayments });

            const result = await findAll();

            expect(result).toEqual(mockPayments);
            expect(mockPool.query).toHaveBeenCalledWith(
                "SELECT * FROM orders.payments",
            );
        });

        it("should return empty array when no payments exist", async () => {
            (mockPool.query as any).mockResolvedValue({ rows: [] });

            const result = await findAll();

            expect(result).toEqual([]);
        });
    });

    describe("updatePaymentStatus", () => {
        const mockPayment: Payment = {
            id: "payment-123",
            amount: 1000,
            currency: "USD",
            receipt: "receipt-123",
            status: PaymentStatus.PENDING,
            session_id: "session-123",
            created_at: new Date(),
        };

        it("should successfully update payment status from Dintero", async () => {
            const mockSessionStatus = {
                id: "session-123",
                events: [
                    {
                        id: "event-1",
                        name: "AUTHORIZED",
                        created_at: "2024-01-01T00:00:00Z",
                    },
                    {
                        id: "event-2",
                        name: "CAPTURED",
                        created_at: "2024-01-01T00:01:00Z",
                    },
                ],
            };

            const updatedPayment = { ...mockPayment, status: "CAPTURED" };

            (mockPool.query as any).mockResolvedValueOnce({
                rows: [mockPayment],
            });
            (mockDinteroClient.getSessionStatus as any).mockResolvedValue(
                mockSessionStatus,
            );
            (mockPool.query as any).mockResolvedValueOnce({
                rows: [updatedPayment],
            });

            const result = await updatePaymentStatus("payment-123");

            expect(result).toEqual(updatedPayment);
            expect(mockPool.query).toHaveBeenCalledWith(
                "SELECT * FROM orders.payments WHERE id = $1",
                ["payment-123"],
            );
            expect(mockDinteroClient.getSessionStatus).toHaveBeenCalledWith(
                "session-123",
            );
            expect(mockPool.query).toHaveBeenCalledWith(
                "UPDATE orders.payments SET status = $1 WHERE id = $2 RETURNING *",
                ["CAPTURED", "payment-123"],
            );
        });

        it("should throw error when payment not found", async () => {
            (mockPool.query as any).mockResolvedValue({ rows: [] });

            await expect(
                updatePaymentStatus("non-existent-id"),
            ).rejects.toThrow("Order not found");

            expect(mockPool.query).toHaveBeenCalledWith(
                "SELECT * FROM orders.payments WHERE id = $1",
                ["non-existent-id"],
            );
        });

        it("should throw error when payment has no session_id", async () => {
            const paymentWithoutSession = {
                ...mockPayment,
                session_id: undefined,
            };
            (mockPool.query as any).mockResolvedValue({
                rows: [paymentWithoutSession],
            });

            await expect(updatePaymentStatus("payment-123")).rejects.toThrow(
                "No payment session found for this order",
            );
        });

        it("should use PENDING status when no events exist", async () => {
            const mockSessionStatus = {
                id: "session-123",
                events: [],
            };
            const updatedPayment = {
                ...mockPayment,
                status: PaymentStatus.PENDING,
            };

            (mockPool.query as any).mockResolvedValueOnce({
                rows: [mockPayment],
            });
            (mockDinteroClient.getSessionStatus as any).mockResolvedValue(
                mockSessionStatus,
            );
            (mockPool.query as any).mockResolvedValueOnce({
                rows: [updatedPayment],
            });

            const result = await updatePaymentStatus("payment-123");

            expect(result.status).toBe(PaymentStatus.PENDING);
            expect(mockPool.query).toHaveBeenCalledWith(
                "UPDATE orders.payments SET status = $1 WHERE id = $2 RETURNING *",
                [PaymentStatus.PENDING, "payment-123"],
            );
        });

        it("should handle database update error", async () => {
            const mockSessionStatus = {
                id: "session-123",
                events: [{ name: "COMPLETED" }],
            };

            (mockPool.query as any)
                .mockResolvedValueOnce({ rows: [mockPayment] }) // findById
                .mockRejectedValueOnce(new Error("Database update failed")); // update fails

            (mockDinteroClient.getSessionStatus as any).mockResolvedValue(
                mockSessionStatus,
            );

            await expect(updatePaymentStatus("payment-123")).rejects.toThrow(
                "Database update failed",
            );
        });

        it("should handle Dintero session status error", async () => {
            (mockPool.query as any).mockResolvedValueOnce({
                rows: [mockPayment],
            }); // findById

            (mockDinteroClient.getSessionStatus as any).mockRejectedValue(
                new Error("Failed to get session status"),
            );

            await expect(updatePaymentStatus("payment-123")).rejects.toThrow(
                "Failed to get session status",
            );
        });

        it("should handle undefined events array", async () => {
            const mockSessionStatus = {
                id: "session-123",
            };
            const updatedPayment = {
                ...mockPayment,
                status: PaymentStatus.PENDING,
            };

            (mockPool.query as any)
                .mockResolvedValueOnce({ rows: [mockPayment] })
                .mockResolvedValueOnce({ rows: [updatedPayment] });

            (mockDinteroClient.getSessionStatus as any).mockResolvedValue(
                mockSessionStatus,
            );

            const result = await updatePaymentStatus("payment-123");

            expect(result.status).toBe(PaymentStatus.PENDING);
            expect(mockPool.query).toHaveBeenCalledWith(
                "UPDATE orders.payments SET status = $1 WHERE id = $2 RETURNING *",
                [PaymentStatus.PENDING, "payment-123"],
            );
        });
    });
});
