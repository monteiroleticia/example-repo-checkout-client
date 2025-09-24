import Joi from "joi";
import { ISO4217 } from "./utils/currencyCodes";

export interface CreatePaymentDTO {
    amount: number;
    currency: string;
    receipt: string;
}

export const createPaymentSchema = Joi.object<CreatePaymentDTO>({
    amount: Joi.number().integer().min(1).required(),

    currency: Joi.string()
        .valid(...Object.values(ISO4217))
        .required(),

    receipt: Joi.string().trim().min(1).required(),
});

export function validateCreatePayment(data: unknown): {
    value: CreatePaymentDTO;
    error?: Joi.ValidationError;
} {
    return createPaymentSchema.validate(data, { abortEarly: false });
}
