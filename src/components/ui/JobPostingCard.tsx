import Link from "next/link";
import { getJobDeadlineLabel, getJobTitle } from "@/src/lib/jobs";
import { getJobCareerSummary, getJobClosingLabel, getJobLocationSummary, getJobSalarySummary } from "@/src/lib/job-list-summary";
import type { JobPosting } from "@/src/lib/schemas/job";
import { BookmarkIconButton } from "./bookmark-icon-button";
import styles from "./job-posting.module.css";

type Props = { job: JobPosting; heading?: "h2" | "h3" };

export default function JobPostingCard({ job, heading: Heading = "h2" }: Props) {
    const title = job.wantedTitle || getJobTitle(job).replace(/\s*\(\d{6}\)/g, "");
    const closingLabel = getJobClosingLabel(job);
    const facts = [
        { label: "근무지", value: getJobLocationSummary(job.workRegion) },
        { label: "경력", value: getJobCareerSummary(job.enterTpNm) },
        { label: "학력", value: job.eduNm || "학력 정보 미등록" },
        { label: "급여", value: getJobSalarySummary(job.salTpNm) },
    ];

    return (
        <article className={styles.card}>
            <Link href={`/jobs/${job.id}`} prefetch={false} className={styles.cardLink}>
                <span className={styles.deadline} data-countdown={closingLabel.startsWith("D-")} title={getJobDeadlineLabel(job.receiptCloseDt)}>
                    <span className="sr-only">접수 마감 </span>{closingLabel}
                </span>
                <p className={styles.company}>{job.company.corpNm || "기업 정보 미등록"}</p>
                <Heading className={styles.title}>{title}</Heading>
                <ul className={styles.facts}>
                    {facts.map((fact) => <li key={fact.label}><span className="sr-only">{fact.label} </span>{fact.value}</li>)}
                </ul>
            </Link>
            <BookmarkIconButton kind="jobs" itemId={job.id} title={title} initialSaved={job.isBookmarked} className={styles.bookmark} />
        </article>
    );
}
