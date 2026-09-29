import Link from "next/link";

const activities = [
  { type: "VOLUNTEER", name: "봉사활동", description: "활동 장소와 일정, 모집 대상과 참여 조건을 확인하세요." },
  { type: "SUPPORTERS", name: "서포터즈", description: "활동 주제와 기간, 맡게 될 역할과 지원 방법을 살펴보세요." },
  { type: "CONTEST", name: "공모전", description: "공모 주제와 제출물, 개인·팀 지원 여부와 마감일을 확인하세요." },
] as const;

export default function EventActivityGuide() {
  return (
    <section id="events-activity-guide" aria-labelledby="activity-guide-title" className="break-keep border-t border-border pt-9">
      <h2 id="activity-guide-title" className="text-2xl font-bold tracking-tight sm:text-[28px]">나에게 맞는 대외활동 찾기</h2>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
        간호대학생 대외활동을 찾는다면 봉사·서포터즈·공모전부터 찾아보세요.
      </p>
      <ul className="mt-6 grid gap-6 sm:grid-cols-3">
        {activities.map(({ type, name, description }) => (
          <li key={type}>
            <h3 className="font-bold"><Link href={`/events?types=${type}`} prefetch={false} className="text-brand underline underline-offset-4">{name} 찾아보기</Link></h3>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">{description}</p>
          </li>
        ))}
      </ul>
      <div className="mt-8 border-t border-border pt-6">
        <h3 className="font-bold">지원 전 확인하기</h3>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-muted-foreground">
          참가 대상, 모집 기간과 활동 일정, 장소, 비용을 확인하세요. 학년·전공·면허 등 자격 요건과 수료증·활동 혜택은 주최 측 공고에 안내된 내용을 기준으로 판단해 주세요.
          듀잇 상세 페이지에서 주최 페이지로 이동해 최신 모집요강과 신청 방법을 확인할 수 있어요.
        </p>
      </div>
    </section>
  );
}
