import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import axios from "axios";
import { DinteroClient } from "../../src/integrations/dintero/client";
import { DINTERO_CONFIG } from "../../src/integrations/dintero/config";

jest.mock("axios");
jest.mock("../../src/integrations/dintero/config", () => ({
    DINTERO_CONFIG: {
        CLIENT_ID: "test_client_id",
        CLIENT_SECRET: "test_client_secret",
        AUTH_URL: "https://test.auth",
        AUDIENCE: "test_audience",
        SESSION_URL: "https://test.session",
        PROFILE_ID: "test_profile",
        SESSION_STATUS_URL: "https://test.status",
    },
}));
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("DinteroClient", () => {
    let client: DinteroClient;
    let mockHttpClient: any;

    beforeEach(() => {
        jest.clearAllMocks();
        mockHttpClient = {
            post: jest.fn(),
            get: jest.fn(),
        };
        mockedAxios.create.mockReturnValue(mockHttpClient);
        client = new DinteroClient(mockHttpClient);
    });

    describe("constructor", () => {
        it("should create httpClient if not provided", () => {
            new DinteroClient();
            expect(mockedAxios.create).toHaveBeenCalledWith({
                timeout: 30000,
                headers: {
                    "Content-Type": "application/json",
                },
            });
        });

        it("should use provided httpClient", () => {
            expect(client).toBeInstanceOf(DinteroClient);
            expect(mockedAxios.create).not.toHaveBeenCalled();
        });
    });

    describe("getAccessToken", () => {
        it("should return cached token if valid", async () => {
            client.accessToken = "cached_token";
            client.tokenExpiry = Date.now() + 10000;

            const token = await client.getAccessToken();

            expect(token).toBe("cached_token");
            expect(mockHttpClient.post).not.toHaveBeenCalled();
        });

        it("should fetch new token if expired", async () => {
            const mockResponse = {
                data: {
                    access_token: "new_token",
                    expires_in: 3600,
                },
            };
            mockHttpClient.post.mockResolvedValue(mockResponse);

            const token = await client.getAccessToken();

            expect(token).toBe("new_token");
            expect(mockHttpClient.post).toHaveBeenCalledWith(
                DINTERO_CONFIG.AUTH_URL,
                {
                    grant_type: "client_credentials",
                    audience: DINTERO_CONFIG.AUDIENCE,
                },
                {
                    headers: {
                        Authorization: `Basic ${Buffer.from(
                            `${DINTERO_CONFIG.CLIENT_ID}:${DINTERO_CONFIG.CLIENT_SECRET}`,
                        ).toString("base64")}`,
                    },
                },
            );
            expect(client.accessToken).toBe("new_token");
            expect(client.tokenExpiry).toBeGreaterThan(Date.now());
        });
    });

    describe("createSession", () => {
        it("should create session successfully", async () => {
            const mockToken = "access_token";
            const mockResponse = {
                data: { session_id: "session_123" },
            };
            client.getAccessToken = (
                jest.fn() as jest.MockedFunction<() => Promise<string>>
            ).mockResolvedValue(mockToken);
            mockHttpClient.post.mockResolvedValue(mockResponse);

            const params = {
                url: { return_url: "http://example.com" },
                order: {
                    amount: 1000,
                    currency: "NOK",
                    merchant_reference: "ref123",
                },
                profile_id: "profile123",
            };
            const result = await client.createSession(params);

            expect(client.getAccessToken).toHaveBeenCalled();
            expect(mockHttpClient.post).toHaveBeenCalledWith(
                DINTERO_CONFIG.SESSION_URL,
                {
                    ...params,
                    profile_id: DINTERO_CONFIG.PROFILE_ID,
                },
                {
                    headers: {
                        Authorization: `Bearer ${mockToken}`,
                    },
                },
            );
            expect(result).toEqual(mockResponse.data);
        });
    });

    describe("getSessionStatus", () => {
        it("should get session status successfully", async () => {
            const mockToken = "access_token";
            const mockResponse = {
                data: { status: "completed" },
            };
            client.getAccessToken = (
                jest.fn() as jest.MockedFunction<() => Promise<string>>
            ).mockResolvedValue(mockToken);
            mockHttpClient.get.mockResolvedValue(mockResponse);

            const sessionId = "session_123";
            const result = await client.getSessionStatus(sessionId);

            expect(client.getAccessToken).toHaveBeenCalled();
            expect(mockHttpClient.get).toHaveBeenCalledWith(
                `${DINTERO_CONFIG.SESSION_STATUS_URL}/${sessionId}`,
                {
                    headers: {
                        Authorization: `Bearer ${mockToken}`,
                    },
                },
            );
            expect(result).toEqual(mockResponse.data);
        });
    });
});
