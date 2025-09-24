/// <reference types="jest" />

import request from "supertest";
import { api } from "../../src/api";
import { pool } from "../../src/db";
import { dinteroClient } from "../../src/integrations/dintero/index";

describe("Payment Order API Feature Tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        const mockClient = {
            query: jest.fn(),
            release: jest.fn(),
        };
        (pool.connect as jest.Mock).mockResolvedValue(mockClient);
        (pool.query as jest.Mock).mockResolvedValue({ rows: [] });
    });

    afterEach(async () => {
        await pool.query("TRUNCATE orders.payments RESTART IDENTITY CASCADE");
    });

    it("should create a new payment order successfully", async () => {
        const mockPayment = {
            id: "mock-id",
            amount: 1000,
            currency: "USD",
            receipt: "test-receipt-123",
            status: "PENDING",
            session_id: null,
            session_url: null,
            created_at: new Date().toISOString(),
        };

        const mockClient = {
            query: jest
                .fn()
                .mockResolvedValueOnce(undefined) // BEGIN
                .mockResolvedValueOnce({ rows: [mockPayment] }) // INSERT
                .mockResolvedValueOnce({
                    rows: [
                        {
                            ...mockPayment,
                            session_id: "session-123",
                            session_url: "http://example.com/session",
                        },
                    ],
                }) // UPDATE
                .mockResolvedValueOnce(undefined), // COMMIT
            release: jest.fn(),
        };
        (pool.connect as jest.Mock).mockResolvedValue(mockClient);

        (dinteroClient.createSession as jest.Mock).mockResolvedValue({
            id: "session-123",
            url: "http://example.com/session",
        });

        const response = await request(api)
            .post("/orders")
            .send({
                amount: 1000,
                currency: "USD",
                receipt: "test-receipt-123",
            })
            .expect(200);

        expect(response.body).toHaveProperty("id");
        expect(response.body.amount).toBe(1000);
        expect(response.body.currency).toBe("USD");
        expect(response.body.receipt).toBe("test-receipt-123");
        expect(response.body.status).toBe("PENDING");
    });

    it("should list all payment orders successfully", async () => {
        const mockPayments = [
            {
                id: "mock-id-1",
                amount: 500,
                currency: "EUR",
                receipt: "list-test-receipt",
                status: "PENDING",
                session_id: null,
                session_url: null,
                created_at: new Date().toISOString(),
            },
        ];

        (pool.query as jest.Mock).mockResolvedValue({ rows: mockPayments });

        const response = await request(api).get("/orders").expect(200);

        expect(response.body).toHaveProperty("orders");
        expect(Array.isArray(response.body.orders)).toBe(true);
        expect(response.body.orders.length).toBe(1);
        expect(response.body.orders[0]).toHaveProperty("id");
        expect(response.body.orders[0]).toHaveProperty("amount");
        expect(response.body.orders[0]).toHaveProperty("currency");
        expect(response.body.orders[0]).toHaveProperty("status");
    });

    it("should handle payment redirect and update status successfully", async () => {
        const mockPayment = {
            id: "mock-id-2",
            amount: 2000,
            currency: "NOK",
            receipt: "redirect-test-receipt",
            status: "PENDING",
            session_id: "session-123",
            session_url: null,
            created_at: new Date().toISOString(),
        };

        const updatedPayment = { ...mockPayment, status: "CAPTURED" };

        (pool.query as jest.Mock).mockResolvedValue({ rows: [mockPayment] });

        (dinteroClient.getSessionStatus as jest.Mock).mockResolvedValue({
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
        });

        const mockClient = {
            query: jest.fn().mockResolvedValue({ rows: [updatedPayment] }),
            release: jest.fn(),
        };
        (pool.connect as jest.Mock).mockResolvedValue(mockClient);

        const response = await request(api)
            .get(`/orders/${mockPayment.id}/payment-redirect`)
            .expect(200);

        expect(response.body).toHaveProperty("message");
        expect(response.body).toHaveProperty("order");
        expect(response.body.order).toHaveProperty("id", mockPayment.id);
        expect(response.body.order).toHaveProperty("status");
    });
});
