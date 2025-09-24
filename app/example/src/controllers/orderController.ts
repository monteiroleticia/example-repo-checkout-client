import type { RequestHandler } from "express";
import { toListResponse, toResponse } from "../mappers/orderMapper.js";
import {
    createPayment,
    findAll,
    updatePaymentStatus,
} from "../services/paymentService.js";
import type { CreatePaymentDTO } from "../validation/paymentValidation.js";

interface OrderParams {
    id: string;
}

const create: RequestHandler<
    Record<string, string>,
    unknown,
    CreatePaymentDTO
> = async (req, res, next): Promise<void> => {
    try {
        const order = await createPayment(req.body);
        res.status(201).json(toResponse(order, true));
    } catch (err) {
        next(err);
    }
};

const list: RequestHandler = async (_req, res, next): Promise<void> => {
    try {
        const orders = await findAll();
        res.status(200).json(toListResponse(orders));
    } catch (err) {
        next(err);
    }
};

const redirect: RequestHandler<OrderParams> = async (
    req,
    res,
    next,
): Promise<void> => {
    try {
        const order = await updatePaymentStatus(req.params.id);
        res.status(200).json({
            message: "Order updated successfully",
            order: toResponse(order),
        });
    } catch (err) {
        next(err);
    }
};

export { create, list, redirect };
