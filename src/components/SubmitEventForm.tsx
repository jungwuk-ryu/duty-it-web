"use client";

import Link from "next/link";
import { type ChangeEvent, type DragEvent, type FocusEvent, type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Upload } from "lucide-react";

import { Button } from "@/src/components/ui/button";
import { DateTimePicker } from "@/src/components/ui/date-time-picker";
import {
    EVENT_SUBMISSION_TYPES,
    EVENT_SUBMISSION_TYPE_LABEL,
    formatDateTimeForApi,
    getEventSubmissionIssues,
    getImageFileIssue,
    isEventSubmissionEventType,
    MAX_TOTAL_UPLOAD_BYTES,
    type EventSubmissionField,
    type EventSubmissionInput,
    type EventSubmissionIssues,
} from "@/src/lib/event-submission";
import { cn } from "@/src/lib/utils";

type HostMethod = "name" | "id";

type HostOption = {
    id: number;
    name: string;
};

type HostOptionsStatus = "idle" | "loading" | "ready" | "error";

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

const MAX_HOST_SUGGESTIONS = 8;

export default function SubmitEventForm() {
    const [values, setValues] = useState<FormValues>(INITIAL_VALUES);
    const [hostMethod, setHostMethod] = useState<HostMethod>("name");
    const [eventThumbnail, setEventThumbnail] = useState<File | null>(null);
    const [eventThumbnailPreviewUrl, setEventThumbnailPreviewUrl] = useState<string | null>(null);
    const [hostThumbnail, setHostThumbnail] = useState<File | null>(null);
    const [selectedHost, setSelectedHost] = useState<HostOption | null>(null);
    const [hostOptions, setHostOptions] = useState<HostOption[]>([]);
    const [hostOptionsStatus, setHostOptionsStatus] = useState<HostOptionsStatus>("idle");
    const [isHostOptionsOpen, setIsHostOptionsOpen] = useState(false);
    const [issues, setIssues] = useState<EventSubmissionIssues>({});
    const [submission, setSubmission] = useState<SubmissionState>({ status: "idle" });
    const hostOptionsRequestedRef = useRef(false);
    const hostNameInputRef = useRef<HTMLInputElement>(null);
    const eventThumbnailPreviewUrlRef = useRef<string | null>(null);

    useEffect(() => () => {
        if (eventThumbnailPreviewUrlRef.current) {
            URL.revokeObjectURL(eventThumbnailPreviewUrlRef.current);
        }
    }, []);

    const filteredHostOptions = useMemo(() => {
        const query = values.hostName.trim().toLowerCase();
        if (!query) return hostOptions;

        return hostOptions.filter((host) => host.name.toLowerCase().includes(query));
    }, [hostOptions, values.hostName]);
    const suggestedHostOptions = filteredHostOptions.slice(0, MAX_HOST_SUGGESTIONS);
    const selectedExistingHost = hostMethod === "name" && selectedHost?.name === values.hostName
        ? selectedHost
        : null;
    const hostNameDescribedBy = [
        "host-name-help",
        issues.hostName ? "host-name-error" : undefined,
    ].filter(Boolean).join(" ") || undefined;

    if (submission.status === "success") {
        return (
            <div className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.12)] sm:p-10">
                <div className="mx-auto flex max-w-md flex-col items-center gap-5 text-center">
                    <span className="flex size-14 items-center justify-center rounded-2xl bg-brand text-xl font-bold text-white" aria-hidden>
                        <Check className="size-8" strokeWidth={3} />
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
                <div className="flex flex-col gap-2">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">행사 제보하기</h1>
                    <p className="max-w-xl text-sm leading-6 text-slate-600">
                        알고 계신 간호 행사를 알려 주세요. 확인을 거쳐 듀잇 행사 목록에 반영합니다.
                    </p>
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
                        <FormField label="행사 시작 일시" required error={issues.startAt} controlId="event-start-at">
                            <DateTimePicker
                                id="event-start-at"
                                value={values.startAt}
                                onChange={(value) => updateValue("startAt", value)}
                                canClear={false}
                                hasError={Boolean(issues.startAt)}
                                describedBy={issues.startAt ? "event-start-at-error" : undefined}
                            />
                        </FormField>
                        <FormField label="행사 종료 일시" error={issues.endAt} controlId="event-end-at">
                            <DateTimePicker
                                id="event-end-at"
                                value={values.endAt}
                                min={values.startAt || undefined}
                                onChange={(value) => updateValue("endAt", value)}
                                hasError={Boolean(issues.endAt)}
                                describedBy={issues.endAt ? "event-end-at-error" : undefined}
                            />
                        </FormField>
                        <FormField label="모집 시작 일시" error={issues.recruitmentStartAt} controlId="recruitment-start-at">
                            <DateTimePicker
                                id="recruitment-start-at"
                                value={values.recruitmentStartAt}
                                max={values.startAt || undefined}
                                onChange={(value) => updateValue("recruitmentStartAt", value)}
                                hasError={Boolean(issues.recruitmentStartAt)}
                                describedBy={issues.recruitmentStartAt ? "recruitment-start-at-error" : undefined}
                            />
                        </FormField>
                        <FormField label="모집 종료 일시" error={issues.recruitmentEndAt} controlId="recruitment-end-at">
                            <DateTimePicker
                                id="recruitment-end-at"
                                value={values.recruitmentEndAt}
                                max={values.startAt || undefined}
                                onChange={(value) => updateValue("recruitmentEndAt", value)}
                                hasError={Boolean(issues.recruitmentEndAt)}
                                describedBy={issues.recruitmentEndAt ? "recruitment-end-at-error" : undefined}
                            />
                        </FormField>
                    </div>
                </fieldset>

                <fieldset className="flex flex-col gap-5">
                    <div className="flex flex-col gap-1">
                        <legend className="text-base font-bold text-slate-900">주최 기관</legend>
                        <p className="text-xs leading-5 text-slate-500">기관명을 입력해 기존 주최 기관을 선택하거나, 목록에 없으면 새 기관으로 등록할 수 있습니다.</p>
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
                            <FormField label="주최 기관명" required error={issues.hostName} controlId="host-name">
                                <div className="relative" onBlur={closeHostOptionsOnBlur}>
                                    <input
                                        ref={hostNameInputRef}
                                        id="host-name"
                                        value={values.hostName}
                                        onChange={handleHostNameChange}
                                        onFocus={openHostOptions}
                                        role="combobox"
                                        aria-autocomplete="list"
                                        aria-controls="existing-host-options"
                                        aria-expanded={isHostOptionsOpen}
                                        aria-invalid={Boolean(issues.hostName)}
                                        aria-describedby={hostNameDescribedBy}
                                        className={cn(inputClassName(issues.hostName), "pr-11")}
                                        placeholder="예: 대한간호협회"
                                    />
                                    <button
                                        type="button"
                                        className="absolute inset-y-1 right-1 flex size-10 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand/50"
                                        aria-label="등록된 주최 기관 목록 열기"
                                        aria-expanded={isHostOptionsOpen}
                                        aria-controls="existing-host-options"
                                        onMouseDown={(event) => event.preventDefault()}
                                        onClick={() => changeHostOptionsOpen(!isHostOptionsOpen)}
                                    >
                                        <ChevronDown
                                            className={cn("size-4 transition-transform", isHostOptionsOpen && "rotate-180")}
                                            aria-hidden
                                        />
                                    </button>
                                    {isHostOptionsOpen && (
                                        <div
                                            id="existing-host-options"
                                            role="listbox"
                                            aria-label="등록된 주최 기관"
                                            className="absolute left-0 top-[calc(100%+0.375rem)] z-20 max-h-80 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white p-1 text-gray-900 shadow-lg shadow-black/5"
                                        >
                                            {hostOptionsStatus === "loading" || hostOptionsStatus === "idle" ? (
                                                <p className="px-3 py-3 text-sm text-slate-500" role="status">
                                                    등록된 주최 기관을 불러오는 중이에요.
                                                </p>
                                            ) : hostOptionsStatus === "error" ? (
                                                <button
                                                    type="button"
                                                    className="w-full cursor-pointer rounded-md px-3 py-3 text-left text-sm leading-5 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus:bg-slate-100 focus:text-slate-900 focus:outline-none"
                                                    onClick={() => void loadHostOptions(true)}
                                                >
                                                    목록을 불러오지 못했어요. 다시 시도해 주세요.
                                                </button>
                                            ) : suggestedHostOptions.length === 0 ? (
                                                <p className="px-3 py-3 text-sm leading-5 text-slate-500">
                                                    일치하는 주최 기관이 없어요. 입력한 이름으로 새 기관을 등록할 수 있습니다.
                                                </p>
                                            ) : (
                                                <>
                                                    <p className="px-3 py-2 text-xs font-medium text-slate-500">
                                                        {values.hostName.trim()
                                                            ? `“${values.hostName.trim()}”와 일치하는 주최 기관`
                                                            : "등록된 주최 기관"}
                                                    </p>
                                                    <div className="mx-1 h-px bg-gray-100" />
                                                    {suggestedHostOptions.map((host) => {
                                                        const isSelected = selectedExistingHost?.id === host.id;

                                                        return (
                                                            <button
                                                                key={host.id}
                                                                type="button"
                                                                role="option"
                                                                aria-selected={isSelected}
                                                                className={cn(
                                                                    "relative flex w-full cursor-pointer items-center rounded-md py-2 pl-8 pr-3 text-left text-sm font-medium leading-5 text-slate-800 transition-colors hover:bg-gray-100 focus:bg-gray-100 focus:text-slate-900 focus:outline-none",
                                                                    isSelected && "bg-gray-100 text-slate-900",
                                                                )}
                                                                onClick={() => selectHost(host)}
                                                            >
                                                                <span className="absolute left-2 flex size-4 items-center justify-center text-brand" aria-hidden>
                                                                    {isSelected ? "✓" : ""}
                                                                </span>
                                                                {host.name}
                                                            </button>
                                                        );
                                                    })}
                                                    {filteredHostOptions.length > MAX_HOST_SUGGESTIONS && (
                                                        <>
                                                            <div className="mx-1 h-px bg-gray-100" />
                                                            <p className="px-3 py-2 text-xs leading-5 text-slate-500">
                                                                상위 {MAX_HOST_SUGGESTIONS}개만 표시합니다. 기관명을 더 입력해 주세요.
                                                            </p>
                                                        </>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <p id="host-name-help" className="text-xs leading-5 text-slate-500">
                                    목록에서 선택하면 해당 기관에 연결됩니다.
                                </p>
                            </FormField>
                            {selectedExistingHost ? (
                                <p className="rounded-xl border border-brand/20 bg-red-50 px-4 py-3 text-sm leading-6 text-slate-700">
                                    <span className="mr-2 font-semibold text-brand">선택됨</span>
                                    {selectedExistingHost.name}에 행사 정보를 연결합니다.
                                </p>
                            ) : (
                                <FileField
                                    id="host-thumbnail"
                                    label="주최 기관 로고"
                                    description="새 주최 기관이면 로고를 함께 첨부할 수 있어요."
                                    file={hostThumbnail}
                                    error={issues.hostThumbnail}
                                    onChange={(file) => updateFile("hostThumbnail", file)}
                                />
                            )}
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

                <EventSubmissionPreview
                    values={values}
                    selectedHostName={selectedExistingHost?.name}
                    thumbnailUrl={eventThumbnailPreviewUrl}
                />

                <div className="flex flex-col gap-3 border-t border-gray-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs leading-5 text-slate-500">제보 내용은 검토 후 공개되며, 필요하면 주최 페이지 정보가 우선 반영됩니다.</p>
                    <Button type="submit" size="lg" className="h-12 shrink-0 rounded-xl px-6" disabled={isSubmitting}>
                        {isSubmitting ? "제보 보내는 중…" : "행사 제보 보내기"}
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
        setSelectedHost(null);
        setIsHostOptionsOpen(false);
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

    function handleHostNameChange(event: ChangeEvent<HTMLInputElement>) {
        updateValue("hostName", event.target.value);
        setSelectedHost(null);
        setHostThumbnail(null);
        setIsHostOptionsOpen(true);
        void loadHostOptions();
    }

    function openHostOptions() {
        setIsHostOptionsOpen(true);
        void loadHostOptions();
    }

    function changeHostOptionsOpen(nextOpen: boolean) {
        setIsHostOptionsOpen(nextOpen);
        if (nextOpen) void loadHostOptions();
    }

    function closeHostOptionsOnBlur(event: FocusEvent<HTMLDivElement>) {
        if (event.currentTarget.contains(event.relatedTarget)) return;

        setIsHostOptionsOpen(false);
    }

    async function loadHostOptions(retry = false) {
        if (hostOptionsRequestedRef.current && !retry) return;

        hostOptionsRequestedRef.current = true;
        setHostOptionsStatus("loading");

        try {
            const response = await fetch("/api/hosts");
            const body: unknown = await response.json().catch(() => null);
            if (!response.ok || !isHostListResponse(body)) {
                throw new Error("Failed to load hosts");
            }

            setHostOptions(body.hosts);
            setHostOptionsStatus("ready");
        } catch {
            hostOptionsRequestedRef.current = false;
            setHostOptionsStatus("error");
        }
    }

    function selectHost(host: HostOption) {
        setValues((current) => ({ ...current, hostName: host.name }));
        setSelectedHost(host);
        setHostThumbnail(null);
        setIsHostOptionsOpen(false);
        clearIssue("hostName");
        setSubmission({ status: "idle" });
    }

    function updateFile(field: "eventThumbnail" | "hostThumbnail", file: File | null) {
        if (field === "eventThumbnail") {
            setEventThumbnail(file);
            replaceEventThumbnailPreview(file);
        } else {
            setHostThumbnail(file);
        }

        const issue = file ? getImageFileIssue(file) : undefined;
        setIssues((current) => ({ ...current, [field]: issue }));
        setSubmission({ status: "idle" });
    }

    function replaceEventThumbnailPreview(file: File | null) {
        if (eventThumbnailPreviewUrlRef.current) {
            URL.revokeObjectURL(eventThumbnailPreviewUrlRef.current);
        }

        const nextUrl = file ? URL.createObjectURL(file) : null;
        eventThumbnailPreviewUrlRef.current = nextUrl;
        setEventThumbnailPreviewUrl(nextUrl);
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
        const linkedHost = hostMethod === "name" && selectedHost?.name === values.hostName
            ? selectedHost
            : null;
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
            ...(hostMethod === "name"
                ? linkedHost ? { hostId: linkedHost.id } : { hostName: values.hostName }
                : { hostId: parsedHostId }),
        };
        const nextIssues = getEventSubmissionIssues(payload);

        if (hostMethod === "name" && !linkedHost && !values.hostName.trim()) {
            nextIssues.hostName = "주최 기관명을 입력해 주세요.";
            delete nextIssues.form;
        }
        if (hostMethod === "id" && !/^[1-9]\d*$/.test(rawHostId)) {
            nextIssues.hostId = "주최 기관 ID는 1 이상의 정수여야 합니다.";
            delete nextIssues.form;
        }

        const visibleUploads = [eventThumbnail, hostMethod === "name" && !linkedHost ? hostThumbnail : null].filter(
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
        const linkedHost = hostMethod === "name" && selectedHost?.name === values.hostName
            ? selectedHost
            : null;
        if (hostMethod === "name" && !linkedHost && hostThumbnail) {
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
            replaceEventThumbnailPreview(null);
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
        replaceEventThumbnailPreview(null);
        setHostThumbnail(null);
        setSelectedHost(null);
        setIsHostOptionsOpen(false);
        setIssues({});
        setSubmission({ status: "idle" });
    }
}

function FormField({
    label,
    required = false,
    error,
    controlId: explicitControlId,
    children,
}: {
    label: string;
    required?: boolean;
    error?: string;
    controlId?: string;
    children: React.ReactNode;
}) {
    const control = Array.isArray(children) ? children[0] : children;
    const controlId = explicitControlId ?? (isReactElementWithId(control) ? control.props.id : undefined);

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
    const [isDragging, setIsDragging] = useState(false);

    function hasFiles(event: DragEvent<HTMLLabelElement>) {
        return Array.from(event.dataTransfer.types).includes("Files");
    }

    function handleDragEnter(event: DragEvent<HTMLLabelElement>) {
        if (!hasFiles(event)) return;
        event.preventDefault();
        setIsDragging(true);
    }

    function handleDragOver(event: DragEvent<HTMLLabelElement>) {
        if (!hasFiles(event)) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
        setIsDragging(true);
    }

    function handleDragLeave(event: DragEvent<HTMLLabelElement>) {
        if (!hasFiles(event)) return;
        const nextTarget = event.relatedTarget;
        if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) return;
        setIsDragging(false);
    }

    function handleDrop(event: DragEvent<HTMLLabelElement>) {
        if (!hasFiles(event)) return;
        event.preventDefault();
        setIsDragging(false);
        onChange(event.dataTransfer.files.item(0));
    }

    return (
        <div className="flex flex-col gap-2">
            <label htmlFor={id} className="text-sm font-semibold text-slate-800">
                {label}
            </label>
            <label
                className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-xl border border-dashed bg-white px-4 py-3 transition-colors hover:border-brand/60",
                    error ? "border-red-400" : "border-gray-300",
                    isDragging && "border-brand bg-red-50 ring-2 ring-brand/15",
                )}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <Upload className="size-5 shrink-0 text-brand" aria-hidden />
                <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-slate-800">
                        {file ? file.name : "이미지 파일 선택"}
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-slate-500" aria-live="polite">
                        {isDragging ? "여기에 놓아 추가하세요." : description}
                    </span>
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

function EventSubmissionPreview({
    values,
    selectedHostName,
    thumbnailUrl,
}: {
    values: FormValues;
    selectedHostName?: string;
    thumbnailUrl: string | null;
}) {
    const eventTypeLabel = isEventSubmissionEventType(values.eventType)
        ? EVENT_SUBMISSION_TYPE_LABEL[values.eventType]
        : "행사 유형";
    const hostName = (selectedHostName ?? values.hostName.trim())
        || (values.hostId.trim() ? "등록된 주최 기관" : "주최 기관명을 입력해 주세요");
    const title = values.title.trim() || "행사 제목을 입력해 주세요";

    return (
        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5" aria-labelledby="event-preview-title">
            <div className="flex flex-col gap-1">
                <h2 id="event-preview-title" className="text-base font-bold text-slate-900">행사 카드 미리보기</h2>
                <p className="text-xs leading-5 text-slate-500">입력한 내용이 행사 목록에서 이렇게 보입니다.</p>
            </div>

            <article className="mx-auto mt-4 flex max-w-sm flex-col overflow-hidden rounded-2xl bg-white shadow-[0_8px_22px_rgba(15,23,42,0.10)]">
                <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                    {/* blob URL은 Next Image 최적화 대상이 아니므로 로컬 미리보기로만 사용합니다. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={thumbnailUrl ?? "/event-thumbnail-placeholder.svg"}
                        alt=""
                        className="size-full object-cover"
                        decoding="async"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                        <h3 className="line-clamp-3 text-xl font-bold leading-snug drop-shadow-sm">{title}</h3>
                    </div>
                </div>

                <div className="flex flex-1 flex-col p-5">
                    <div className="flex min-h-8 items-center justify-between gap-2">
                        <span className="inline-flex h-8 shrink-0 items-center whitespace-nowrap rounded-full bg-slate-100 px-2.5 text-xs font-semibold text-slate-700">
                            {eventTypeLabel}
                        </span>
                        <span className="shrink-0 whitespace-nowrap text-sm font-bold text-brand">검토 예정</span>
                    </div>

                    <p className="mt-5 min-h-10 line-clamp-2 text-sm font-semibold leading-5 text-gray-900">
                        <span className="mr-2 text-gray-400">주최</span>
                        {hostName}
                    </p>

                    <dl className="mt-auto grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-x-1.5 border-t border-gray-200 pt-4 text-xs">
                        <div className="min-w-0">
                            <dt className="text-gray-500">일시</dt>
                            <dd className="mt-1 whitespace-nowrap font-semibold text-gray-900">{formatPreviewDate(values.startAt)}</dd>
                        </div>
                        <div className="min-w-0">
                            <dt className="text-gray-500">마감</dt>
                            <dd className="mt-1 whitespace-nowrap font-semibold text-gray-900">{formatPreviewDate(values.recruitmentEndAt)}</dd>
                        </div>
                        <div className="min-w-7">
                            <dt className="text-gray-500">조회</dt>
                            <dd className="mt-1 font-semibold text-gray-900">0</dd>
                        </div>
                    </dl>
                </div>
            </article>
        </section>
    );
}

function formatPreviewDate(value: string): string {
    const [date] = value.split("T");
    const [year, month, day] = date.split("-");
    if (!year || !month || !day) return "-";

    return `${year}. ${Number(month)}. ${Number(day)}.`;
}

function isReactElementWithId(
    child: React.ReactNode,
): child is React.ReactElement<{ id?: string }> {
    return typeof child === "object" && child !== null && "props" in child;
}

function isHostListResponse(value: unknown): value is { hosts: HostOption[] } {
    return (
        typeof value === "object"
        && value !== null
        && "hosts" in value
        && Array.isArray(value.hosts)
        && value.hosts.every(isHostOption)
    );
}

function isHostOption(value: unknown): value is HostOption {
    if (typeof value !== "object" || value === null) return false;

    const host = value as Partial<HostOption>;
    return (
        typeof host.id === "number"
        && Number.isSafeInteger(host.id)
        && host.id > 0
        && typeof host.name === "string"
        && Boolean(host.name.trim())
    );
}
