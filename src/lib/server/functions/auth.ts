import {eq} from "drizzle-orm";
import {db} from "@/lib/server/database/db";
import {auth} from "@/lib/server/auth/auth";
import {user} from "@/lib/server/database/schema";
import {createServerFn} from "@tanstack/react-start";
import {getRequest} from "@tanstack/react-start/server";


export const getCurrentUser = createServerFn({ method: "GET" }).handler(async () => {
    const { headers } = getRequest();
    const session = await auth.api.getSession({ headers });

    if (!session?.user) {
        return null;
    }

    const userId = parseInt(session.user.id);
    const storedUser = db
        .select({ lastRssUpdate: user.lastRssUpdate })
        .from(user)
        .where(eq(user.id, userId))
        .get();

    if (!storedUser) return null;

    return {
        ...session.user,
        id: userId,
        lastRssUpdate: storedUser.lastRssUpdate,
    };
});
