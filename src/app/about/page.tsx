import Link from "next/link";
import { getPageMetadata, serializeJsonLd, SITE_ORIGIN } from "@/src/lib/seo";
import { CONTACT_EMAIL, getAboutStructuredData, INFORMATION_POLICIES, OFFICIAL_APP_LINKS, SERVICE_FAQS, SITE_INTRO } from "@/src/lib/site-info";

export const metadata = getPageMetadata({
  title: "듀잇 소개 · 간호 행사와 채용 이용 안내 | 듀잇",
  description: "듀잇은 간호사와 간호대학생을 위한 행사·대외활동과 채용 정보를 모아보는 서비스입니다. 정보 출처, 북마크 이용 방법, 행사 제보와 문의 방법을 안내합니다.",
  url: `${SITE_ORIGIN}/about`,
});

const linkClassName = "font-semibold text-brand underline decoration-brand/30 underline-offset-4 hover:decoration-brand";

export default function AboutPage() {
  return (
    <article className="mx-auto max-w-3xl break-keep px-5 py-12 sm:px-8 sm:py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(getAboutStructuredData()) }} />
      <nav aria-label="현재 위치" className="mb-8 flex gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">듀잇 홈</Link><span aria-hidden>/</span><span aria-current="page">듀잇 소개</span>
      </nav>
      <header>
        <p className="mb-3 text-sm font-semibold text-brand">듀잇 소개</p>
        <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">듀잇은 어떤 서비스인가요?</h1>
        <p className="mt-6 text-lg leading-8 text-foreground">{SITE_INTRO}</p>
        <p className="mt-3 leading-7 text-muted-foreground">여러 곳에 흩어진 기회를 찾고, 관심 있는 정보를 북마크로 모아보세요.</p>
        <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3">
          <Link href="/events" className={linkClassName}>간호 행사·대외활동 보기</Link>
          <Link href="/jobs" className={linkClassName}>간호 채용 공고 보기</Link>
        </div>
      </header>

      <section aria-labelledby="information-sources" className="mt-12 border-t border-border pt-9">
        <h2 id="information-sources" className="text-xl font-bold">어떤 정보를 제공하나요?</h2>
        <dl className="mt-6 divide-y divide-border">
          {INFORMATION_POLICIES.map(({ label, text }) => (
            <div key={label} className="grid gap-2 py-5 first:pt-0 sm:grid-cols-[8rem_1fr] sm:gap-6">
              <dt className="font-semibold">{label}</dt>
              <dd className="leading-7 text-muted-foreground">{text}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 rounded-xl bg-muted/60 p-5 text-sm leading-6 text-muted-foreground">듀잇은 행사 주최자가 아니며 참가·환불은 주최 측 정책을 따릅니다. 행사와 채용 정보는 변경될 수 있으니 신청·지원 전에 원문을 확인해 주세요.</p>
      </section>

      <section id="faq" aria-labelledby="faq-title" className="mt-12 border-t border-border pt-9">
        <h2 id="faq-title" className="text-xl font-bold">이용할 때 궁금한 점</h2>
        <div className="mt-6 space-y-8">
          {SERVICE_FAQS.map(({ question, answer, href, linkLabel }) => (
            <section key={question}>
              <h3 className="font-semibold leading-7">{question}</h3>
              <p className="mt-2 leading-7 text-muted-foreground">{answer}</p>
              <Link href={href} className={`mt-3 inline-block text-sm ${linkClassName}`}>{linkLabel}</Link>
            </section>
          ))}
        </div>
      </section>

      <section aria-labelledby="contact-title" className="mt-12 border-t border-border pt-9">
        <h2 id="contact-title" className="text-xl font-bold">앱 다운로드와 문의</h2>
        <ul className="mt-5 space-y-3">
          {OFFICIAL_APP_LINKS.map(({ label, url }) => <li key={url}><a href={url} className={linkClassName}>{label}</a></li>)}
        </ul>
        <p className="mt-6 leading-7 text-muted-foreground">서비스 문의와 정보 수정 요청: <a href={`mailto:${CONTACT_EMAIL}`} className={linkClassName}>{CONTACT_EMAIL}</a></p>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">직업정보제공사업 신고번호: J1205020260001 (서울북부 제2026-1호)</p>
      </section>
    </article>
  );
}
