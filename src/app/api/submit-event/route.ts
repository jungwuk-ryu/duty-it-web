import { NextResponse } from "next/server";

import {
    getImageFileIssue,
    MAX_TOTAL_UPLOAD_BYTES,
    type EventSubmissionPayload,
} from "@/src/lib/event-submission";
import {
    EventSubmissionSchema,
    normalizeEventSubmissionInput,
} from "@/src/lib/schemas/event-submission";

export const runtime = "nodejs";

const DATA_PART_NAME = "data";
const EVENT_THUMBNAIL_PART_NAME = "eventThumbnail";
const HOST_THUMBNAIL_PART_NAME = "hostThumbnail";

type ErrorResponse = {
    message?: unknown;
};

export async function POST(request: Request) {
    let formData: FormData;

    try {
        formData = await request.formData();
    } catch {
        return errorResponse("제보 내용을 읽을 수 없습니다. 다시 시도해 주세요.");
    }

    const dataPart = formData.get(DATA_PART_NAME);
    const dataText = await getTextPart(dataPart);
    if (!dataText) {
        return errorResponse("행사 정보가 누락되었습니다.");
    }

    let data: unknown;
    try {
        data = JSON.parse(dataText);
    } catch {
        return errorResponse("행사 정보 형식이 올바르지 않습니다.");
    }

    const parsedEvent = EventSubmissionSchema.safeParse(normalizeEventSubmissionInput(data));
    if (!parsedEvent.success) {
        return errorResponse(parsedEvent.error.issues[0]?.message ?? "입력값을 확인해 주세요.");
    }

    const eventThumbnail = getUploadFile(formData, EVENT_THUMBNAIL_PART_NAME);
    if (eventThumbnail.error) return errorResponse(eventThumbnail.error);

    const hostThumbnail = getUploadFile(formData, HOST_THUMBNAIL_PART_NAME);
    if (hostThumbnail.error) return errorResponse(hostThumbnail.error);

    const uploads = [eventThumbnail.file, hostThumbnail.file].filter((file): file is File => file !== null);
    const totalUploadBytes = uploads.reduce((total, file) => total + file.size, 0);
    if (totalUploadBytes > MAX_TOTAL_UPLOAD_BYTES) {
        return errorResponse("첨부 이미지의 합계는 20MB를 초과할 수 없습니다.");
    }

    const apiBase = process.env.API_BASE?.replace(/\/$/, "");
    if (!apiBase) {
        return NextResponse.json(
            { message: "행사 제보 서비스를 현재 사용할 수 없습니다." },
            { status: 503 },
        );
    }

    const upstreamFormData = createUpstreamFormData(parsedEvent.data, eventThumbnail.file, hostThumbnail.file);

    try {
        const upstreamResponse = await fetch(`${apiBase}/v1/events`, {
            method: "POST",
            body: upstreamFormData,
            cache: "no-store",
        });

        if (!upstreamResponse.ok) {
            const message = await getUpstreamErrorMessage(upstreamResponse);
            return NextResponse.json(
                { message: message ?? "제보를 접수하지 못했습니다. 잠시 뒤 다시 시도해 주세요." },
                { status: upstreamResponse.status },
            );
        }

        return NextResponse.json(
            { message: "행사 제보가 접수되었습니다. 검토 후 목록에 반영됩니다." },
            { status: 201 },
        );
    } catch {
        return NextResponse.json(
            { message: "제보 서버에 연결하지 못했습니다. 잠시 뒤 다시 시도해 주세요." },
            { status: 502 },
        );
    }
}

async function getTextPart(value: FormDataEntryValue | null): Promise<string | null> {
    if (typeof value === "string") return value;
    if (value instanceof File) return value.text();
    return null;
}

function getUploadFile(
    formData: FormData,
    partName: string,
): { file: File | null; error?: string } {
    const value = formData.get(partName);
    if (value === null) return { file: null };
    if (!(value instanceof File)) {
        return { file: null, error: "첨부 파일 형식이 올바르지 않습니다." };
    }

    return { file: value, error: getImageFileIssue(value) };
}

function createUpstreamFormData(
    event: EventSubmissionPayload,
    eventThumbnail: File | null,
    hostThumbnail: File | null,
): FormData {
    const formData = new FormData();
    formData.set(
        DATA_PART_NAME,
        new Blob([JSON.stringify(event)], { type: "application/json" }),
        "event.json",
    );

    if (eventThumbnail) {
        formData.set(EVENT_THUMBNAIL_PART_NAME, eventThumbnail, eventThumbnail.name);
    }
    if (hostThumbnail) {
        formData.set(HOST_THUMBNAIL_PART_NAME, hostThumbnail, hostThumbnail.name);
    }

    return formData;
}

async function getUpstreamErrorMessage(response: Response): Promise<string | undefined> {
    try {
        const body: unknown = await response.json();
        if (isErrorResponse(body) && typeof body.message === "string" && body.message.trim()) {
            return body.message;
        }
    } catch {
        // 응답 본문이 JSON이 아닌 경우에는 일반 오류 문구를 사용합니다.
    }

    return undefined;
}

function isErrorResponse(value: unknown): value is ErrorResponse {
    return typeof value === "object" && value !== null;
}

function errorResponse(message: string) {
    return NextResponse.json({ message }, { status: 400 });
}
