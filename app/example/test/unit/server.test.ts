import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    jest,
} from "@jest/globals";

const mockApi = {
    get: jest.fn() as jest.MockedFunction<(key: string) => any>,
    listen: jest.fn() as jest.MockedFunction<
        (
            port: number,
            host: string,
            callback: (error?: Error | null) => void,
        ) => any
    >,
};

jest.mock("../../src/api", () => ({
    api: mockApi,
}));

describe("Server", () => {
    let consoleLogSpy: any;

    beforeEach(() => {
        jest.clearAllMocks();
        consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    });

    afterEach(() => {
        consoleLogSpy.mockRestore();
    });

    it("should start the server and log success message when no error", () => {
        mockApi.get.mockImplementation((key: string) => {
            switch (key) {
                case "port":
                    return 3000;
                case "host":
                    return "localhost";
                case "env":
                    return "development";
                default:
                    return undefined;
            }
        });

        mockApi.listen.mockImplementation((port, host, callback) => {
            callback(null);
            return { close: jest.fn() };
        });

        jest.isolateModules(() => {
            require("../../src/server");
        });

        expect(mockApi.listen).toHaveBeenCalledWith(
            3000,
            "localhost",
            expect.any(Function),
        );
        expect(consoleLogSpy).toHaveBeenCalledWith(
            "  App is running at http://%s:%d in %s mode",
            "localhost",
            3000,
            "development",
        );
    });

    it("should throw error when listen fails", () => {
        const testError = new Error("Listen failed");

        mockApi.get.mockImplementation((key: string) => {
            switch (key) {
                case "port":
                    return 3000;
                case "host":
                    return "localhost";
                case "env":
                    return "development";
                default:
                    return undefined;
            }
        });

        mockApi.listen.mockImplementation((port, host, callback) => {
            callback(testError);
            return { close: jest.fn() };
        });

        expect(() => {
            jest.isolateModules(() => {
                require("../../src/server");
            });
        }).toThrow(testError);
    });
});
