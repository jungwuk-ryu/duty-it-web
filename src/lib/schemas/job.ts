import { z } from "zod";

const OptionalTextSchema = z.string().nullable().optional().transform((value) => value?.trim() ?? "");

export const JobCompanySchema = z.object({
    id: z.number(),
    corpNm: OptionalTextSchema,
    corpAddr: OptionalTextSchema,
    homePg: OptionalTextSchema,
    busiCont: OptionalTextSchema,
    indTpCdNm: OptionalTextSchema,
});

export const JobPostingSchema = z.object({
    id: z.number(),
    wantedAuthNo: OptionalTextSchema,
    isActive: z.boolean(),
    company: JobCompanySchema,
    jobsNm: OptionalTextSchema,
    wantedTitle: OptionalTextSchema,
    relJobsNm: OptionalTextSchema,
    jobCont: OptionalTextSchema,
    receiptCloseDt: OptionalTextSchema,
    empTpNm: OptionalTextSchema,
    collectPsncnt: OptionalTextSchema,
    salTpNm: OptionalTextSchema,
    enterTpNm: OptionalTextSchema,
    eduNm: OptionalTextSchema,
    forLang: OptionalTextSchema,
    major: OptionalTextSchema,
    certificate: OptionalTextSchema,
    mltsvcExcHope: OptionalTextSchema,
    compAbl: OptionalTextSchema,
    pfCond: OptionalTextSchema,
    etcPfCond: OptionalTextSchema,
    selMthd: OptionalTextSchema,
    rcptMthd: OptionalTextSchema,
    submitDoc: OptionalTextSchema,
    etcHopeCont: OptionalTextSchema,
    workRegion: OptionalTextSchema,
    nearLine: OptionalTextSchema,
    workdayWorkhrCont: OptionalTextSchema,
    fourIns: OptionalTextSchema,
    retirepay: OptionalTextSchema,
    etcWelfare: OptionalTextSchema,
    disableCvntl: OptionalTextSchema,
    attachFileUrl: OptionalTextSchema,
    corpAttachList: z.array(z.string()).default([]),
    keywordList: z.array(z.string()).default([]),
    dtlRecrContUrl: OptionalTextSchema,
    jobsCd: OptionalTextSchema,
    minEdubgIcd: OptionalTextSchema,
    maxEdubgIcd: OptionalTextSchema,
    regionCd: OptionalTextSchema,
    empTpCd: OptionalTextSchema,
    enterTpCd: OptionalTextSchema,
    salTpCd: OptionalTextSchema,
    contactTelno: OptionalTextSchema,
    createdAt: OptionalTextSchema,
    updatedAt: OptionalTextSchema,
});

export const JobPostingPageSchema = z.object({
    content: z.array(JobPostingSchema),
    pageInfo: z.object({
        hasNext: z.boolean(),
        nextCursor: z.string().nullable().optional(),
        pageSize: z.number(),
    }),
});

export type JobPosting = z.infer<typeof JobPostingSchema>;
export type JobPostingPage = z.infer<typeof JobPostingPageSchema>;
