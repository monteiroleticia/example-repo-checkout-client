import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    jest,
} from "@jest/globals";
import { errorHandler, simpleRequestLogger } from "../../src/api";

const mockPool = jest.fn();
const mockOrderRoutes = jest.fn();

describe("API", () => {
    let mockApp: any;
    let mockExpress: any;

    beforeEach(() => {
        jest.clearAllMocks();
        mockApp = {
            set: jest.fn(),
            use: jest.fn(),
            get: jest.fn(),
        };
        mockExpress = jest.fn(() => mockApp);
        mockExpress.json = jest.fn();
        jest.mock("express", () => mockExpress);
        jest.mock("pg", () => ({ Pool: mockPool }));
        jest.mock("../../src/routes/orderRoutes", () => mockOrderRoutes);
        mockPool.mockReturnValue({
            query: jest.fn(),
        });
    });

    it("should configure the Express app correctly", () => {
        // Set environment variables
        process.env.PORT = "4000";
        process.env.HOST = "127.0.0.1";
        process.env.DATABASE_URL = "postgres://test";

        jest.isolateModules(() => {
            require("../../src/api");
        });

        expect(mockExpress).toHaveBeenCalledTimes(1);
        expect(mockApp.set).toHaveBeenCalledWith("port", 4000);
        expect(mockApp.set).toHaveBeenCalledWith("host", "127.0.0.1");
        expect(mockApp.use).toHaveBeenCalledWith(expect.any(Function));
        expect(mockApp.use).toHaveBeenCalledWith(expect.any(Function));
        expect(mockApp.get).toHaveBeenCalledWith(
            "/ping/",
            expect.any(Function),
        );
        expect(mockApp.use).toHaveBeenCalledWith("/orders", mockOrderRoutes);
        expect(mockApp.use).toHaveBeenCalledWith(expect.any(Function));

        expect(mockPool).toHaveBeenCalledWith({
            connectionString: "postgres://test",
        });
    });

    it("should use default values when env vars are not set", () => {
        process.env.PORT = "";
        process.env.HOST = "";
        process.env.DATABASE_URL = "";
        jest.isolateModules(() => {
            require("../../src/api");
        });

        expect(mockApp.set).toHaveBeenCalledWith("port", 3000);
        expect(mockApp.set).toHaveBeenCalledWith("host", "0.0.0.0");
        expect(mockPool).toHaveBeenCalledWith({
            connectionString: "",
        });
    });

    it("should handle ping request", async () => {
        const mockReq = {};
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        const query = jest.fn() as any;
        query.mockResolvedValue("result");
        const mockPoolInstance = { query };
        mockPool.mockReturnValue(mockPoolInstance);
        let pingHandler: any;
        jest.isolateModules(() => {
            require("../../src/api");
            pingHandler = mockApp.get.mock.calls.find(
                (call: any) => call[0] === "/ping/",
            )?.[1];
        });
        await pingHandler(mockReq, mockRes);
        expect(mockPoolInstance.query).toHaveBeenCalledWith(
            "SELECT count(*) from orders.payments",
        );
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({ ping: "pong" });
    });
});

describe("errorHandler", () => {
    let mockReq: any;
    let mockRes: any;
    let mockNext: any;
    let consoleErrorSpy: any;

    beforeEach(() => {
        mockReq = {};
        mockRes = {
            headersSent: false,
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        mockNext = jest.fn();
        consoleErrorSpy = jest
            .spyOn(console, "error")
            .mockImplementation(() => {});
    });

    afterEach(() => {
        consoleErrorSpy.mockRestore();
    });

    it("should handle error when headers not sent", () => {
        const testError = new Error("Test error");

        errorHandler(testError, mockReq, mockRes, mockNext);

        expect(consoleErrorSpy).toHaveBeenCalledWith(testError);
        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.json).toHaveBeenCalledWith({
            error: { message: "server error" },
        });
        expect(mockNext).not.toHaveBeenCalled();
    });

    it("should call next when headers sent", () => {
        const testError = new Error("Test error");
        mockRes.headersSent = true;

        errorHandler(testError, mockReq, mockRes, mockNext);

        expect(consoleErrorSpy).toHaveBeenCalledWith(testError);
        expect(mockNext).toHaveBeenCalledWith(testError);
        expect(mockRes.status).not.toHaveBeenCalled();
    });
});

describe("simpleRequestLogger", () => {
    let mockReq: any;
    let mockRes: any;
    let mockNext: any;
    let consoleLogSpy: any;

    beforeEach(() => {
        mockReq = {
            method: "GET",
            url: "/test",
        };
        mockRes = {
            statusCode: 200,
            end: jest.fn(),
        };
        mockNext = jest.fn();
        consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    });

    afterEach(() => {
        consoleLogSpy.mockRestore();
    });

    it("should log request on res.end", () => {
        simpleRequestLogger(mockReq, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalled();

        mockRes.end("param1", "param2");

        expect(consoleLogSpy).toHaveBeenCalledWith(
            expect.stringMatching(
                /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
            ),
            "GET",
            "/test",
            200,
        );
    });
});
