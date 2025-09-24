import axios, { type AxiosInstance } from "axios";
import { DINTERO_CONFIG } from "./config";
import type {
    DinteroAuthResponse,
    DinteroSessionRequest,
    DinteroSessionResponse,
    DinteroSessionStatusResponse,
} from "./types";

export class DinteroClient {
    private httpClient: AxiosInstance;
    private accessToken?: string;
    private tokenExpiry?: number;

    constructor() {
        this.httpClient = axios.create({
            timeout: 30000,
            headers: {
                "Content-Type": "application/json",
            },
        });
    }

    private async getAccessToken(): Promise<string> {
        if (
            this.accessToken &&
            this.tokenExpiry &&
            Date.now() < this.tokenExpiry
        ) {
            return this.accessToken;
        }

        const credentials = Buffer.from(
            `${DINTERO_CONFIG.CLIENT_ID}:${DINTERO_CONFIG.CLIENT_SECRET}`,
        ).toString("base64");

        const response = await this.httpClient.post<DinteroAuthResponse>(
            DINTERO_CONFIG.AUTH_URL,
            {
                grant_type: "client_credentials",
                audience: DINTERO_CONFIG.AUDIENCE,
            },
            {
                headers: {
                    Authorization: `Basic ${credentials}`,
                },
            },
        );

        this.accessToken = response.data.access_token;
        this.tokenExpiry = Date.now() + (response.data.expires_in - 300) * 1000;

        return this.accessToken;
    }

    async createSession(
        params: DinteroSessionRequest,
    ): Promise<DinteroSessionResponse> {
        const accessToken = await this.getAccessToken();

        const response = await this.httpClient.post<DinteroSessionResponse>(
            DINTERO_CONFIG.SESSION_URL,
            {
                ...params,
                profile_id: DINTERO_CONFIG.PROFILE_ID,
            },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            },
        );

        return response.data;
    }

    async getSessionStatus(
        sessionId: string,
    ): Promise<DinteroSessionStatusResponse> {
        const accessToken = await this.getAccessToken();

        const response =
            await this.httpClient.get<DinteroSessionStatusResponse>(
                `${DINTERO_CONFIG.SESSION_STATUS_URL}/${sessionId}`,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                },
            );

        return response.data;
    }
}

export const dinteroClient = new DinteroClient();
