function validateDinteroConfig() {
    const requiredVars = ["DINTERO_CLIENT_ID", "DINTERO_CLIENT_SECRET"];
    const missing = requiredVars.filter((varName) => !process.env[varName]);

    if (missing.length > 0) {
        throw new Error(
            `Missing required Dintero environment variables: ${missing.join(", ")}`,
        );
    }
}

validateDinteroConfig();

const ACCOUNT = process.env.DINTERO_ACCOUNT || "T11223674";

export const DINTERO_CONFIG = {
    AUTH_URL: process.env.DINTERO_AUTH_URL || `https://test.dintero.com/v1/accounts/${ACCOUNT}/auth/token`,
    SESSION_URL:
        process.env.DINTERO_SESSION_URL ||
        "https://checkout.test.dintero.com/v1/sessions-profile",
    SESSION_STATUS_URL:
        process.env.DINTERO_SESSION_STATUS_URL ||
        "https://checkout.test.dintero.com/v1/sessions",
    CLIENT_ID: process.env.DINTERO_CLIENT_ID || "",
    CLIENT_SECRET: process.env.DINTERO_CLIENT_SECRET || "",
    PROFILE_ID: process.env.DINTERO_PROFILE_ID || "default",
    AUDIENCE: process.env.DINTERO_AUDIENCE || `https://test.dintero.com/v1/accounts/${ACCOUNT}`,
} as const;
