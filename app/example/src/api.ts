import express from "express";
import { Pool } from "pg";
import orderRoutes from "./routes/orderRoutes";

const errorHandler: express.ErrorRequestHandler = (err, _, res, next) => {
    console.error(err);
    if (res.headersSent) {
        return next(err);
    }
    res.status(500).json({ error: { message: "server error" } });
};

type EndParameters = Parameters<express.Response["end"]>;

const simpleRequestLogger: express.RequestHandler = (req, res, next) => {
    const defaultEnd = res.end;
    const endOverride = (...params: EndParameters) => {
        defaultEnd.apply(res, params);
        console.log(
            new Date().toISOString(),
            req.method,
            req.url,
            res.statusCode,
        );
    };
    res.end = endOverride as express.Response["end"];
    next();
};

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const api = express();
api.set("port", Number.parseInt(process.env.PORT || "3000"));
api.set("host", process.env.HOST || "0.0.0.0");
api.use(express.json());
api.use(simpleRequestLogger);

api.get("/ping/", async (_, res) => {
    await pool.query("SELECT count(*) from orders.payments");
    res.status(200).json({ ping: "pong" });
});

api.use("/orders", orderRoutes);
api.use(errorHandler);

export { api };
