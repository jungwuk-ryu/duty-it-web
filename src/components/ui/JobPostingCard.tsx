import { getJobDday, getJobDeadlineLabel, getJobTitle } from "@/src/lib/jobs";
import type { JobPosting } from "@/src/lib/schemas/job";
import { ArrowRight, Building2, CalendarClock, MapPin, UsersRound, WalletCards } from "lucide-react";
import Link from "next/link";
import { BookmarkIconButton } from "./bookmark-icon-button";

type Props = { job: JobPosting };

export default function JobPostingCard({ job }: Props) {
    const deadline = getJobDeadlineLabel(job.receiptCloseDt);
    const dday = job.isActive ? getJobDday(job.receiptCloseDt) : null;

    return (
        <article className="group relative h-full overflow-hidden rounded-2xl border border-border/80 bg-background shadow-[0_12px_32px_rgba(15,23,42,0.06),0_2px_6px_rgba(15,23,42,0.03)] transition duration-200 hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-[0_18px_40px_rgba(15,23,42,0.10),0_4px_10px_rgba(198,60,51,0.06)]">
            <BookmarkIconButton kind="jobs" itemId={job.id} title={getJobTitle(job)} initialSaved={job.isBookmarked} className="absolute right-3 top-3 rounded-full bg-background" />
            <Link href={`/jobs/${job.id}`} className="block h-full p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2">
                <div className="grid h-full gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(19rem,0.9fr)] lg:items-center">
                    <div className="min-w-0">
                        <div className="mb-3 flex flex-wrap items-center gap-2 pr-12">
                            <span className={job.isActive ? "inline-flex h-7 items-center rounded-full bg-brand/10 px-2.5 text-xs font-bold text-brand" : "inline-flex h-7 items-center rounded-full bg-muted px-2.5 text-xs font-bold text-muted-foreground"}>
                                {job.isActive ? "모집 중" : "마감"}
                            </span>
                            {dday && <span className="text-sm font-bold text-brand">{dday}</span>}
                            <span className="truncate text-sm font-medium text-muted-foreground" title={job.jobsNm || undefined}>{job.jobsNm || "간호 채용"}</span>
                        </div>
                        <p className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
                            <Building2 className="size-4 shrink-0 text-brand" aria-hidden="true" />
                            <span className="truncate">{job.company.corpNm || "기업 정보 미등록"}</span>
                        </p>
                        <h2 className="mt-2 line-clamp-2 text-xl font-bold leading-snug text-foreground transition group-hover:text-brand">
                            {getJobTitle(job)}
                        </h2>
                        {job.jobCont && <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted-foreground">{job.jobCont}</p>}
                    </div>

                    <dl className="grid grid-cols-2 gap-x-4 gap-y-4 border-t border-border/60 pt-4 text-sm lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
                        <JobMeta icon={MapPin} label="근무지" value={job.workRegion || job.company.corpAddr || "근무지 미정"} />
                        <JobMeta icon={WalletCards} label="급여" value={job.salTpNm || "급여 협의"} />
                        <JobMeta icon={UsersRound} label="경력·학력" value={`${job.enterTpNm || "경력 무관"} · ${job.eduNm || "학력 무관"}`} />
                        <JobMeta icon={CalendarClock} label="접수 마감" value={deadline} />
                    </dl>
                </div>
                <span className="mt-5 flex items-center gap-1 text-sm font-bold text-brand">
                    공고 자세히 보기
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </span>
            </Link>
        </article>
    );
}

function JobMeta({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: string }) {
    return (
        <div className="min-w-0">
            <dt className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                <Icon className="size-3.5 shrink-0 text-subtle-foreground" aria-hidden="true" />
                {label}
            </dt>
            <dd className="mt-1 truncate font-semibold text-foreground" title={value}>{value}</dd>
        </div>
    );
}
