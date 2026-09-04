import type { JobPosting } from "@/src/lib/schemas/job";

export function getJobDeadlineLabel(receiptCloseDt: string): string {
    const value = receiptCloseDt.trim();
    const match = value.match(/^(\d{4})(\d{2})(\d{2})$/);

    if (!match) return value || "마감일 미정";

    const [, year, month, day] = match;
    return `${year}. ${Number(month)}. ${Number(day)}.`;
}

export function getJobDday(receiptCloseDt: string, now = new Date()): string | null {
    const match = receiptCloseDt.trim().match(/^(\d{4})(\d{2})(\d{2})$/);
    if (!match) return null;

    const [, year, month, day] = match;
    const deadline = Date.UTC(Number(year), Number(month) - 1, Number(day));
    const koreaTime = new Date(now.getTime() + 9 * 60 * 60 * 1_000);
    const today = Date.UTC(koreaTime.getUTCFullYear(), koreaTime.getUTCMonth(), koreaTime.getUTCDate());
    const difference = Math.round((deadline - today) / 86_400_000);

    if (difference < 0) return "마감";
    if (difference === 0) return "D-Day";
    return `D-${difference}`;
}

export function getJobEmploymentSummary(job: JobPosting): string {
    return job.empTpNm.split("/")[0]?.trim() || "고용 형태 미정";
}

export function getJobTitle(job: JobPosting): string {
    return job.wantedTitle || job.jobsNm || "제목 미정 채용 공고";
}
