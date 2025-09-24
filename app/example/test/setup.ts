import { jest } from "@jest/globals";

jest.mock("../src/db", () => ({
    pool: {
        connect: jest.fn(),
        query: jest.fn(),
    },
}));

jest.mock("../src/integrations/dintero/index", () => ({
    dinteroClient: {
        createSession: jest.fn(),
        getSessionStatus: jest.fn(),
    },
}));

process.env.BASE_URL = "http://localhost:3000";
