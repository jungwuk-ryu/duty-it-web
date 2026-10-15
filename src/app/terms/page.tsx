import Link from "next/link";
import type { ReactNode } from "react";
import {
  JOB_INFO_REGISTRATION, OPERATOR_EMAIL, OPERATOR_NAME, OPERATOR_PHONE, PRIVACY_POLICY_PATH, REPORT_PATH, TERMS_EFFECTIVE_DATE,
} from "@/src/lib/legal";
import { getPageMetadata, SITE_ORIGIN } from "@/src/lib/seo";

export const metadata = getPageMetadata({
  title: "이용약관 | 듀잇",
  description: "듀잇 서비스의 이용 조건, 행사·채용 정보의 성격, 행사 제보와 권리침해 게시물의 신고·삭제 절차를 안내합니다.",
  url: `${SITE_ORIGIN}/terms`,
});

const linkClassName = "font-semibold text-brand underline decoration-brand/30 underline-offset-4 hover:decoration-brand";

function Article({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="mt-10 scroll-mt-24">
      <h2 id={`${id}-title`} className="text-lg font-bold">{title}</h2>
      <div className="mt-3 leading-7 text-foreground">{children}</div>
    </section>
  );
}

function Items({ children }: { children: ReactNode }) {
  return <ol className="list-decimal space-y-2 pl-5">{children}</ol>;
}

export default function TermsPage() {
  return (
    <article className="mx-auto max-w-3xl break-keep px-5 py-12 sm:px-8 sm:py-16">
      <nav aria-label="현재 위치" className="mb-8 flex gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">듀잇 홈</Link><span aria-hidden>/</span><span aria-current="page">이용약관</span>
      </nav>
      <header>
        <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">듀잇 이용약관</h1>
        <p className="mt-3 text-sm text-muted-foreground">시행일: {TERMS_EFFECTIVE_DATE}</p>
      </header>

      <Article id="article-1" title="제1조 (목적)">
        <p>이 약관은 {OPERATOR_NAME}(이하 &lsquo;운영자&rsquo;)이 제공하는 듀잇 앱과 웹사이트(www.dutyit.net) 및 관련 서비스(이하 &lsquo;서비스&rsquo;)의 이용 조건과 절차, 운영자와 이용자의 권리·의무와 책임을 정하는 것을 목적으로 합니다.</p>
      </Article>

      <Article id="article-2" title="제2조 (정의)">
        <Items>
          <li>&lsquo;이용자&rsquo;란 이 약관에 따라 서비스를 이용하는 회원과 비회원을 말합니다.</li>
          <li>&lsquo;회원&rsquo;이란 이 약관에 동의하고 Google 또는 Apple 계정으로 로그인하여 가입한 사람을 말합니다.</li>
          <li>&lsquo;행사 정보&rsquo;란 서비스가 제공하는 간호 관련 행사·대외활동·교육의 일정, 주최자, 원문 링크, 포스터 등의 정보를 말합니다.</li>
          <li>&lsquo;채용 정보&rsquo;란 서비스가 고용노동부 고용24로부터 제공받아 안내하는 구인 정보를 말합니다.</li>
          <li>&lsquo;게시물&rsquo;이란 이용자가 행사 제보 등으로 서비스에 올린 글, 이미지, 링크 등의 정보를 말합니다.</li>
        </Items>
      </Article>

      <Article id="article-3" title="제3조 (약관의 게시와 개정)">
        <Items>
          <li>운영자는 이 약관을 이용자가 쉽게 확인할 수 있도록 웹사이트와 앱의 로그인 화면, 설정 화면에 게시합니다.</li>
          <li>운영자는 「약관의 규제에 관한 법률」 등 관련 법령을 위반하지 않는 범위에서 약관을 개정할 수 있으며, 개정 내용과 시행일을 시행일 7일 전부터 알립니다. 이용자에게 불리한 개정은 시행일 30일 전부터 알리고, 회원에게는 앱 알림이나 이메일 등으로 개별 안내합니다.</li>
          <li>회원은 개정 약관에 동의하지 않으면 회원 탈퇴를 할 수 있습니다.</li>
        </Items>
      </Article>

      <Article id="article-4" title="제4조 (회원 가입)">
        <Items>
          <li>회원 가입은 만 14세 이상인 사람이 이 약관에 동의하고 Google 또는 Apple 계정으로 로그인하는 방법으로 합니다.</li>
          <li>만 14세 미만인 사람은 회원으로 가입할 수 없습니다.</li>
          <li>운영자는 타인의 계정을 도용한 경우 등 정당한 사유가 있으면 가입을 거절하거나 사후에 회원 자격을 제한할 수 있습니다.</li>
          <li>회원의 개인정보는 <Link className={linkClassName} href={PRIVACY_POLICY_PATH}>개인정보 처리방침</Link>에 따라 처리됩니다.</li>
        </Items>
      </Article>

      <Article id="article-5" title="제5조 (회원 탈퇴와 자격 제한)">
        <Items>
          <li>회원은 앱의 &lsquo;계정 설정&rsquo;이나 웹사이트의 계정 메뉴에서 언제든지 탈퇴할 수 있으며, 운영자는 즉시 처리합니다. 탈퇴하면 회원 정보와 북마크, 알림 설정·구독은 개인정보 처리방침에 따라 삭제되며 복구할 수 없습니다.</li>
          <li>운영자는 회원이 법령이나 이 약관을 위반하여 서비스 운영을 방해한 경우 사전에 알린 뒤 서비스 이용을 제한할 수 있습니다. 다만 긴급한 경우에는 먼저 제한한 뒤 알릴 수 있습니다.</li>
        </Items>
      </Article>

      <Article id="article-6" title="제6조 (서비스의 내용)">
        <Items>
          <li>운영자는 다음 서비스를 무료로 제공합니다.
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>간호 행사·대외활동 정보의 검색과 안내</li>
              <li>고용24 채용 정보의 검색과 안내</li>
              <li>북마크, 캘린더 추가, 일정 알림, 조건별 새 공고 알림</li>
              <li>AI 행사 요약</li>
              <li>행사 제보</li>
            </ul>
          </li>
          <li>운영자는 서비스 개선, 설비 점검, 운영상 필요가 있으면 서비스의 전부 또는 일부를 변경하거나 중단할 수 있으며, 이 경우 미리 알립니다. 다만 부득이한 사유가 있으면 사후에 알릴 수 있습니다.</li>
        </Items>
      </Article>

      <Article id="article-7" title="제7조 (행사 정보와 AI 요약의 성격)">
        <Items>
          <li>운영자는 행사의 주최자가 아니며, 참가 신청·결제·환불과 행사 운영에 관한 책임은 각 주최 측에 있습니다.</li>
          <li>행사 정보는 주최 측이 공개한 정보와 이용자의 제보를 바탕으로 하며, 주최 측 사정으로 변경될 수 있습니다. 이용자는 신청 전에 주최 측 원문을 확인해야 합니다.</li>
          <li>일부 행사 정보는 생성형 인공지능을 이용하여 요약·정리하며, 해당 내용에는 &lsquo;AI로 정리했어요&rsquo;라고 표시합니다. AI 요약에는 오류나 누락이 있을 수 있으므로 일정, 비용, 신청 방법 등 중요한 내용은 주최 측 원문을 기준으로 합니다.</li>
        </Items>
      </Article>

      <Article id="article-8" title="제8조 (채용 정보)">
        <Items>
          <li>운영자는 「직업안정법」 제23조에 따라 직업정보제공사업을 신고하였습니다. (신고번호 {JOB_INFO_REGISTRATION})</li>
          <li>채용 정보는 고용노동부 고용24에서 제공받은 정보이며, 지원은 고용24 또는 구인기관이 안내하는 방법으로 이용자가 직접 합니다. 운영자는 직업소개, 취업 추천, 이력서 전달을 하지 않습니다.</li>
          <li>운영자는 구인기관이 「근로기준법」 제43조의2에 따라 명단이 공개된 임금체불 사업주인 경우 해당 공고에 그 사실을 표시하며, 최저임금에 미달하는 것으로 확인된 구인 정보는 게재하지 않습니다.</li>
          <li>고용24에서 제공받은 채용 정보의 권리는 원 게시자와 고용24에 있으며, 이용자는 이를 무단으로 복제하거나 배포할 수 없습니다.</li>
        </Items>
      </Article>

      <Article id="article-9" title="제9조 (행사 제보와 게시물)">
        <Items>
          <li>이용자는 사실에 맞는 행사 정보만 제보해야 하며, 포스터·로고 등 이미지는 이용자가 권리를 가지고 있거나 권리자의 허락을 받은 경우에만 올려야 합니다.</li>
          <li>이용자는 제보한 게시물을 운영자가 서비스 안에서 행사 정보를 안내하는 목적으로 게시·복제·전송하고, 사실관계에 맞게 고치거나 일부만 표시하는 것을 허락합니다.</li>
          <li>운영자는 제보를 검토한 뒤 게시 여부를 정하며, 사실과 다르거나 타인의 권리를 침해하는 게시물은 게시하지 않거나 삭제할 수 있습니다.</li>
          <li>제보에는 다른 사람의 개인정보를 포함해서는 안 됩니다.</li>
        </Items>
      </Article>

      <Article id="article-10" title="제10조 (권리침해 게시물의 신고와 삭제 절차)">
        <Items>
          <li>서비스에 게시된 행사 포스터, 이미지, 설명 등으로 저작권, 초상권, 명예, 사생활 등 권리를 침해당한 사람은 <Link className={linkClassName} href={REPORT_PATH}>권리침해 신고</Link> 안내에 따라 이메일이나 전화로 삭제(복제·전송 중단)를 요청할 수 있습니다. 요청할 때에는 요청인의 성명과 연락처, 대상 게시물의 주소(URL), 침해 내용과 권리를 소명하는 자료를 함께 보내 주세요.</li>
          <li>사생활 침해나 명예훼손 등을 이유로 삭제를 요청받으면 운영자는 「정보통신망 이용촉진 및 정보보호 등에 관한 법률」 제44조의2에 따라 지체 없이 삭제, 임시조치 등 필요한 조치를 하고 그 사실을 요청인과 게시자에게 알립니다. 권리 침해 여부를 판단하기 어렵거나 다툼이 예상되면 30일 이내의 기간 동안 해당 게시물에 대한 접근을 임시로 차단할 수 있습니다.</li>
          <li>저작권 등의 침해를 이유로 복제·전송 중단을 요구받으면 운영자는 「저작권법」 제103조에 따라 즉시 해당 게시물의 복제·전송을 중단하고 그 사실을 권리주장자에게 알리며, 게시자를 확인할 수 있는 경우 게시자에게도 알립니다. 게시자는 자신에게 정당한 권리가 있음을 소명하여 재게시를 요청할 수 있으며, 운영자는 같은 법에서 정한 절차에 따라 재게시 여부를 정하고 그 사실을 알립니다.</li>
          <li>복제·전송 중단 요청 등을 받는 사람은 다음과 같습니다.
            <dl className="mt-2 grid gap-x-6 gap-y-1 rounded-xl border border-border p-4 sm:grid-cols-[6rem_1fr]">
              <dt className="font-semibold">성명</dt><dd>{OPERATOR_NAME} (대표자)</dd>
              <dt className="font-semibold">전화</dt><dd>{OPERATOR_PHONE}</dd>
              <dt className="font-semibold">이메일</dt><dd><a className={linkClassName} href={`mailto:${OPERATOR_EMAIL}`}>{OPERATOR_EMAIL}</a></dd>
            </dl>
          </li>
          <li>운영자는 권리 침해가 명백한 게시물을 알게 된 경우 요청이 없더라도 삭제하거나 게시를 중단할 수 있습니다.</li>
        </Items>
      </Article>

      <Article id="article-11" title="제11조 (알림과 광고성 정보)">
        <Items>
          <li>운영자는 회원이 북마크한 행사의 일정 알림과 회원이 직접 설정한 조건의 새 공고 알림을 보내며, 회원은 알림 설정에서 언제든지 끌 수 있습니다.</li>
          <li>운영자는 이벤트·혜택 등 광고성 정보를 회원이 별도로 동의한 경우에만 보내며, 동의하지 않아도 서비스 이용에 제한이 없습니다. 광고성 정보 전송은 「정보통신망 이용촉진 및 정보보호 등에 관한 법률」 제50조를 따릅니다.</li>
        </Items>
      </Article>

      <Article id="article-12" title="제12조 (이용자의 의무)">
        <p>이용자는 다음 행위를 해서는 안 됩니다.</p>
        <Items>
          <li>타인의 계정이나 개인정보를 도용하는 행위</li>
          <li>사실과 다른 행사 정보나 타인의 권리를 침해하는 게시물을 제보하는 행위</li>
          <li>서비스의 정상적인 운영을 방해하거나 보안 취약점을 악용하는 행위</li>
          <li>운영자의 허락 없이 서비스의 정보를 상업적 목적으로 대량 수집·복제·배포하는 행위</li>
          <li>그 밖에 법령을 위반하는 행위</li>
        </Items>
      </Article>

      <Article id="article-13" title="제13조 (책임의 제한)">
        <Items>
          <li>운영자는 천재지변, 통신 장애 등 운영자가 통제할 수 없는 사유로 서비스를 제공할 수 없는 경우 책임을 지지 않습니다.</li>
          <li>운영자는 주최 측이나 구인기관이 제공한 정보의 정확성, 행사 운영과 채용 결과에 대해 책임을 지지 않습니다.</li>
          <li>다만 운영자의 고의 또는 과실로 이용자에게 손해가 발생한 경우에는 관련 법령에 따라 책임을 집니다.</li>
        </Items>
      </Article>

      <Article id="article-14" title="제14조 (준거법과 관할)">
        <p>이 약관과 서비스 이용에 관한 분쟁에는 대한민국 법을 적용하며, 소송은 「민사소송법」에 따른 관할 법원에 제기합니다.</p>
      </Article>

      <section aria-labelledby="addenda-title" className="mt-12 border-t border-border pt-8">
        <h2 id="addenda-title" className="text-lg font-bold">부칙</h2>
        <p className="mt-3 leading-7">이 약관은 {TERMS_EFFECTIVE_DATE}부터 시행합니다.</p>
      </section>
    </article>
  );
}
