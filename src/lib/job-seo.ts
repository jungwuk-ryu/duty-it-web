import type { JobPosting } from "./schemas/job";
import { getJobDeadlineLabel, getJobEmploymentSummary, getJobTitle, getJobValidThrough, isJobOpen } from "./jobs";
import { getIsoDateTime } from "./seo-date";
import { SITE_ORIGIN } from "./seo";
import { isHttpUrl } from "./url";

export function getJobCanonicalUrl(id: number): string {
  return `${SITE_ORIGIN}/jobs/${id}`;
}

export function getJobMetadataDescription(job: JobPosting): string {
  return [
    `${job.company.corpNm ? `${job.company.corpNm}의 ` : ""}${getJobTitle(job)} 채용 정보.`,
    job.workRegion && `근무지 ${job.workRegion}.`,
    job.enterTpNm && `경력 ${job.enterTpNm}.`,
    job.empTpNm && `고용 형태 ${getJobEmploymentSummary(job)}.`,
    job.receiptCloseDt && `접수 마감 ${getJobDeadlineLabel(job.receiptCloseDt)}.`,
  ].filter(Boolean).join(" ").replace(/\s+/g, " ");
}

function getJobLocation(workRegion: string) {
  const postalCode = workRegion.match(/^\s*\(?(\d{5})\)?\s+/)?.[1];
  const address = workRegion.replace(/^\s*\(?\d{5}\)?\s+/, "").trim();
  const region = address.match(/^(서울(?:특별시)?|부산(?:광역시)?|대구(?:광역시)?|인천(?:광역시)?|광주(?:광역시)?|대전(?:광역시)?|울산(?:광역시)?|세종(?:특별자치시)?|경기(?:도)?|강원(?:도|특별자치도)?|충청[남북]도|충[남북]|전라[남북]도|전북특별자치도|전[남북]|경상[남북]도|경[남북]|제주(?:도|특별자치도)?)\s+(.+)$/);
  if (!region) return null;
  return {
    "@type": "Place",
    address: {
      "@type": "PostalAddress",
      addressCountry: "KR",
      addressRegion: region[1],
      streetAddress: region[2],
      ...(postalCode ? { postalCode } : {}),
    },
  };
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function getJobDescriptionHtml(job: JobPosting): string {
  const sections = [
    ["직무 내용", job.jobCont], ["근무지", job.workRegion], ["고용 형태", job.empTpNm],
    ["급여", job.salTpNm], ["근무 조건", job.workdayWorkhrCont], ["경력", job.enterTpNm], ["학력", job.eduNm],
    ["자격증", job.certificate], ["전공", job.major], ["우대 조건", job.pfCond], ["기타 조건", job.etcPfCond],
    ["4대 보험", job.fourIns], ["퇴직급여", job.retirepay], ["기타 복지", job.etcWelfare],
    ["접수 마감", job.receiptCloseDt], ["접수 방법", job.rcptMthd], ["제출 서류", job.submitDoc], ["전형 방법", job.selMthd],
  ];
  return sections.filter(([, value]) => value).map(([label, value]) => `<p>${label}: ${escapeHtml(value).replace(/\r?\n/g, "<br>")}</p>`).join("");
}

export function getJobStructuredData(job: JobPosting, now = new Date()) {
  const datePosted = getIsoDateTime(job.postedAt);
  const jobLocation = getJobLocation(job.workRegion);
  const title = job.jobsNm.replace(/\s*\(\d+\)\s*$/, "").trim();
  // Do not substitute import dates, company addresses, or placeholder text for required facts.
  if (!isJobOpen(job, now) || !datePosted || Date.parse(datePosted) > now.getTime()
    || !job.company.corpNm || !title || !job.jobCont || !jobLocation || !isHttpUrl(job.dtlRecrContUrl)) return null;
  const url = getJobCanonicalUrl(job.id);
  const validThrough = getJobValidThrough(job);
  const employmentType: Record<string, string[]> = { "10": ["FULL_TIME"], "11": ["PART_TIME"], "20": ["TEMPORARY"], "21": ["PART_TIME", "TEMPORARY"] };
  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    "@id": `${url}#job`,
    url,
    mainEntityOfPage: url,
    title,
    description: getJobDescriptionHtml(job),
    datePosted,
    ...(validThrough ? { validThrough } : {}),
    hiringOrganization: {
      "@type": "Organization",
      name: job.company.corpNm,
      ...(isHttpUrl(job.company.homePg) ? { sameAs: job.company.homePg } : {}),
    },
    jobLocation,
    ...(employmentType[job.empTpCd] ? { employmentType: employmentType[job.empTpCd] } : {}),
    ...(job.wantedAuthNo ? { identifier: { "@type": "PropertyValue", name: "고용24", value: job.wantedAuthNo } } : {}),
    // Applications continue on Work24; this is not a direct-apply flow.
    directApply: false,
  };
}
