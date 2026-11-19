import {eq} from "drizzle-orm";
import {db} from "@/lib/server/database/db";
import {user} from "@/lib/server/database/schema";
import {createServerFn} from "@tanstack/react-start";
import {generalSettingsSchema} from "@/lib/schemas/schemas";
import {authMiddleware} from "@/lib/server/middlewares/authentication";


export const postGeneralSettings = createServerFn({ method: "POST" })
    .middleware([authMiddleware])
    .validator(generalSettingsSchema)
    .handler(async ({ data, context: { currentUser } }) => {
        await db
            .update(user)
            .set({
                name: data.name,
                updatedAt: new Date(),
            }).where(eq(user.id, currentUser.id));
    })
