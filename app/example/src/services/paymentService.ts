import { pool } from "../db";
import { dinteroClient } from "../integrations/dintero/index";
import { mapDinteroStatus } from "../mappers/statusMapper";
import { PaymentStatus } from "../models/enums/paymentStatus";
import type { Payment } from "../models/payment";
import type { CreatePaymentDTO } from "../validation/paymentValidation";

export async function createPayment(data: CreatePaymentDTO): Promise<Payment> {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        const insertResult = await client.query<Payment>(
            "INSERT INTO orders.payments (amount, currency, receipt, status, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING *",
            [data.amount, data.currency, data.receipt, PaymentStatus.PENDING],
        );
        const order = insertResult.rows[0];

        try {
            const session = await dinteroClient.createSession({
                url: {
                    return_url: `${process.env.BASE_URL || "http://localhost:3000"}/orders/${order.id}/payment-redirect`,
                },
                order: {
                    amount: order.amount,
                    currency: order.currency,
                    merchant_reference: order.receipt,
                },
                profile_id: "",
            });

            const updateResult = await client.query<Payment>(
                "UPDATE orders.payments SET session_id = $1, session_url = $2 WHERE id = $3 RETURNING *",
                [session.id, session.url, order.id],
            );

            await client.query("COMMIT");

            return updateResult.rows[0];
        } catch (sessionError) {
            await client.query(
                "UPDATE orders.payments SET status = $1 WHERE id = $2",
                [PaymentStatus.FAILED, order.id],
            );
            await client.query("COMMIT");
            throw sessionError;
        }
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

export async function findById(id: string): Promise<Payment | null> {
    const { rows } = await pool.query<Payment>(
        "SELECT * FROM orders.payments WHERE id = $1",
        [id],
    );
    return rows[0] || null;
}

export async function findAll(): Promise<Payment[]> {
    const { rows } = await pool.query<Payment>("SELECT * FROM orders.payments");
    return rows;
}

export async function updatePaymentStatus(orderId: string): Promise<Payment> {
    const order = await findById(orderId);
    if (!order) {
        throw new Error("Order not found");
    }

    if (!order.session_id) {
        throw new Error("No payment session found for this order");
    }

    const sessionStatus = await dinteroClient.getSessionStatus(
        order.session_id,
    );
    const latestEvent = sessionStatus.events?.[sessionStatus.events.length - 1];
    const dinteroStatus = latestEvent?.name || PaymentStatus.PENDING;
    const status = mapDinteroStatus(dinteroStatus);

    const { rows } = await pool.query<Payment>(
        "UPDATE orders.payments SET status = $1 WHERE id = $2 RETURNING *",
        [status, orderId],
    );

    return rows[0];
}
