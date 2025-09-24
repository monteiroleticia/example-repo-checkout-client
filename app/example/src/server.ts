import { api } from "./api";

export const server = api.listen(api.get("port"), api.get("host"), (error) => {
    if (error) {
        throw error;
    }
    console.log(
        "  App is running at http://%s:%d in %s mode",
        api.get("host"),
        api.get("port"),
        api.get("env"),
    );
});
