import { describe, expect, it } from "@jest/globals";
import {
    createPaymentSchema,
    validateCreatePayment,
} from "../../src/validation/paymentValidation";

describe("Payment Validation", () => {
    describe("validateCreatePayment", () => {
        it("should validate valid payment data", () => {
            const validData = {
                amount: 1000,
                currency: "USD",
                receipt: "receipt-123",
            };

            const result = validateCreatePayment(validData);

            expect(result.error).toBeUndefined();
            expect(result.value).toEqual(validData);
        });

        it("should reject invalid amount (negative)", () => {
            const invalidData = {
                amount: -100,
                currency: "USD",
                receipt: "receipt-123",
            };

            const result = validateCreatePayment(invalidData);

            expect(result.error).toBeDefined();
            expect(result.error?.details[0].message).toContain(
                "must be greater than or equal to 1",
            );
        });

        it("should reject invalid amount (zero)", () => {
            const invalidData = {
                amount: 0,
                currency: "USD",
                receipt: "receipt-123",
            };

            const result = validateCreatePayment(invalidData);

            expect(result.error).toBeDefined();
            expect(result.error?.details[0].message).toContain(
                "must be greater than or equal to 1",
            );
        });

        it("should reject invalid amount (decimal)", () => {
            const invalidData = {
                amount: 100.5,
                currency: "USD",
                receipt: "receipt-123",
            };

            const result = validateCreatePayment(invalidData);

            expect(result.error).toBeDefined();
            expect(result.error?.details[0].message).toContain(
                "must be an integer",
            );
        });

        it("should reject invalid currency", () => {
            const invalidData = {
                amount: 1000,
                currency: "INVALID",
                receipt: "receipt-123",
            };

            const result = validateCreatePayment(invalidData);

            expect(result.error).toBeDefined();
            expect(result.error?.details[0].message).toContain(
                "must be one of",
            );
        });

        it("should accept valid ISO 4217 currencies", () => {
            const validCurrencies = [
                "USD",
                "EUR",
                "GBP",
                "JPY",
                "NOK",
                "SEK",
                "DKK",
            ];

            for (const currency of validCurrencies) {
                const validData = {
                    amount: 1000,
                    currency,
                    receipt: "receipt-123",
                };

                const result = validateCreatePayment(validData);

                expect(result.error).toBeUndefined();
                expect(result.value.currency).toBe(currency);
            }
        });

        it("should reject empty receipt", () => {
            const invalidData = {
                amount: 1000,
                currency: "USD",
                receipt: "",
            };

            const result = validateCreatePayment(invalidData);

            expect(result.error).toBeDefined();
            expect(result.error?.details[0].message).toContain(
                "is not allowed to be empty",
            );
        });

        it("should reject missing required fields", () => {
            const invalidData = {
                amount: 1000,
            };

            const result = validateCreatePayment(invalidData);

            expect(result.error).toBeDefined();
            expect(result.error?.details).toHaveLength(2);
        });

        it("should trim whitespace from receipt", () => {
            const dataWithWhitespace = {
                amount: 1000,
                currency: "USD",
                receipt: "  receipt-123  ",
            };

            const result = validateCreatePayment(dataWithWhitespace);

            expect(result.error).toBeUndefined();
            expect(result.value.receipt).toBe("receipt-123");
        });

        it("should handle multiple validation errors", () => {
            const invalidData = {
                amount: -50,
                currency: "INVALID",
                receipt: "",
            };

            const result = validateCreatePayment(invalidData);

            expect(result.error).toBeDefined();
            expect(result.error?.details).toHaveLength(3);
        });
    });

    describe("createPaymentSchema", () => {
        it("should validate the schema structure", () => {
            const schemaKeys = Object.keys(createPaymentSchema.describe().keys);
            expect(schemaKeys).toEqual(["amount", "currency", "receipt"]);
        });

        it("should have correct amount validation rules", () => {
            const schemaDesc = createPaymentSchema.describe();
            expect(schemaDesc.keys.amount.type).toBe("number");
            expect(schemaDesc.keys.amount.flags?.presence).toBe("required");
            expect(schemaDesc.keys.amount.rules).toBeDefined();
        });

        it("should have correct currency validation rules", () => {
            const schemaDesc = createPaymentSchema.describe();
            expect(schemaDesc.keys.currency.type).toBe("string");
            expect(schemaDesc.keys.currency.flags?.presence).toBe("required");
            expect(schemaDesc.keys.currency.allow).toContain("USD");
            expect(schemaDesc.keys.currency.allow).toContain("EUR");
        });

        it("should have correct receipt validation rules", () => {
            const schemaDesc = createPaymentSchema.describe();
            expect(schemaDesc.keys.receipt.type).toBe("string");
            expect(schemaDesc.keys.receipt.flags?.presence).toBe("required");
            expect(schemaDesc.keys.receipt.rules).toBeDefined();
        });
    });
});
