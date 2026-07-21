import * as z from "zod";


export type CreateRssFeed = z.infer<typeof createRssFeedSchema>;
export type GeneralSettings = z.infer<typeof generalSettingsSchema>;
export type UserArticleStatus = z.infer<typeof userArticleStatusSchema>;
export type UserArticlesSearch = z.infer<typeof userArticlesSearchSchema>;


export const archiveArticlesSchema = z.object({
    archive: z.boolean(),
    articleIds: z.array(z.number().positive()),
});


export const deleteArticlesSchema = z.object({
    isDeleted: z.boolean(),
    articleIds: z.array(z.number().positive()),
});


export const generalSettingsSchema = z.object({
    name: z.string().trim().min(3).max(15),
});


export const createRssFeedSchema = z.object({
    journal: z.string().trim().min(1),
    publisher: z.string().trim().min(1),
    url: z.string().trim().pipe(z.url({ protocol: /^https?$/ })),
});


export const userArticlesSearchSchema = z.object({
    search: z.string().optional().catch(""),
    page: z.number().positive().optional().catch(1),
    keywordsIds: z.array(z.number().positive()).optional().catch([]),
})


const userArticleStatusSchema = z.enum(["active", "archived", "deleted"]);


export const userArticlesQuerySchema = userArticlesSearchSchema.extend({
    status: userArticleStatusSchema.optional().catch("active"),
});


export const keywordIdSchema = z.object({
    keywordId: z.number().positive(),
});


export const toggleKeywordSchema = z.object({
    active: z.boolean(),
    keywordId: z.number().positive(),
})


export const newKeywordNameSchema = z.object({
    name: z.string().trim().min(1),
});


export const querySearchSchema = z.object({
    query: z.string().trim().min(2),
});


export const feedsIdsSchema = z.object({
    feedsIds: z.array(z.number().positive()),
});


export const rssIdsSchema = z.object({
    rssIds: z.array(z.number().positive()),
});
