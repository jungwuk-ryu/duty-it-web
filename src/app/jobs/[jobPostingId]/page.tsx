import { buttonVariants } from "@/src/components/ui/button";
import { fetchJobPosting, JobPostingsFetchError } from "@/src/lib/api/jobs";
import { getJobDday, getJobDeadlineLabel, getJobEmploymentSummary, getJobTitle } from "@/src/lib/jobs";
import type { JobPosting } from "@/src/lib/schemas/job";
import { isHttpUrl } from "@/src/lib/url";
import { ArrowLeft, BriefcaseBusiness, Building2, CalendarClock, ExternalLink, FileText, GraduationCap, HeartPulse, Landmark, MapPin, Phone, Send, UsersRound, WalletCards } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ jobPostingId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const jobPostingId = getJobPostingId((await params).jobPostingId);
    if (jobPostingId == null) return { title: "채용 공고 | 듀잇" };

    try {
        const job = await fetchJobPosting(jobPostingId);
        return {
            title: `${getJobTitle(job)} | 듀잇`,
            description: `${job.company.corpNm || "간호"} 채용 공고`,
            alternates: { canonical: `https://www.dutyit.net/jobs/${job.id}` },
        };
    } catch {
        return { title: "채용 공고 | 듀잇" };
    }
}

export default async function JobPostingPage({ params }: Props) {
    const jobPostingId = getJobPostingId((await params).jobPostingId);
    if (jobPostingId == null) notFound();

    let job: JobPosting;
    try {
        job = await fetchJobPosting(jobPostingId);
    } catch (error) {
        if (error instanceof JobPostingsFetchError && error.status === 404) notFound();
        throw error;
    }

    const applicationUrl = isHttpUrl(job.dtlRecrContUrl) ? job.dtlRecrContUrl : null;
    const dday = job.isActive ? getJobDday(job.receiptCloseDt) : null;

    return (
        <div className="container mx-auto mb-8 max-w-5xl px-4 py-8 md:py-10">
            <Link href="/jobs" className={`${buttonVariants({ variant: "ghost", className: "-ml-3 mb-5 text-gray-700" })}`}>
                <ArrowLeft data-icon="inline-start" aria-hidden="true" />
                채용 공고 목록
            </Link>

            <article className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.08),0_2px_8px_rgba(15,23,42,0.04)]">
                <header className="border-b border-slate-100 px-5 py-6 md:px-8 md:py-8">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className={job.isActive ? "inline-flex h-7 items-center rounded-full bg-brand/10 px-2.5 text-xs font-bold text-brand" : "inline-flex h-7 items-center rounded-full bg-gray-100 px-2.5 text-xs font-bold text-gray-500"}>
                            {job.isActive ? "모집 중" : "마감"}
                        </span>
                        {dday && <span className="text-sm font-bold text-brand">{dday}</span>}
                        <span className="text-sm font-medium text-gray-500">{job.jobsNm || "간호 채용"}</span>
                    </div>
                    <p className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-gray-600">
                        <Building2 className="size-4 shrink-0 text-brand" aria-hidden="true" />
                        {job.company.corpNm || "기업 정보 미등록"}
                    </p>
                    <h1 className="mt-2 text-2xl font-bold leading-snug text-gray-950 md:text-3xl">{getJobTitle(job)}</h1>
                    <div className="mt-6 flex flex-wrap gap-2">
                        {applicationUrl && (
                            <a href={applicationUrl} target="_blank" rel="noreferrer" className={buttonVariants({ className: "h-10 bg-brand text-white hover:bg-brand/90" })}>
                                고용24에서 지원하기
                                <ExternalLink data-icon="inline-end" aria-hidden="true" />
                            </a>
                        )}
                        <Link href="/jobs" className={buttonVariants({ variant: "outline", className: "h-10 border-gray-300 text-gray-700" })}>다른 공고 보기</Link>
                    </div>
                </header>

                <div className="flex flex-col gap-8 px-5 py-6 md:px-8 md:py-8">
                    <section aria-labelledby="job-summary">
                        <h2 id="job-summary" className="text-lg font-bold text-gray-950">채용 요약</h2>
                        <dl className="mt-4 grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
                            <DetailMeta icon={MapPin} label="근무지" value={job.workRegion || job.company.corpAddr || "근무지 미정"} />
                            <DetailMeta icon={BriefcaseBusiness} label="고용 형태" value={getJobEmploymentSummary(job)} />
                            <DetailMeta icon={WalletCards} label="급여" value={job.salTpNm || "급여 협의"} />
                            <DetailMeta icon={CalendarClock} label="접수 마감" value={getJobDeadlineLabel(job.receiptCloseDt)} />
                            <DetailMeta icon={UsersRound} label="모집 인원" value={job.collectPsncnt ? `${job.collectPsncnt}명` : "미정"} />
                            <DetailMeta icon={GraduationCap} label="경력·학력" value={`${job.enterTpNm || "경력 무관"} · ${job.eduNm || "학력 무관"}`} />
                        </dl>
                    </section>

                    <TextSection title="직무 내용" icon={FileText} content={job.jobCont} />
                    <TextSection title="근무 조건" icon={CalendarClock} content={job.workdayWorkhrCont} />

                    <section className="border-t border-slate-100 pt-7" aria-labelledby="application-info">
                        <h2 id="application-info" className="text-lg font-bold text-gray-950">지원 정보</h2>
                        <dl className="mt-4 grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
                            <DetailMeta icon={Send} label="접수 방법" value={job.rcptMthd || "확인 필요"} />
                            <DetailMeta icon={FileText} label="제출 서류" value={job.submitDoc || "확인 필요"} />
                            <DetailMeta icon={UsersRound} label="전형 방법" value={job.selMthd || "확인 필요"} />
                            {hasPhoneNumber(job.contactTelno) && <DetailMeta icon={Phone} label="문의 전화" value={job.contactTelno} />}
                        </dl>
                    </section>

                    {(job.certificate || job.major || job.pfCond || job.etcPfCond) && (
                        <section className="border-t border-slate-100 pt-7" aria-labelledby="qualifications">
                            <h2 id="qualifications" className="text-lg font-bold text-gray-950">자격 및 우대사항</h2>
                            <dl className="mt-4 grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
                                {job.certificate && <DetailMeta icon={HeartPulse} label="자격증" value={job.certificate} />}
                                {job.major && <DetailMeta icon={GraduationCap} label="전공" value={job.major} />}
                                {job.pfCond && <DetailMeta icon={Landmark} label="우대 조건" value={job.pfCond} />}
                                {job.etcPfCond && <DetailMeta icon={FileText} label="기타 조건" value={job.etcPfCond} />}
                            </dl>
                        </section>
                    )}

                    {(job.fourIns || job.retirepay || job.etcWelfare) && (
                        <section className="border-t border-slate-100 pt-7" aria-labelledby="benefits">
                            <h2 id="benefits" className="text-lg font-bold text-gray-950">복리후생</h2>
                            <dl className="mt-4 grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
                                {job.fourIns && <DetailMeta icon={HeartPulse} label="4대 보험" value={job.fourIns} />}
                                {job.retirepay && <DetailMeta icon={WalletCards} label="퇴직급여" value={job.retirepay} />}
                                {job.etcWelfare && <DetailMeta icon={HeartPulse} label="기타 복지" value={job.etcWelfare} />}
                            </dl>
                        </section>
                    )}
                </div>
            </article>
        </div>
    );
}

function DetailMeta({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: string }) {
    return (
        <div className="min-w-0">
            <dt className="flex items-center gap-1.5 text-sm font-medium text-gray-500"><Icon className="size-4 shrink-0 text-brand" aria-hidden="true" />{label}</dt>
            <dd className="mt-1 whitespace-pre-line break-words font-semibold leading-6 text-gray-800">{value}</dd>
        </div>
    );
}

function TextSection({ title, icon: Icon, content }: { title: string; icon: typeof FileText; content: string }) {
    if (!content) return null;

    return (
        <section className="border-t border-slate-100 pt-7">
            <h2 className="flex items-center gap-2 text-lg font-bold text-gray-950"><Icon className="size-5 text-brand" aria-hidden="true" />{title}</h2>
            <p className="mt-4 whitespace-pre-line break-words leading-7 text-gray-700">{content}</p>
        </section>
    );
}

function getJobPostingId(value: string): number | null {
    const id = Number(value);
    return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function hasPhoneNumber(value: string): boolean {
    return value !== "" && value !== "--";
}
