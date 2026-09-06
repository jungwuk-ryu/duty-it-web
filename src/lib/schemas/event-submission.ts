import { z } from "zod";

import {
    formatDateTimeForApi,
    getEventSubmissionIssues,
    type EventSubmissionPayload,
} from "@/src/lib/event-submission";

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function optionalDateTime(value: unknown): unknown {
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    return trimmed ? formatDateTimeForApi(trimmed) : undefined;
}

function optionalTrimmedString(value: unknown): unknown {
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    return trimmed || undefined;
}

export function normalizeEventSubmissionInput(value: unknown): unknown {
    if (!isRecord(value)) return value;

    return {
        ...value,
        title: typeof value.title === "string" ? value.title.trim() : value.title,
        startAt: typeof value.startAt === "string" ? formatDateTimeForApi(value.startAt.trim()) : value.startAt,
        endAt: optionalDateTime(value.endAt),
        recruitmentStartAt: optionalDateTime(value.recruitmentStartAt),
        recruitmentEndAt: optionalDateTime(value.recruitmentEndAt),
        uri: typeof value.uri === "string" ? value.uri.trim() : value.uri,
        hostName: optionalTrimmedString(value.hostName),
    };
}

export const EventSubmissionSchema = z
    .object({
        title: z.string({ error: "행사 제목을 입력해 주세요." }),
        startAt: z.string({ error: "행사 시작 일시를 입력해 주세요." }),
        endAt: z.string().optional(),
        recruitmentStartAt: z.string().optional(),
        recruitmentEndAt: z.string().optional(),
        uri: z.string({ error: "행사 상세 페이지 주소를 입력해 주세요." }),
        eventType: z.string({ error: "행사 유형을 선택해 주세요." }),
        hostId: z.number().optional(),
        hostName: z.string().optional(),
    })
    .strict()
    .superRefine((input, context) => {
        const issues = getEventSubmissionIssues(input);

        Object.entries(issues).forEach(([field, message]) => {
            context.addIssue({
                code: "custom",
                message,
                path: field === "form" ? [] : [field],
            });
        });
    })
    .transform((input) => input as EventSubmissionPayload);
