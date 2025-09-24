import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { NextFunction, Request, Response } from "express";
import { create, list, redirect } from "../../src/controllers/orderController";
import { toListResponse, toResponse } from "../../src/mappers/orderMapper";
import type { Payment } from "../../src/models/payment";
import {
    createPayment,
    findAll,
    updatePaymentStatus,
} from "../../src/services/paymentService";
import type { CreatePaymentDTO } from "../../src/validation/paymentValidation";

jest.mock("../../src/mappers/orderMapper");
jest.mock("../../src/services/paymentService");

const mockToResponse = toResponse as jest.MockedFunction<typeof toResponse>;
const mockToListResponse = toListResponse as jest.MockedFunction<
    typeof toListResponse
>;
const mockCreatePayment = createPayment as jest.MockedFunction<
    typeof createPayment
>;
const mockFindAll = findAll as jest.MockedFunction<typeof findAll>;
const mockUpdatePaymentStatus = updatePaymentStatus as jest.MockedFunction<
    typeof updatePaymentStatus
>;

describe("OrderController", () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
        jest.clearAllMocks();

        mockReq = {};
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        } as Partial<Response>;
        mockNext = jest.fn() as NextFunction;
    });

    describe("create", () => {
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
            status: "PENDING",
            created_at: new Date(),
        };

        const mockOrderResponse = {
            id: "payment-123",
            amount: 1000,
            currency: "USD",
            receipt: "receipt-123",
            status: "PENDING",
            created_at: new Date(),
            links: [
                {
                    rel: "session_link",
                    href: "https://checkout.dintero.com/session-123",
                },
            ],
        };

        it("should create payment and return 200 with order response", async () => {
            mockReq.body = validPaymentData;
            mockCreatePayment.mockResolvedValue(mockPayment);
            mockToResponse.mockReturnValue(mockOrderResponse);

            await create(mockReq as Request, mockRes as Response, mockNext);

            expect(mockCreatePayment).toHaveBeenCalledWith(validPaymentData);
            expect(mockToResponse).toHaveBeenCalledWith(mockPayment, true);
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(mockOrderResponse);
            expect(mockNext).not.toHaveBeenCalled();
        });

        it("should call next with error when createPayment fails", async () => {
            const error = new Error("Database error");
            mockReq.body = validPaymentData;
            mockCreatePayment.mockRejectedValue(error);

            await create(mockReq as Request, mockRes as Response, mockNext);

            expect(mockCreatePayment).toHaveBeenCalledWith(validPaymentData);
            expect(mockNext).toHaveBeenCalledWith(error);
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
        });
    });

    describe("list", () => {
        const mockPayments: Payment[] = [
            {
                id: "payment-1",
                amount: 1000,
                currency: "USD",
                receipt: "receipt-1",
                status: "PENDING",
                created_at: new Date(),
            },
            {
                id: "payment-2",
                amount: 2000,
                currency: "EUR",
                receipt: "receipt-2",
                status: "CAPTURED",
                created_at: new Date(),
            },
        ];

        const mockListResponse = {
            orders: [
                {
                    id: "payment-1",
                    amount: 1000,
                    currency: "USD",
                    receipt: "receipt-1",
                    status: "PENDING",
                    created_at: new Date(),
                },
                {
                    id: "payment-2",
                    amount: 2000,
                    currency: "EUR",
                    receipt: "receipt-2",
                    status: "CAPTURED",
                    created_at: new Date(),
                },
            ],
        };

        it("should return 200 with list of orders", async () => {
            mockFindAll.mockResolvedValue(mockPayments);
            mockToListResponse.mockReturnValue(mockListResponse);

            await list(mockReq as Request, mockRes as Response, mockNext);

            expect(mockFindAll).toHaveBeenCalled();
            expect(mockToListResponse).toHaveBeenCalledWith(mockPayments);
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(mockListResponse);
            expect(mockNext).not.toHaveBeenCalled();
        });

        it("should call next with error when findAll fails", async () => {
            const error = new Error("Database error");
            mockFindAll.mockRejectedValue(error);

            await list(mockReq as Request, mockRes as Response, mockNext);

            expect(mockFindAll).toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalledWith(error);
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
        });
    });

    describe("redirect", () => {
        const mockPayment: Payment = {
            id: "payment-123",
            amount: 1000,
            currency: "USD",
            receipt: "receipt-123",
            status: "CAPTURED",
            created_at: new Date(),
        };

        const mockOrderResponse = {
            id: "payment-123",
            amount: 1000,
            currency: "USD",
            receipt: "receipt-123",
            status: "CAPTURED",
            created_at: new Date(),
        };

        it("should update payment status and return 200 with success message", async () => {
            const redirectReq = { params: { id: "payment-123" } } as Request & {
                params: { id: string };
            };
            mockUpdatePaymentStatus.mockResolvedValue(mockPayment);
            mockToResponse.mockReturnValue(mockOrderResponse);

            await redirect(redirectReq, mockRes as Response, mockNext);

            expect(mockUpdatePaymentStatus).toHaveBeenCalledWith("payment-123");
            expect(mockToResponse).toHaveBeenCalledWith(mockPayment);
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: "Order updated successfully",
                order: mockOrderResponse,
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it("should call next with error when updatePaymentStatus fails", async () => {
            const error = new Error("Payment not found");
            const redirectReq = {
                params: { id: "non-existent-id" },
            } as Request & { params: { id: string } };
            mockUpdatePaymentStatus.mockRejectedValue(error);

            await redirect(redirectReq, mockRes as Response, mockNext);

            expect(mockUpdatePaymentStatus).toHaveBeenCalledWith(
                "non-existent-id",
            );
            expect(mockNext).toHaveBeenCalledWith(error);
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
        });
    });
});
