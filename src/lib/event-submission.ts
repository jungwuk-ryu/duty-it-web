import { isHttpUrl } from "@/src/lib/url";

export const EVENT_SUBMISSION_TYPES = [
    "CONFERENCE",
    "SEMINAR",
    "WEBINAR",
    "WORKSHOP",
    "CONTEST",
    "CONTINUING_EDUCATION",
    "EDUCATION",
    "VOLUNTEER",
    "TRAINING",
    "SUPPORTERS",
    "ETC",
] as const;

export type EventSubmissionEventType = (typeof EVENT_SUBMISSION_TYPES)[number];

export const EVENT_SUBMISSION_TYPE_LABEL: Record<EventSubmissionEventType, string> = {
    CONFERENCE: "컨퍼런스/학술대회",
    SEMINAR: "세미나",
    WEBINAR: "웨비나",
    WORKSHOP: "워크숍",
    CONTEST: "공모전",
    CONTINUING_EDUCATION: "보수교육",
    EDUCATION: "교육",
    VOLUNTEER: "봉사",
    TRAINING: "연수",
    SUPPORTERS: "서포터즈",
    ETC: "기타",
};

export const MAX_IMAGE_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_TOTAL_UPLOAD_BYTES = 20 * 1024 * 1024;
export const ALLOWED_IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp"] as const;

export type EventSubmissionInput = {
    title: string;
    startAt: string;
    endAt?: string;
    recruitmentStartAt?: string;
    recruitmentEndAt?: string;
    uri: string;
    eventType: string;
    hostId?: number;
    hostName?: string;
};

export type EventSubmissionPayload = Omit<EventSubmissionInput, "eventType"> & {
    eventType: EventSubmissionEventType;
};

export type EventSubmissionField =
    | "title"
    | "startAt"
    | "endAt"
    | "recruitmentStartAt"
    | "recruitmentEndAt"
    | "uri"
    | "eventType"
    | "hostId"
    | "hostName"
    | "eventThumbnail"
    | "hostThumbnail"
    | "form";

export type EventSubmissionIssues = Partial<Record<EventSubmissionField, string>>;

const LOCAL_DATE_TIME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/;

export function isEventSubmissionEventType(value: string): value is EventSubmissionEventType {
    return (EVENT_SUBMISSION_TYPES as readonly string[]).includes(value);
}

export function formatDateTimeForApi(value: string): string {
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
        return `${value}:00`;
    }

    return value;
}

export function isValidLocalDateTime(value: string): boolean {
    if (!LOCAL_DATE_TIME_PATTERN.test(value)) return false;

    return !Number.isNaN(Date.parse(value));
}

export function getEventSubmissionIssues(input: EventSubmissionInput): EventSubmissionIssues {
    const issues: EventSubmissionIssues = {};
    const title = input.title.trim();
    const uri = input.uri.trim();
    const startAt = formatDateTimeForApi(input.startAt);
    const endAt = input.endAt ? formatDateTimeForApi(input.endAt) : undefined;
    const recruitmentStartAt = input.recruitmentStartAt
        ? formatDateTimeForApi(input.recruitmentStartAt)
        : undefined;
    const recruitmentEndAt = input.recruitmentEndAt
        ? formatDateTimeForApi(input.recruitmentEndAt)
        : undefined;

    if (!title) issues.title = "행사 제목을 입력해 주세요.";
    if (!startAt) {
        issues.startAt = "행사 시작 일시를 입력해 주세요.";
    } else if (!isValidLocalDateTime(startAt)) {
        issues.startAt = "올바른 행사 시작 일시를 입력해 주세요.";
    }

    if (endAt && !isValidLocalDateTime(endAt)) {
        issues.endAt = "올바른 행사 종료 일시를 입력해 주세요.";
    }
    if (recruitmentStartAt && !isValidLocalDateTime(recruitmentStartAt)) {
        issues.recruitmentStartAt = "올바른 모집 시작 일시를 입력해 주세요.";
    }
    if (recruitmentEndAt && !isValidLocalDateTime(recruitmentEndAt)) {
        issues.recruitmentEndAt = "올바른 모집 종료 일시를 입력해 주세요.";
    }

    if (!uri) {
        issues.uri = "행사 상세 페이지 주소를 입력해 주세요.";
    } else if (!isHttpUrl(uri)) {
        issues.uri = "http:// 또는 https://로 시작하는 주소를 입력해 주세요.";
    }

    if (!isEventSubmissionEventType(input.eventType)) {
        issues.eventType = "행사 유형을 선택해 주세요.";
    }

    const hostId = input.hostId;
    const hasHostId = hostId !== undefined;
    const hasHostName = Boolean(input.hostName?.trim());
    if (hostId !== undefined && (!Number.isInteger(hostId) || hostId <= 0)) {
        issues.hostId = "주최 기관 ID는 1 이상의 정수여야 합니다.";
    }
    if (hasHostId && hasHostName) {
        issues.form = "주최 기관 ID와 기관명 중 하나만 입력해 주세요.";
    }
    if (!hasHostId && !hasHostName) {
        issues.form = "주최 기관 ID 또는 기관명 중 하나를 입력해 주세요.";
    }

    const hasValidStartAt = isValidLocalDateTime(startAt);
    const hasValidEndAt = Boolean(endAt && isValidLocalDateTime(endAt));
    const hasValidRecruitmentStartAt = Boolean(
        recruitmentStartAt && isValidLocalDateTime(recruitmentStartAt),
    );
    const hasValidRecruitmentEndAt = Boolean(
        recruitmentEndAt && isValidLocalDateTime(recruitmentEndAt),
    );

    if (hasValidStartAt && hasValidEndAt && endAt! < startAt) {
        issues.endAt = "행사 종료 일시는 시작 일시 이후여야 합니다.";
    }
    if (
        hasValidRecruitmentStartAt &&
        hasValidRecruitmentEndAt &&
        recruitmentEndAt! < recruitmentStartAt!
    ) {
        issues.recruitmentEndAt = "모집 종료 일시는 모집 시작 일시 이후여야 합니다.";
    }
    if (hasValidStartAt && hasValidRecruitmentEndAt && recruitmentEndAt! > startAt) {
        issues.recruitmentEndAt = "모집 종료 일시는 행사 시작 일시 이전이어야 합니다.";
    }
    if (hasValidStartAt && hasValidRecruitmentStartAt && recruitmentStartAt! >= startAt) {
        issues.recruitmentStartAt = "모집 시작 일시는 행사 시작 일시 이전이어야 합니다.";
    }
    if (hasValidEndAt && hasValidRecruitmentStartAt && recruitmentStartAt! > endAt!) {
        issues.recruitmentStartAt = "모집 시작 일시는 행사 종료 일시 이전이어야 합니다.";
    }
    if (hasValidEndAt && hasValidRecruitmentEndAt && recruitmentEndAt! > endAt!) {
        issues.recruitmentEndAt = "모집 종료 일시는 행사 종료 일시 이전이어야 합니다.";
    }

    return issues;
}

export function getImageFileIssue(file: Pick<File, "name" | "size" | "type">): string | undefined {
    if (file.size > MAX_IMAGE_FILE_BYTES) {
        return "이미지는 파일당 10MB까지 첨부할 수 있습니다.";
    }

    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!(ALLOWED_IMAGE_EXTENSIONS as readonly string[]).includes(extension)) {
        return "JPG, JPEG, PNG, GIF, WEBP 파일만 첨부할 수 있습니다.";
    }

    if (!file.type.startsWith("image/")) {
        return "이미지 파일만 첨부할 수 있습니다.";
    }

    return undefined;
}
