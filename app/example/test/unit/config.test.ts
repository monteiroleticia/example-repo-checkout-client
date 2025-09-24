import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    jest,
} from "@jest/globals";
import type { DINTERO_CONFIG } from "../../src/integrations/dintero/config";

describe("Dintero Config", () => {
    const originalEnv = process.env;

    beforeEach(() => {
        jest.resetModules();
        process.env = { ...originalEnv };
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    describe("validateDinteroConfig", () => {
        it("should not throw if required env vars are set", () => {
            process.env.DINTERO_CLIENT_ID = "test_id";
            process.env.DINTERO_CLIENT_SECRET = "test_secret";

            expect(() => {
                jest.isolateModules(() => {
                    require("../../src/integrations/dintero/config");
                });
            }).not.toThrow();
        });

        it("should throw if DINTERO_CLIENT_ID is missing", () => {
            process.env.DINTERO_CLIENT_ID = undefined;
            process.env.DINTERO_CLIENT_SECRET = "test_secret";

            expect(() => {
                jest.isolateModules(() => {
                    require("../../src/integrations/dintero/config");
                });
            }).toThrow(
                "Missing required Dintero environment variables: DINTERO_CLIENT_ID",
            );
        });

        it("should throw if DINTERO_CLIENT_SECRET is missing", () => {
            process.env.DINTERO_CLIENT_ID = "test_id";
            process.env.DINTERO_CLIENT_SECRET = undefined;

            expect(() => {
                jest.isolateModules(() => {
                    require("../../src/integrations/dintero/config");
                });
            }).toThrow(
                "Missing required Dintero environment variables: DINTERO_CLIENT_SECRET",
            );
        });

        it("should throw if both are missing", () => {
            process.env.DINTERO_CLIENT_ID = undefined;
            process.env.DINTERO_CLIENT_SECRET = undefined;

            expect(() => {
                jest.isolateModules(() => {
                    require("../../src/integrations/dintero/config");
                });
            }).toThrow(
                "Missing required Dintero environment variables: DINTERO_CLIENT_ID, DINTERO_CLIENT_SECRET",
            );
        });
    });

    describe("DINTERO_CONFIG", () => {
        it("should use default values when env vars are not set", () => {
            process.env.DINTERO_CLIENT_ID = "test_id";
            process.env.DINTERO_CLIENT_SECRET = "test_secret";

            let module!: { DINTERO_CONFIG: typeof DINTERO_CONFIG };
            jest.isolateModules(() => {
                module = require("../../src/integrations/dintero/config");
            });
            expect(module.DINTERO_CONFIG).toEqual({
                AUTH_URL:
                    "https://test.dintero.com/v1/accounts/T11223674/auth/token",
                SESSION_URL:
                    "https://checkout.test.dintero.com/v1/sessions-profile",
                SESSION_STATUS_URL:
                    "https://checkout.test.dintero.com/v1/sessions",
                CLIENT_ID: "test_id",
                CLIENT_SECRET: "test_secret",
                PROFILE_ID: "default",
                AUDIENCE: "https://test.dintero.com/v1/accounts/T11223674",
            });
        });

        it("should use env vars when set", () => {
            process.env.DINTERO_CLIENT_ID = "env_id";
            process.env.DINTERO_CLIENT_SECRET = "env_secret";
            process.env.DINTERO_ACCOUNT = "env_account";
            process.env.DINTERO_AUTH_URL = "https://env.auth";
            process.env.DINTERO_SESSION_URL = "https://env.session";
            process.env.DINTERO_SESSION_STATUS_URL = "https://env.status";
            process.env.DINTERO_PROFILE_ID = "env_profile";
            process.env.DINTERO_AUDIENCE = "https://env.audience";

            let module!: { DINTERO_CONFIG: typeof DINTERO_CONFIG };
            jest.isolateModules(() => {
                module = require("../../src/integrations/dintero/config");
            });
            expect(module.DINTERO_CONFIG).toEqual({
                AUTH_URL: "https://env.auth",
                SESSION_URL: "https://env.session",
                SESSION_STATUS_URL: "https://env.status",
                CLIENT_ID: "env_id",
                CLIENT_SECRET: "env_secret",
                PROFILE_ID: "env_profile",
                AUDIENCE: "https://env.audience",
            });
        });

        it("should use ACCOUNT from env for dynamic URLs", () => {
            process.env.DINTERO_CLIENT_ID = "test_id";
            process.env.DINTERO_CLIENT_SECRET = "test_secret";
            process.env.DINTERO_ACCOUNT = "custom_account";

            let module!: { DINTERO_CONFIG: typeof DINTERO_CONFIG };
            jest.isolateModules(() => {
                module = require("../../src/integrations/dintero/config");
            });
            expect(module.DINTERO_CONFIG.AUTH_URL).toBe(
                "https://test.dintero.com/v1/accounts/custom_account/auth/token",
            );
            expect(module.DINTERO_CONFIG.AUDIENCE).toBe(
                "https://test.dintero.com/v1/accounts/custom_account",
            );
        });
    });
});
