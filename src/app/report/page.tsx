import Link from "next/link";
import { OPERATOR_EMAIL, OPERATOR_NAME, OPERATOR_PHONE, TERMS_PATH } from "@/src/lib/legal";
import { getPageMetadata, SITE_ORIGIN } from "@/src/lib/seo";

export const metadata = getPageMetadata({
  title: "권리침해 신고 | 듀잇",
  description: "듀잇에 게시된 행사 포스터·이미지·설명이 저작권 등 권리를 침해한다면 삭제(복제·전송 중단)를 요청하는 방법을 안내합니다.",
  url: `${SITE_ORIGIN}/report`,
});

const linkClassName = "font-semibold text-brand underline decoration-brand/30 underline-offset-4 hover:decoration-brand";

const REQUIRED_ITEMS = [
  "요청인의 성명과 연락처(전화번호 또는 이메일), 대리인이 요청하는 경우 위임 사실",
  "대상 게시물의 주소(URL)와 문제가 되는 부분(포스터, 이미지, 설명 등)",
  "침해된 권리의 종류(저작권, 초상권, 명예, 사생활 등)와 침해 내용",
  "권리를 소명하는 자료(원본 파일, 저작권 등록증, 권리자임을 알 수 있는 자료 등)",
];

const PROCESS_STEPS = [
  "요청을 받으면 지체 없이 해당 게시물의 게시를 중단하거나 접근을 임시로 차단합니다.",
  "처리 결과를 요청인에게 알리고, 게시자(제보자)를 확인할 수 있으면 게시자에게도 알립니다.",
  "게시자가 정당한 권리를 소명하여 재게시를 요청하면 「저작권법」 등 관련 법령에서 정한 절차에 따라 재게시 여부를 정하고 요청인에게 알립니다.",
  "권리 침해 여부를 판단하기 어렵거나 다툼이 예상되면 최대 30일 동안 접근을 임시로 차단할 수 있습니다.",
];

export default async function ReportPage({ searchParams }: { searchParams: Promise<{ eventId?: string | string[] }> }) {
  const { eventId } = await searchParams;
  const reportedEventId = typeof eventId === "string" && /^\d{1,12}$/.test(eventId) ? eventId : null;
  const subject = reportedEventId ? `[권리침해 신고] 행사 ${reportedEventId}` : "[권리침해 신고]";
  const body = reportedEventId ? `대상 게시물: ${SITE_ORIGIN}/events/${reportedEventId}\n\n` : "";
  const mailtoHref = `mailto:${OPERATOR_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return (
    <article className="mx-auto max-w-3xl break-keep px-5 py-12 sm:px-8 sm:py-16">
      <nav aria-label="현재 위치" className="mb-8 flex gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">듀잇 홈</Link><span aria-hidden>/</span><span aria-current="page">권리침해 신고</span>
      </nav>
      <header>
        <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">권리침해 신고</h1>
        <p className="mt-6 leading-7">
          듀잇에 게시된 행사 포스터, 이미지, 설명 등이 저작권, 초상권, 명예, 사생활 등 권리를 침해한다면 아래 방법으로 삭제(복제·전송 중단)를 요청해 주세요.
          자세한 절차는 <Link className={linkClassName} href={`${TERMS_PATH}#article-10`}>이용약관 제10조</Link>를 따릅니다.
        </p>
        {reportedEventId && (
          <p className="mt-4 rounded-xl bg-muted/60 p-4 text-sm leading-6">
            신고 대상: <Link className={linkClassName} href={`/events/${reportedEventId}`}>{`${SITE_ORIGIN}/events/${reportedEventId}`}</Link>
          </p>
        )}
      </header>

      <section aria-labelledby="report-items" className="mt-10 border-t border-border pt-8">
        <h2 id="report-items" className="text-xl font-bold">요청할 때 보내 주실 내용</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 leading-7">
          {REQUIRED_ITEMS.map((item) => <li key={item}>{item}</li>)}
        </ul>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href={mailtoHref} className="inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm font-semibold text-white hover:bg-primary/90">이메일로 신고하기</a>
          <a href={`tel:${OPERATOR_PHONE.replaceAll("-", "")}`} className="inline-flex h-11 items-center rounded-xl border border-input px-5 text-sm font-semibold hover:bg-muted">전화로 신고하기</a>
        </div>
      </section>

      <section aria-labelledby="report-process" className="mt-10 border-t border-border pt-8">
        <h2 id="report-process" className="text-xl font-bold">처리 절차</h2>
        <ol className="mt-4 list-decimal space-y-2 pl-5 leading-7">
          {PROCESS_STEPS.map((step) => <li key={step}>{step}</li>)}
        </ol>
      </section>

      <section aria-labelledby="report-receiver" className="mt-10 border-t border-border pt-8">
        <h2 id="report-receiver" className="text-xl font-bold">신고를 받는 사람</h2>
        <dl className="mt-4 grid gap-x-6 gap-y-2 rounded-xl border border-border p-5 sm:grid-cols-[6rem_1fr]">
          <dt className="font-semibold">성명</dt><dd>{OPERATOR_NAME} (대표자)</dd>
          <dt className="font-semibold">전화</dt><dd>{OPERATOR_PHONE}</dd>
          <dt className="font-semibold">이메일</dt><dd><a className={linkClassName} href={`mailto:${OPERATOR_EMAIL}`}>{OPERATOR_EMAIL}</a></dd>
        </dl>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">개인정보 침해에 관한 문의는 개인정보 처리방침의 개인정보 보호책임자에게 연락해 주세요.</p>
      </section>
    </article>
  );
}
