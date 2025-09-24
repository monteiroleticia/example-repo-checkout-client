import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { NextFunction, Request, Response } from "express";
import Joi from "joi";
import { validateRequest } from "../../src/middleware/validation";

describe("Validation Middleware", () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
        jest.clearAllMocks();

        mockReq = {
            body: {},
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        } as Partial<Response>;
        mockNext = jest.fn() as NextFunction;
    });

    describe("validateRequest", () => {
        const testSchema = Joi.object({
            name: Joi.string().required(),
            age: Joi.number().integer().min(0).required(),
            email: Joi.string().email().optional(),
        });

        it("should call next when validation passes", () => {
            const middleware = validateRequest(testSchema);
            mockReq.body = {
                name: "John Doe",
                age: 25,
                email: "john@example.com",
            };

            middleware(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
        });

        it("should return 400 with validation errors when validation fails", () => {
            const middleware = validateRequest(testSchema);
            mockReq.body = {
                name: "",
                age: -5,
                email: "invalid-email",
            };

            middleware(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).not.toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                status: "error",
                message: "Validation failed",
                errors: expect.arrayContaining([
                    expect.objectContaining({
                        field: "name",
                        message: expect.stringContaining(
                            "is not allowed to be empty",
                        ),
                    }),
                    expect.objectContaining({
                        field: "age",
                        message: expect.stringContaining(
                            "must be greater than or equal to 0",
                        ),
                    }),
                    expect.objectContaining({
                        field: "email",
                        message: expect.stringContaining(
                            "must be a valid email",
                        ),
                    }),
                ]),
            });
        });

        it("should handle multiple validation errors with correct field paths", () => {
            const nestedSchema = Joi.object({
                user: Joi.object({
                    name: Joi.string().required(),
                    profile: Joi.object({
                        age: Joi.number().required(),
                    }).required(),
                }).required(),
            });

            const middleware = validateRequest(nestedSchema);
            mockReq.body = {
                user: {
                    profile: {},
                },
            };

            middleware(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).not.toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                status: "error",
                message: "Validation failed",
                errors: expect.arrayContaining([
                    expect.objectContaining({
                        field: "user.name",
                        message: expect.stringContaining("is required"),
                    }),
                    expect.objectContaining({
                        field: "user.profile.age",
                        message: expect.stringContaining("is required"),
                    }),
                ]),
            });
        });

        it("should handle empty request body", () => {
            const middleware = validateRequest(testSchema);
            mockReq.body = {};

            middleware(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).not.toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                status: "error",
                message: "Validation failed",
                errors: expect.arrayContaining([
                    expect.objectContaining({
                        field: "name",
                        message: expect.stringContaining("is required"),
                    }),
                    expect.objectContaining({
                        field: "age",
                        message: expect.stringContaining("is required"),
                    }),
                ]),
            });
        });

        it("should handle null request body", () => {
            const middleware = validateRequest(testSchema);
            mockReq.body = null;

            middleware(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).not.toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                status: "error",
                message: "Validation failed",
                errors: [
                    {
                        field: "",
                        message: '"value" must be of type object',
                    },
                ],
            });
        });
    });
});
