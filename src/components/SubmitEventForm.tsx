"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import { Send, Upload } from "lucide-react";

import { Button } from "@/src/components/ui/button";
import {
    EVENT_SUBMISSION_TYPES,
    EVENT_SUBMISSION_TYPE_LABEL,
    formatDateTimeForApi,
    getEventSubmissionIssues,
    getImageFileIssue,
    MAX_TOTAL_UPLOAD_BYTES,
    type EventSubmissionField,
    type EventSubmissionInput,
    type EventSubmissionIssues,
} from "@/src/lib/event-submission";
import { cn } from "@/src/lib/utils";

type HostMethod = "name" | "id";

type FormValues = {
    title: string;
    uri: string;
    eventType: string;
    startAt: string;
    endAt: string;
    recruitmentStartAt: string;
    recruitmentEndAt: string;
    hostName: string;
    hostId: string;
};

type SubmissionState =
    | { status: "idle" }
    | { status: "submitting" }
    | { status: "success"; message: string }
    | { status: "error"; message: string };

const INITIAL_VALUES: FormValues = {
    title: "",
    uri: "",
    eventType: "",
    startAt: "",
    endAt: "",
    recruitmentStartAt: "",
    recruitmentEndAt: "",
    hostName: "",
    hostId: "",
};

export default function SubmitEventForm() {
    const [values, setValues] = useState<FormValues>(INITIAL_VALUES);
    const [hostMethod, setHostMethod] = useState<HostMethod>("name");
    const [eventThumbnail, setEventThumbnail] = useState<File | null>(null);
    const [hostThumbnail, setHostThumbnail] = useState<File | null>(null);
    const [issues, setIssues] = useState<EventSubmissionIssues>({});
    const [submission, setSubmission] = useState<SubmissionState>({ status: "idle" });

    if (submission.status === "success") {
        return (
            <div className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.12)] sm:p-10">
                <div className="mx-auto flex max-w-md flex-col items-center gap-5 text-center">
                    <span className="flex size-14 items-center justify-center rounded-2xl bg-brand text-xl font-bold text-white" aria-hidden>
                        듀
                    </span>
                    <div className="flex flex-col gap-2">
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">행사 제보가 접수되었어요</h1>
                        <p className="leading-7 text-slate-600">{submission.message}</p>
                    </div>
                    <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
                        <Button type="button" variant="outline" className="h-11 rounded-xl" onClick={resetForm}>
                            다른 행사 제보하기
                        </Button>
                        <Button asChild className="h-11 rounded-xl">
                            <Link href="/events">행사 목록 보기</Link>
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    const isSubmitting = submission.status === "submitting";

    return (
        <div className="rounded-[2rem] border border-gray-200 bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.12)] sm:p-8 lg:p-10">
            <div className="flex flex-col gap-6 border-b border-gray-200 pb-7 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex gap-4">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-brand text-lg font-bold text-white" aria-hidden>
                        듀
                    </span>
                    <div className="flex flex-col gap-2">
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">행사 제보하기</h1>
                        <p className="max-w-xl text-sm leading-6 text-slate-600">
                            알고 계신 간호 행사를 알려 주세요. 확인을 거쳐 듀잇 행사 목록에 반영합니다.
                        </p>
                    </div>
                </div>
                <span className="w-fit rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-brand">
                    검토 후 공개
                </span>
            </div>

            <form className="mt-8 flex flex-col gap-8" noValidate onSubmit={handleSubmit}>
                {submission.status === "error" && (
                    <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700" role="alert">
                        {submission.message}
                    </p>
                )}

                <fieldset className="flex flex-col gap-5">
                    <legend className="text-base font-bold text-slate-900">기본 정보</legend>
                    <div className="flex flex-col gap-5">
                        <FormField label="행사 제목" required error={issues.title}>
                            <input
                                id="event-title"
                                value={values.title}
                                onChange={(event) => updateValue("title", event.target.value)}
                                aria-invalid={Boolean(issues.title)}
                                aria-describedby={issues.title ? "event-title-error" : undefined}
                                className={inputClassName(issues.title)}
                                placeholder="예: 2026 간호 실무 심포지엄"
                            />
                        </FormField>

                        <FormField label="행사 상세 페이지" required error={issues.uri}>
                            <input
                                id="event-uri"
                                type="url"
                                inputMode="url"
                                value={values.uri}
                                onChange={(event) => updateValue("uri", event.target.value)}
                                aria-invalid={Boolean(issues.uri)}
                                aria-describedby={issues.uri ? "event-uri-error" : undefined}
                                className={inputClassName(issues.uri)}
                                placeholder="https://example.com/event"
                            />
                            <p className="text-xs leading-5 text-slate-500">신청 또는 안내 내용을 확인할 수 있는 주소를 입력해 주세요.</p>
                        </FormField>

                        <FormField label="행사 유형" required error={issues.eventType}>
                            <select
                                id="event-type"
                                value={values.eventType}
                                onChange={(event) => updateValue("eventType", event.target.value)}
                                aria-invalid={Boolean(issues.eventType)}
                                aria-describedby={issues.eventType ? "event-type-error" : undefined}
                                className={inputClassName(issues.eventType)}
                            >
                                <option value="" disabled>
                                    행사 유형을 선택해 주세요
                                </option>
                                {EVENT_SUBMISSION_TYPES.map((eventType) => (
                                    <option key={eventType} value={eventType}>
                                        {EVENT_SUBMISSION_TYPE_LABEL[eventType]}
                                    </option>
                                ))}
                            </select>
                        </FormField>
                    </div>
                </fieldset>

                <fieldset className="flex flex-col gap-5 rounded-2xl bg-slate-50 p-4 sm:p-5">
                    <div className="flex flex-col gap-1">
                        <legend className="text-base font-bold text-slate-900">일정</legend>
                        <p className="text-xs leading-5 text-slate-500">행사 시작 일시는 필수이고, 나머지 일정은 알 수 있을 때만 입력해 주세요.</p>
                    </div>
                    <div className="grid gap-5 sm:grid-cols-2">
                        <FormField label="행사 시작 일시" required error={issues.startAt}>
                            <input
                                id="event-start-at"
                                type="datetime-local"
                                value={values.startAt}
                                onChange={(event) => updateValue("startAt", event.target.value)}
                                aria-invalid={Boolean(issues.startAt)}
                                aria-describedby={issues.startAt ? "event-start-at-error" : undefined}
                                className={inputClassName(issues.startAt)}
                            />
                        </FormField>
                        <FormField label="행사 종료 일시" error={issues.endAt}>
                            <input
                                id="event-end-at"
                                type="datetime-local"
                                value={values.endAt}
                                min={values.startAt || undefined}
                                onChange={(event) => updateValue("endAt", event.target.value)}
                                aria-invalid={Boolean(issues.endAt)}
                                aria-describedby={issues.endAt ? "event-end-at-error" : undefined}
                                className={inputClassName(issues.endAt)}
                            />
                        </FormField>
                        <FormField label="모집 시작 일시" error={issues.recruitmentStartAt}>
                            <input
                                id="recruitment-start-at"
                                type="datetime-local"
                                value={values.recruitmentStartAt}
                                max={values.startAt || undefined}
                                onChange={(event) => updateValue("recruitmentStartAt", event.target.value)}
                                aria-invalid={Boolean(issues.recruitmentStartAt)}
                                aria-describedby={issues.recruitmentStartAt ? "recruitment-start-at-error" : undefined}
                                className={inputClassName(issues.recruitmentStartAt)}
                            />
                        </FormField>
                        <FormField label="모집 종료 일시" error={issues.recruitmentEndAt}>
                            <input
                                id="recruitment-end-at"
                                type="datetime-local"
                                value={values.recruitmentEndAt}
                                max={values.startAt || undefined}
                                onChange={(event) => updateValue("recruitmentEndAt", event.target.value)}
                                aria-invalid={Boolean(issues.recruitmentEndAt)}
                                aria-describedby={issues.recruitmentEndAt ? "recruitment-end-at-error" : undefined}
                                className={inputClassName(issues.recruitmentEndAt)}
                            />
                        </FormField>
                    </div>
                </fieldset>

                <fieldset className="flex flex-col gap-5">
                    <div className="flex flex-col gap-1">
                        <legend className="text-base font-bold text-slate-900">주최 기관</legend>
                        <p className="text-xs leading-5 text-slate-500">기관명으로 입력하면 등록된 기관을 찾아 연결하고, 없으면 새 기관으로 등록합니다.</p>
                    </div>

                    <div className="grid grid-cols-2 rounded-xl bg-slate-100 p-1" role="radiogroup" aria-label="주최 기관 입력 방식">
                        <label
                            className={cn(
                                "flex cursor-pointer items-center justify-center rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors",
                                hostMethod === "name" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700",
                            )}
                        >
                            <input
                                type="radio"
                                name="host-method"
                                value="name"
                                checked={hostMethod === "name"}
                                onChange={() => changeHostMethod("name")}
                                className="sr-only"
                            />
                            기관명으로 입력
                        </label>
                        <label
                            className={cn(
                                "flex cursor-pointer items-center justify-center rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors",
                                hostMethod === "id" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700",
                            )}
                        >
                            <input
                                type="radio"
                                name="host-method"
                                value="id"
                                checked={hostMethod === "id"}
                                onChange={() => changeHostMethod("id")}
                                className="sr-only"
                            />
                            등록 기관 ID
                        </label>
                    </div>

                    {hostMethod === "name" ? (
                        <div className="flex flex-col gap-5">
                            <FormField label="주최 기관명" required error={issues.hostName}>
                                <input
                                    id="host-name"
                                    value={values.hostName}
                                    onChange={(event) => updateValue("hostName", event.target.value)}
                                    aria-invalid={Boolean(issues.hostName)}
                                    aria-describedby={issues.hostName ? "host-name-error" : undefined}
                                    className={inputClassName(issues.hostName)}
                                    placeholder="예: 대한간호협회"
                                />
                            </FormField>
                            <FileField
                                id="host-thumbnail"
                                label="주최 기관 로고"
                                description="새 주최 기관이면 로고를 함께 첨부할 수 있어요."
                                file={hostThumbnail}
                                error={issues.hostThumbnail}
                                onChange={(file) => updateFile("hostThumbnail", file)}
                            />
                        </div>
                    ) : (
                        <FormField label="등록된 주최 기관 ID" required error={issues.hostId}>
                            <input
                                id="host-id"
                                type="number"
                                min="1"
                                step="1"
                                inputMode="numeric"
                                value={values.hostId}
                                onChange={(event) => updateValue("hostId", event.target.value)}
                                aria-invalid={Boolean(issues.hostId)}
                                aria-describedby={issues.hostId ? "host-id-error" : undefined}
                                className={inputClassName(issues.hostId)}
                                placeholder="예: 1"
                            />
                            <p className="text-xs leading-5 text-slate-500">관리자에게 받은 기관 ID가 있는 경우에만 입력해 주세요.</p>
                        </FormField>
                    )}
                </fieldset>

                <fieldset className="flex flex-col gap-4 rounded-2xl border border-dashed border-gray-300 p-4 sm:p-5">
                    <div className="flex flex-col gap-1">
                        <legend className="text-base font-bold text-slate-900">이미지 첨부</legend>
                        <p className="text-xs leading-5 text-slate-500">선택 사항 · JPG, JPEG, PNG, GIF, WEBP · 파일당 10MB, 전체 20MB까지</p>
                    </div>
                    <FileField
                        id="event-thumbnail"
                        label="행사 썸네일"
                        description="행사 안내 이미지를 첨부하면 목록에서 더 쉽게 확인할 수 있어요."
                        file={eventThumbnail}
                        error={issues.eventThumbnail}
                        onChange={(file) => updateFile("eventThumbnail", file)}
                    />
                </fieldset>

                {issues.form && (
                    <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700" role="alert">
                        {issues.form}
                    </p>
                )}

                <div className="flex flex-col gap-3 border-t border-gray-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs leading-5 text-slate-500">제보 내용은 검토 후 공개되며, 필요하면 주최 페이지 정보가 우선 반영됩니다.</p>
                    <Button type="submit" size="lg" className="h-12 shrink-0 rounded-xl px-6" disabled={isSubmitting}>
                        {isSubmitting ? "제보 보내는 중…" : "행사 제보 보내기"}
                        {!isSubmitting && <Send data-icon="inline-end" aria-hidden />}
                    </Button>
                </div>
            </form>
        </div>
    );

    function updateValue<Key extends keyof FormValues>(key: Key, value: FormValues[Key]) {
        setValues((current) => ({ ...current, [key]: value }));
        clearIssue(key);
        setSubmission({ status: "idle" });
    }

    function changeHostMethod(nextMethod: HostMethod) {
        setHostMethod(nextMethod);
        setIssues((current) => {
            const next = { ...current };
            delete next.hostId;
            delete next.hostName;
            delete next.hostThumbnail;
            delete next.form;
            return next;
        });
        setSubmission({ status: "idle" });
    }

    function updateFile(field: "eventThumbnail" | "hostThumbnail", file: File | null) {
        if (field === "eventThumbnail") {
            setEventThumbnail(file);
        } else {
            setHostThumbnail(file);
        }

        const issue = file ? getImageFileIssue(file) : undefined;
        setIssues((current) => ({ ...current, [field]: issue }));
        setSubmission({ status: "idle" });
    }

    function clearIssue(field: EventSubmissionField) {
        setIssues((current) => {
            const next = { ...current };
            delete next[field];
            delete next.form;
            return next;
        });
    }

    function getPayloadAndIssues(): { payload: EventSubmissionInput; nextIssues: EventSubmissionIssues } {
        const rawHostId = values.hostId.trim();
        const parsedHostId = /^\d+$/.test(rawHostId) ? Number(rawHostId) : undefined;
        const payload: EventSubmissionInput = {
            title: values.title,
            startAt: formatDateTimeForApi(values.startAt),
            endAt: values.endAt ? formatDateTimeForApi(values.endAt) : undefined,
            recruitmentStartAt: values.recruitmentStartAt
                ? formatDateTimeForApi(values.recruitmentStartAt)
                : undefined,
            recruitmentEndAt: values.recruitmentEndAt
                ? formatDateTimeForApi(values.recruitmentEndAt)
                : undefined,
            uri: values.uri,
            eventType: values.eventType,
            ...(hostMethod === "name" ? { hostName: values.hostName } : { hostId: parsedHostId }),
        };
        const nextIssues = getEventSubmissionIssues(payload);

        if (hostMethod === "name" && !values.hostName.trim()) {
            nextIssues.hostName = "주최 기관명을 입력해 주세요.";
            delete nextIssues.form;
        }
        if (hostMethod === "id" && !/^[1-9]\d*$/.test(rawHostId)) {
            nextIssues.hostId = "주최 기관 ID는 1 이상의 정수여야 합니다.";
            delete nextIssues.form;
        }

        const visibleUploads = [eventThumbnail, hostMethod === "name" ? hostThumbnail : null].filter(
            (file): file is File => file !== null,
        );
        const totalUploadBytes = visibleUploads.reduce((total, file) => total + file.size, 0);
        if (totalUploadBytes > MAX_TOTAL_UPLOAD_BYTES) {
            nextIssues.form = "첨부 이미지의 합계는 20MB를 초과할 수 없습니다.";
        }

        return { payload, nextIssues };
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const { payload, nextIssues } = getPayloadAndIssues();
        if (Object.keys(nextIssues).length > 0) {
            setIssues(nextIssues);
            setSubmission({ status: "idle" });
            return;
        }

        setIssues({});
        setSubmission({ status: "submitting" });

        const formData = new FormData();
        formData.set("data", new Blob([JSON.stringify(payload)], { type: "application/json" }), "event.json");
        if (eventThumbnail) formData.set("eventThumbnail", eventThumbnail, eventThumbnail.name);
        if (hostMethod === "name" && hostThumbnail) {
            formData.set("hostThumbnail", hostThumbnail, hostThumbnail.name);
        }

        try {
            const response = await fetch("/api/submit-event", {
                method: "POST",
                body: formData,
            });
            const body = (await response.json().catch(() => null)) as { message?: unknown } | null;
            const message = typeof body?.message === "string" ? body.message : undefined;

            if (!response.ok) {
                throw new Error(message ?? "제보를 접수하지 못했습니다. 잠시 뒤 다시 시도해 주세요.");
            }

            setSubmission({
                status: "success",
                message: message ?? "행사 제보가 접수되었습니다. 검토 후 목록에 반영됩니다.",
            });
        } catch (error) {
            setSubmission({
                status: "error",
                message: error instanceof Error ? error.message : "제보를 접수하지 못했습니다. 잠시 뒤 다시 시도해 주세요.",
            });
        }
    }

    function resetForm() {
        setValues(INITIAL_VALUES);
        setHostMethod("name");
        setEventThumbnail(null);
        setHostThumbnail(null);
        setIssues({});
        setSubmission({ status: "idle" });
    }
}

function FormField({
    label,
    required = false,
    error,
    children,
}: {
    label: string;
    required?: boolean;
    error?: string;
    children: React.ReactNode;
}) {
    const control = Array.isArray(children) ? children[0] : children;
    const controlId = isReactElementWithId(control) ? control.props.id : undefined;

    return (
        <div className="flex flex-col gap-2">
            <label htmlFor={controlId} className="text-sm font-semibold text-slate-800">
                {label}
                {required && <span className="ml-1 text-brand">*</span>}
            </label>
            {children}
            {error && controlId && (
                <p id={`${controlId}-error`} className="text-xs leading-5 text-red-600" role="alert">
                    {error}
                </p>
            )}
        </div>
    );
}

function FileField({
    id,
    label,
    description,
    file,
    error,
    onChange,
}: {
    id: string;
    label: string;
    description: string;
    file: File | null;
    error?: string;
    onChange: (file: File | null) => void;
}) {
    return (
        <div className="flex flex-col gap-2">
            <label htmlFor={id} className="text-sm font-semibold text-slate-800">
                {label}
            </label>
            <label
                className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-xl border border-dashed bg-white px-4 py-3 transition-colors hover:border-brand/60",
                    error ? "border-red-400" : "border-gray-300",
                )}
            >
                <Upload className="size-5 shrink-0 text-brand" aria-hidden />
                <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-slate-800">
                        {file ? file.name : "이미지 파일 선택"}
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-slate-500">{description}</span>
                </span>
                <span className="shrink-0 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">선택</span>
                <input
                    id={id}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp,.jpg,.jpeg,.png,.gif,.webp"
                    className="sr-only"
                    onChange={(event) => onChange(event.target.files?.[0] ?? null)}
                />
            </label>
            {error && <p className="text-xs leading-5 text-red-600" role="alert">{error}</p>}
        </div>
    );
}

function inputClassName(hasError?: string) {
    return cn(
        "h-12 w-full rounded-xl border bg-white px-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/15",
        hasError ? "border-red-400" : "border-gray-300",
    );
}

function isReactElementWithId(
    child: React.ReactNode,
): child is React.ReactElement<{ id?: string }> {
    return typeof child === "object" && child !== null && "props" in child;
}
