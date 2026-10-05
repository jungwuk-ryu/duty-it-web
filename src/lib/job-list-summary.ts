import type { JobPosting } from "./schemas/job";
import { getJobDday, getJobDeadlineLabel, isJobOpen } from "./jobs";

const REGION_LABELS: Record<string, string> = {
    서울특별시: "서울", 부산광역시: "부산", 대구광역시: "대구", 인천광역시: "인천",
    광주광역시: "광주", 대전광역시: "대전", 울산광역시: "울산", 세종특별자치시: "세종",
    경기도: "경기", 강원도: "강원", 강원특별자치도: "강원", 충청북도: "충북", 충청남도: "충남",
    전라북도: "전북", 전북특별자치도: "전북", 전라남도: "전남", 경상북도: "경북", 경상남도: "경남", 제주특별자치도: "제주",
};

function cleanText(value: string) {
    return value.replace(/\s+/g, " ").trim();
}

export function getJobLocationSummary(value: string): string {
    const address = cleanText(value).replace(/^(?:\(\d{5}\)|\d{5})\s*/, "");
    if (!address) return "근무지 미정";
    const [region, district] = address.split(" ");
    const shortRegion = REGION_LABELS[region]
        ?? (Object.values(REGION_LABELS).includes(region) || /(?:특별시|광역시|자치시|자치도|[시도])$/.test(region) ? region : null);
    // Keep unrecognized formats intact instead of guessing a worksite.
    if (!shortRegion) return address;
    if (district && /^[가-힣]+[시군구]$/.test(district)) return `${shortRegion} ${district}`;
    return shortRegion === "세종" ? shortRegion : address;
}

export function getJobSalarySummary(value: string): string {
    const periods: Record<string, string> = { 월급: "월", 연봉: "연", 시급: "시", 일급: "일" };
    return cleanText(value)
        .replace(/[,，]\s*$/, "")
        .replace(/^(월급|연봉|시급|일급)\s*/, (_, period: string) => `${periods[period]} `)
        .replace(/(?:\d{1,3}(?:,\d{3})+|\d+)\s*원/g, (amount) => {
            const won = Number(amount.replace(/[^\d]/g, ""));
            return won >= 100_000
                ? `${(won / 10_000).toLocaleString("ko-KR", { maximumFractionDigits: 4 })}만원`
                : `${won.toLocaleString("ko-KR")}원`;
        })
        .replace(/([\d,.]+)(만원|원) 이상\s*~\s*([\d,.]+)\2 이하/g, (_, min: string, unit: string, max: string) => min === max ? `${min}${unit}` : `${min}~${max}${unit}`)
        || "급여 정보 미등록";
}

export function getJobCareerSummary(value: string): string {
    const career = cleanText(value);
    if (!career) return "경력 정보 미등록";
    if (/^(관계없음|경력\s*무관|무관)$/.test(career)) return "경력무관";
    return career.replace(/\(최소\s*(\d+)\s*(년|개월)\)/g, "$1$2 이상").replace(/[()]/g, "");
}

export function getJobClosingLabel(job: Pick<JobPosting, "isActive" | "receiptCloseDt" | "expiresAt">, now = new Date()): string {
    if (!isJobOpen(job, now)) return "마감";
    const dday = getJobDday(job.receiptCloseDt, now);
    if (dday) return dday;
    if (/채용\s*시/.test(job.receiptCloseDt)) return "채용 시 마감";
    if (/상시/.test(job.receiptCloseDt)) return "상시 채용";
    return getJobDeadlineLabel(job.receiptCloseDt);
}
