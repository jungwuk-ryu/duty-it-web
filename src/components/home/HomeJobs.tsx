import { Suspense } from "react";
import Link from "next/link";
import { ArrowUpRight, BriefcaseBusiness } from "lucide-react";
import JobPostingCard from "@/src/components/ui/JobPostingCard";
import type { JobPosting } from "@/src/lib/schemas/job";
import { getHomeJobPostings } from "./home-preview-data";
import styles from "./home.module.css";

export default function HomeJobs() {
  return (
    <section id="home-jobs" className={styles.jobs} aria-labelledby="home-jobs-title">
      <div className={styles.container}>
        <header className={styles.sectionHeading}>
          <div>
            <h2 id="home-jobs-title">지금 살펴볼 채용 공고</h2>
            <p>근무지와 경력을 확인하고, 나에게 맞는 기회를 찾아보세요.</p>
          </div>
          <Link href="/jobs" prefetch={false} className={styles.textLink}>
            전체 채용 공고 보기 <ArrowUpRight size={20} strokeWidth={1.6} aria-hidden />
          </Link>
        </header>
        <Suspense fallback={<HomeJobsLoading />}>
          <HomeJobsContent />
        </Suspense>
      </div>
    </section>
  );
}

async function HomeJobsContent() {
  let jobs: JobPosting[];
  try {
    jobs = (await getHomeJobPostings()).content;
  } catch (error) {
    console.error("Failed to load home jobs", { message: error instanceof Error ? error.message : "Unknown error" });
    return <HomeJobsEmpty failed />;
  }
  if (jobs.length === 0) return <HomeJobsEmpty />;

  return (
    <ul className={styles.jobGrid}>
      {jobs.map((job) => <li key={job.id}><JobPostingCard job={job} heading="h3" /></li>)}
    </ul>
  );
}

function HomeJobsEmpty({ failed = false }: { failed?: boolean }) {
  return (
    <div className={styles.jobsEmpty}>
      <BriefcaseBusiness size={30} strokeWidth={1.3} aria-hidden />
      <h3>{failed ? "채용 공고를 잠시 불러오지 못했어요." : "새로운 채용 공고를 준비하고 있어요."}</h3>
      <p>{failed ? "전체 목록에서 다시 확인해 주세요." : "전체 목록에서 다른 기회도 둘러보세요."}</p>
      <Link href="/jobs" prefetch={false} className={styles.textLink}>전체 채용 공고 보기 <ArrowUpRight size={17} aria-hidden /></Link>
    </div>
  );
}

function HomeJobsLoading() {
  return (
    <div className={styles.jobGrid} role="status" aria-label="채용 공고를 불러오는 중이에요.">
      {Array.from({ length: 4 }, (_, index) => <div key={index} className={styles.jobSkeleton} aria-hidden="true" />)}
    </div>
  );
}
