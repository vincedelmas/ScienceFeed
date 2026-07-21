import * as z from "zod";
import {createEnv} from "@t3-oss/env-core";


export const serverEnv = createEnv({
    server: {
        // Database
        DATABASE_URL: z.string().trim().min(1).default("./instance/site.db"),

        // Better-Auth
        BETTER_AUTH_SECRET: z.string().min(20),

        // OAuth2 Providers
        GOOGLE_CLIENT_ID: z.string(),
        GOOGLE_CLIENT_SECRET: z.string(),
    },
    runtimeEnv: process.env,
});
