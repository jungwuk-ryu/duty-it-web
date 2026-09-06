"use client";

import { CalendarDays, ChevronLeft, ChevronRight, Clock3, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/src/lib/utils";

type DateTimePickerProps = {
    id: string;
    value: string;
    onChange: (value: string) => void;
    min?: string;
    max?: string;
    canClear?: boolean;
    hasError?: boolean;
    describedBy?: string;
};

const WEEKDAYS = ["월", "화", "수", "목", "금", "토", "일"];
const DATE_TIME_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;
const MONTH_FORMATTER = new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "long" });

export function DateTimePicker({
    id,
    value,
    onChange,
    min,
    max,
    canClear = true,
    hasError = false,
    describedBy,
}: DateTimePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(new Date()));
    const [draftDate, setDraftDate] = useState("");
    const [draftTime, setDraftTime] = useState("");
    const [draftIssue, setDraftIssue] = useState<string | null>(null);
    const pickerRef = useRef<HTMLDivElement>(null);
    const dateInputRef = useRef<HTMLInputElement>(null);
    const timeInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!isOpen) return;

        const closeOnOutsidePress = (event: PointerEvent) => {
            if (!pickerRef.current?.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setIsOpen(false);
            }
        };

        document.addEventListener("pointerdown", closeOnOutsidePress);
        document.addEventListener("keydown", closeOnEscape);

        return () => {
            document.removeEventListener("pointerdown", closeOnOutsidePress);
            document.removeEventListener("keydown", closeOnEscape);
        };
    }, [isOpen]);

    const displayedDate = toLocalDate(value);
    const selectedDate = draftDate ? toDateOnly(draftDate) : null;
    const days = getCalendarDays(visibleMonth);
    const minValue = normalizeLocalDateTime(min);
    const maxValue = normalizeLocalDateTime(max);

    function openPicker() {
        const nextValue = getInitialDraftValue(value, minValue, maxValue);
        const [nextDate, nextTime] = nextValue.split("T");
        const nextSelectedDate = toDateOnly(nextDate);

        setDraftDate(nextDate);
        setDraftTime(nextTime);
        setVisibleMonth(startOfMonth(nextSelectedDate ?? new Date()));
        setDraftIssue(null);
        setIsOpen(true);
    }

    function closePicker() {
        setDraftIssue(null);
        setIsOpen(false);
    }

    function selectDate(date: Date) {
        if (!isDateAllowed(date, minValue, maxValue)) return;

        setDraftDate(toDateInputValue(date));
        setDraftIssue(null);
    }

    function changeDraftDate(nextDate: string) {
        setDraftDate(nextDate);
        const parsedDate = toDateOnly(nextDate);
        if (parsedDate) setVisibleMonth(startOfMonth(parsedDate));
        setDraftIssue(null);
    }

    function changeDraftTime(nextTime: string) {
        setDraftTime(nextTime);
        setDraftIssue(null);
    }

    function applyDraft() {
        // Native date/time controls can defer their change event until focus moves.
        // Read their displayed values at the commit boundary so Apply always saves what is visible.
        const nextDate = dateInputRef.current?.value ?? draftDate;
        const nextTime = timeInputRef.current?.value ?? draftTime;
        const nextValue = nextDate && nextTime ? `${nextDate}T${nextTime}` : "";
        if (!isValidLocalDateTime(nextValue)) {
            setDraftIssue("날짜와 시간을 올바르게 선택해 주세요.");
            return;
        }
        if (minValue && nextValue < minValue) {
            setDraftIssue("허용된 시작 일시 이후로 선택해 주세요.");
            return;
        }
        if (maxValue && nextValue > maxValue) {
            setDraftIssue("허용된 종료 일시 이전으로 선택해 주세요.");
            return;
        }

        onChange(nextValue);
        closePicker();
    }

    return (
        <div ref={pickerRef} className="relative">
            <div className="relative">
                <button
                    id={id}
                    type="button"
                    aria-haspopup="dialog"
                    aria-expanded={isOpen}
                    aria-controls={`${id}-calendar`}
                    aria-describedby={describedBy}
                    data-invalid={hasError || undefined}
                    onClick={() => isOpen ? closePicker() : openPicker()}
                    className={cn(
                        "flex h-12 w-full items-center gap-2 rounded-xl border bg-white px-3 pr-11 text-left text-sm outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/15",
                        hasError ? "border-red-400" : "border-gray-300 hover:border-slate-400",
                    )}
                >
                    <CalendarDays className="size-4 shrink-0 text-slate-500" aria-hidden />
                    <span className={cn("min-w-0 flex-1 truncate", displayedDate ? "text-slate-900" : "text-slate-400")}>
                        {displayedDate ? formatDateTime(displayedDate) : "날짜와 시간을 선택해 주세요"}
                    </span>
                </button>
                {canClear && value && (
                    <button
                        type="button"
                        onClick={() => {
                            onChange("");
                            closePicker();
                        }}
                        className="absolute inset-y-1 right-1 flex size-10 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand/50"
                        aria-label="선택한 일시 지우기"
                    >
                        <X className="size-4" aria-hidden />
                    </button>
                )}
            </div>

            {isOpen && (
                <div
                    id={`${id}-calendar`}
                    role="dialog"
                    aria-label="날짜와 시간 선택"
                    className="absolute left-0 top-[calc(100%+0.5rem)] z-30 w-[min(22rem,calc(100vw-2.5rem))] rounded-2xl border border-gray-200 bg-white p-4 shadow-[0_18px_42px_rgba(15,23,42,0.18)]"
                >
                    <div className="flex items-center justify-between gap-3">
                        <h3 className="text-sm font-bold text-slate-900">{MONTH_FORMATTER.format(visibleMonth)}</h3>
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={() => setVisibleMonth((current) => shiftMonth(current, -1))}
                                className="flex size-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand/50"
                                aria-label="이전 달"
                            >
                                <ChevronLeft className="size-4" aria-hidden />
                            </button>
                            <button
                                type="button"
                                onClick={() => setVisibleMonth((current) => shiftMonth(current, 1))}
                                className="flex size-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand/50"
                                aria-label="다음 달"
                            >
                                <ChevronRight className="size-4" aria-hidden />
                            </button>
                        </div>
                    </div>

                    <div className="mt-4 grid grid-cols-7 text-center text-xs font-medium text-slate-400">
                        {WEEKDAYS.map((weekday) => <span key={weekday}>{weekday}</span>)}
                    </div>
                    <div className="mt-2 grid grid-cols-7 gap-y-1">
                        {days.map((day) => {
                            const isCurrentMonth = day.getMonth() === visibleMonth.getMonth();
                            const isSelected = selectedDate !== null && isSameDay(day, selectedDate);
                            const isAllowed = isDateAllowed(day, minValue, maxValue);
                            const isCurrentDay = isSameDay(day, new Date());

                            return (
                                <button
                                    key={day.toISOString()}
                                    type="button"
                                    disabled={!isAllowed}
                                    aria-pressed={isSelected}
                                    aria-label={`${day.getFullYear()}년 ${day.getMonth() + 1}월 ${day.getDate()}일`}
                                    onClick={() => selectDate(day)}
                                    className={cn(
                                        "mx-auto flex size-9 items-center justify-center rounded-lg text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand/50",
                                        isSelected && "bg-brand text-white shadow-sm",
                                        !isSelected && isCurrentDay && "bg-red-50 text-brand",
                                        !isSelected && !isCurrentDay && isCurrentMonth && isAllowed && "text-slate-800 hover:bg-slate-100",
                                        !isCurrentMonth && isAllowed && "text-slate-400 hover:bg-slate-100",
                                        !isAllowed && "cursor-not-allowed text-slate-300 opacity-60",
                                    )}
                                >
                                    {day.getDate()}
                                </button>
                            );
                        })}
                    </div>

                    <div className="mt-4 grid grid-cols-[minmax(0,1fr)_8.75rem] gap-2 border-t border-slate-100 pt-4">
                        <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-600">
                            날짜
                            <input
                                ref={dateInputRef}
                                type="date"
                                value={draftDate}
                                min={minValue?.slice(0, 10)}
                                max={maxValue?.slice(0, 10)}
                                onChange={(event) => changeDraftDate(event.target.value)}
                                className="h-9 rounded-lg border border-gray-300 bg-white px-2 text-sm font-medium text-slate-900 outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/15"
                            />
                        </label>
                        <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-600">
                            시간
                            <span className="relative">
                                <Clock3 className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" aria-hidden />
                                <input
                                    ref={timeInputRef}
                                    type="time"
                                    value={draftTime}
                                    step="60"
                                    onChange={(event) => changeDraftTime(event.target.value)}
                                    className="h-9 w-full rounded-lg border border-gray-300 bg-white pl-8 pr-2 text-sm font-medium text-slate-900 outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/15"
                                />
                            </span>
                        </label>
                    </div>

                    {draftIssue && <p className="mt-3 text-xs leading-5 text-red-600" role="alert">{draftIssue}</p>}

                    <div className="mt-4 flex items-center justify-end gap-2">
                        <button
                            type="button"
                            onClick={closePicker}
                            className="h-9 rounded-lg px-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand/50"
                        >
                            취소
                        </button>
                        <button
                            type="button"
                            onClick={applyDraft}
                            className="h-9 rounded-lg bg-brand px-4 text-sm font-semibold text-white transition-colors hover:bg-brand/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand/50"
                        >
                            적용
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function createDefaultDateTime(): string {
    const current = new Date();
    current.setSeconds(0, 0);
    return toLocalDateTimeValue(current);
}

function getInitialDraftValue(value: string, min?: string | null, max?: string | null): string {
    const existingValue = normalizeLocalDateTime(value);
    if (existingValue) return existingValue;

    const defaultValue = createDefaultDateTime();
    if (min && defaultValue < min) return min;
    if (max && defaultValue > max) return max;
    return defaultValue;
}

function normalizeLocalDateTime(value?: string): string | null {
    return value && isValidLocalDateTime(value) ? value : null;
}

function isValidLocalDateTime(value: string): boolean {
    const match = DATE_TIME_PATTERN.exec(value);
    if (!match) return false;

    const [, year, month, day, hour, minute] = match;
    const parsed = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));
    return (
        parsed.getFullYear() === Number(year)
        && parsed.getMonth() === Number(month) - 1
        && parsed.getDate() === Number(day)
        && parsed.getHours() === Number(hour)
        && parsed.getMinutes() === Number(minute)
    );
}

function toLocalDate(value: string): Date | null {
    if (!isValidLocalDateTime(value)) return null;
    const [date, time] = value.split("T");
    const [year, month, day] = date.split("-").map(Number);
    const [hour, minute] = time.split(":").map(Number);
    return new Date(year, month - 1, day, hour, minute);
}

function toDateOnly(value: string): Date | null {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) return null;

    const [, year, month, day] = match;
    const parsed = new Date(Number(year), Number(month) - 1, Number(day));
    return parsed.getFullYear() === Number(year)
        && parsed.getMonth() === Number(month) - 1
        && parsed.getDate() === Number(day)
        ? parsed
        : null;
}

function toDateInputValue(date: Date): string {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function toLocalDateTimeValue(date: Date): string {
    return `${toDateInputValue(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatDateTime(date: Date): string {
    return `${date.getFullYear()}. ${pad(date.getMonth() + 1)}. ${pad(date.getDate())}. ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function pad(value: number): string {
    return String(value).padStart(2, "0");
}

function startOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
}

function shiftMonth(date: Date, offset: number): Date {
    return new Date(date.getFullYear(), date.getMonth() + offset, 1);
}

function getCalendarDays(month: Date): Date[] {
    const firstDay = startOfMonth(month);
    const mondayBasedOffset = (firstDay.getDay() + 6) % 7;
    const start = new Date(firstDay);
    start.setDate(firstDay.getDate() - mondayBasedOffset);

    return Array.from({ length: 42 }, (_, index) => {
        const day = new Date(start);
        day.setDate(start.getDate() + index);
        return day;
    });
}

function isSameDay(left: Date, right: Date): boolean {
    return left.getFullYear() === right.getFullYear()
        && left.getMonth() === right.getMonth()
        && left.getDate() === right.getDate();
}

function isDateAllowed(date: Date, min?: string | null, max?: string | null): boolean {
    const dayValue = toDateInputValue(date);
    return (!min || dayValue >= min.slice(0, 10)) && (!max || dayValue <= max.slice(0, 10));
}
