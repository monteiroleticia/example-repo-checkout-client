import type { NextFunction, Request, Response } from "express";
import type Joi from "joi";

export function validateRequest<T>(schema: Joi.ObjectSchema<T>) {
    return (req: Request, res: Response, next: NextFunction): void => {
        const { error } = schema.validate(req.body, { abortEarly: false });

        if (error) {
            const errors = error.details.map((detail) => ({
                field: detail.path.join("."),
                message: detail.message,
            }));

            res.status(400).json({
                status: "error",
                message: "Validation failed",
                errors,
            });
            return;
        }

        next();
    };
}
