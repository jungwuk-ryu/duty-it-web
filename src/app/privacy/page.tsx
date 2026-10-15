import Link from "next/link";
import type { ReactNode } from "react";
import AnalyticsOptOut from "@/src/components/AnalyticsOptOut";
import {
  OPERATOR_EMAIL, OPERATOR_NAME, OPERATOR_PHONE, PREVIOUS_PRIVACY_POLICY_URL, PRIVACY_POLICY_EFFECTIVE_DATE, TERMS_PATH,
} from "@/src/lib/legal";
import { getPageMetadata, SITE_ORIGIN } from "@/src/lib/seo";

export const metadata = getPageMetadata({
  title: "개인정보 처리방침 | 듀잇",
  description: "듀잇이 처리하는 개인정보의 항목과 목적, 보유기간, 처리위탁과 국외 이전, 정보주체의 권리와 개인정보 보호책임자를 안내합니다.",
  url: `${SITE_ORIGIN}/privacy`,
});

const linkClassName = "font-semibold text-brand underline decoration-brand/30 underline-offset-4 hover:decoration-brand";

type Row = readonly ReactNode[];

const PROCESSING_ROWS: Row[] = [
  [
    "회원 가입·로그인 (Google·Apple 계정)",
    "이메일 주소, 이름(소셜 계정에 등록된 이름으로 닉네임 자동 생성에만 사용), 소셜 계정 식별자(Firebase UID), 로그인 수단, 이용약관 동의 일시·버전",
    "회원 식별, 로그인 유지, 계정 관리, 문의 응대",
    "계약의 체결·이행 (개인정보 보호법 제15조 제1항 제4호)",
    "회원 탈퇴 시까지",
  ],
  [
    "서비스 이용",
    "닉네임, 북마크한 행사·채용 공고·기업, 알림 설정, 알림 구독 조건(키워드, 주최 기관, 행사 유형, 기업), 알림 내역, 캘린더 자동 추가 설정",
    "북마크·캘린더·알림·구독 기능 제공",
    "계약의 체결·이행 (제15조 제1항 제4호)",
    "회원 탈퇴 시까지",
  ],
  [
    "푸시 알림",
    "앱·브라우저 푸시 토큰, 알림 내용",
    "북마크 일정 알림과 구독한 조건의 새 공고 알림 발송",
    "계약의 체결·이행 (제15조 제1항 제4호)",
    "로그아웃·회원 탈퇴 또는 토큰 만료 시까지",
  ],
  [
    "광고성 정보 수신 (선택)",
    "광고성 정보 수신 동의 여부와 동의 일시",
    "이벤트·혜택 등 광고성 정보 발송",
    "정보주체의 동의 (제15조 제1항 제1호, 제22조 제1항 제7호), 정보통신망법 제50조",
    "동의 철회 또는 회원 탈퇴 시까지",
  ],
  [
    "이용 통계 (거부 가능)",
    "앱 인스턴스 ID 등 기기 식별자, Android 광고 ID(기기에서 허용한 경우), 기기·운영체제·브라우저 정보, 접속 국가·언어, 화면 조회·버튼 이용 기록, 검색어, 회원 번호(로그인한 경우)",
    "서비스 이용 통계 분석과 기능 개선",
    "서비스 제공·개선에 필요한 범위의 처리 (제15조 제1항 제4호·제6호)",
    "수집일로부터 최대 14개월 (Google 애널리틱스 보존 설정에 따라 자동 삭제)",
  ],
  [
    "앱 오류 분석",
    "앱 오류(비정상 종료) 기록, 기기·운영체제 정보, 앱 버전, 로그인 수단 등 오류 진단 정보",
    "앱 오류 원인 분석과 안정성 확보",
    "서비스 제공·개선에 필요한 범위의 처리 (제15조 제1항 제4호·제6호)",
    "수집일로부터 90일",
  ],
  [
    "서비스 접속·보안",
    "접속 IP 주소, 접속 일시, 요청 경로, 브라우저·기기 정보(User-Agent), 오류 기록",
    "부정 이용 방지, 장애 대응, 보안 사고 대응",
    "서비스 제공에 필요한 범위의 처리 (제15조 제1항 제4호·제6호), 통신비밀보호법",
    "수집일로부터 1년 (통신비밀보호법에 따른 로그기록 3개월 보관 포함)",
  ],
  [
    "문의 (이메일)",
    "이메일 주소, 이름(적은 경우), 문의 내용",
    "문의·요청 응대와 처리 결과 회신",
    "계약의 체결·이행 (제15조 제1항 제4호)",
    "처리 완료 후 1년",
  ],
  [
    "의견 보내기 (Google 설문지, 선택)",
    "설문지에 직접 입력한 내용",
    "서비스 의견 수렴과 개선",
    "정보주체의 동의 (제출 시)",
    "의견 반영 완료 후 1년",
  ],
];

const PROCESSOR_ROWS: Row[] = [
  [
    "Google LLC (미국)",
    "로그인 인증(Firebase Authentication), 푸시 알림 발송(Firebase Cloud Messaging), 이용 통계(Google 애널리틱스 for Firebase), 앱 오류 분석(Firebase Crashlytics), 의견 보내기(Google 설문지)",
    "이메일 주소, 이름, 소셜 계정 식별자, 푸시 토큰과 알림 내용, 이용 통계 항목, 오류 진단 정보, 설문 응답",
    "서비스 이용 시점에 네트워크를 통해 전송",
    "회원 탈퇴 또는 위탁 계약 종료 시까지 (이용 통계 최대 14개월, 오류 기록 90일)",
    <a key="google" className={linkClassName} href="https://support.google.com/policies/contact/general_privacy_form">Google 개인정보 문의</a>,
  ],
  [
    "Apple Inc. (미국)",
    "iOS 기기로 푸시 알림 전달(Apple Push Notification service)",
    "푸시 토큰, 알림 내용",
    "알림 발송 시 네트워크를 통해 전송",
    "위탁 계약 종료 시까지",
    <a key="apple" className={linkClassName} href="https://www.apple.com/kr/legal/privacy/contact/">Apple 개인정보 문의</a>,
  ],
  [
    "Vercel Inc. (미국)",
    "웹사이트(www.dutyit.net) 호스팅과 전송",
    "접속 IP 주소, 요청 정보, 브라우저 정보, 암호화된 로그인 세션 정보",
    "웹사이트 이용 시 네트워크를 통해 전송",
    "위탁 계약 종료 시까지 (접속 기록은 Vercel 보존 정책에 따름)",
    <a key="vercel" className={linkClassName} href="mailto:privacy@vercel.com">privacy@vercel.com</a>,
  ],
  [
    "Cloudflare, Inc. (미국)",
    "API 서버(api.dutyit.net) 전송·보안(CDN), contact@dutyit.net 이메일 전달",
    "접속 IP 주소, 요청 정보, 이메일 주소와 문의 내용",
    "서비스 이용·이메일 발송 시 네트워크를 통해 전송",
    "위탁 계약 종료 시까지 (접속 기록은 Cloudflare 보존 정책에 따름)",
    <a key="cloudflare" className={linkClassName} href="mailto:privacyquestions@cloudflare.com">privacyquestions@cloudflare.com</a>,
  ],
  [
    "Discord Inc. (미국)",
    "서비스 오류 발생 시 운영자 알림",
    "오류가 발생한 요청 경로(기기 토큰 등 식별 정보는 가림 처리), 오류 내용",
    "오류 발생 시 네트워크를 통해 전송",
    "알림 수신 후 1년",
    <a key="discord" className={linkClassName} href="mailto:privacy@discord.com">privacy@discord.com</a>,
  ],
];

const REMEDY_ROWS: Row[] = [
  ["개인정보분쟁조정위원회", "(국번 없이) 1833-6972", <a key="kopico" className={linkClassName} href="https://www.kopico.go.kr">www.kopico.go.kr</a>],
  ["개인정보침해신고센터", "(국번 없이) 118", <a key="kisa" className={linkClassName} href="https://privacy.kisa.or.kr">privacy.kisa.or.kr</a>],
  ["대검찰청", "(국번 없이) 1301", <a key="spo" className={linkClassName} href="https://www.spo.go.kr">www.spo.go.kr</a>],
  ["경찰청", "(국번 없이) 182", <a key="police" className={linkClassName} href="https://ecrm.police.go.kr">ecrm.police.go.kr</a>],
];

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="mt-12 scroll-mt-24 border-t border-border pt-9">
      <h2 id={`${id}-title`} className="text-xl font-bold">{title}</h2>
      <div className="mt-5 space-y-4 leading-7 text-foreground">{children}</div>
    </section>
  );
}

function Table({ caption, headers, rows }: { caption: string; headers: readonly string[]; rows: Row[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[640px] border-collapse text-left text-sm leading-6">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-muted/60">
          <tr>{headers.map((header) => <th key={header} scope="col" className="px-4 py-3 font-semibold">{header}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="align-top">
              {row.map((cell, cellIndex) => cellIndex === 0
                ? <th key={cellIndex} scope="row" className="px-4 py-3 font-semibold">{cell}</th>
                : <td key={cellIndex} className="px-4 py-3 text-muted-foreground">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const TOC = [
  ["processing", "1. 처리하는 개인정보의 항목, 목적, 근거와 보유기간"],
  ["third-party", "2. 개인정보의 제3자 제공"],
  ["processors", "3. 개인정보 처리업무의 위탁과 국외 이전"],
  ["destruction", "4. 개인정보의 파기 절차와 방법"],
  ["rights", "5. 정보주체와 법정대리인의 권리·의무와 행사 방법"],
  ["children", "6. 만 14세 미만 아동의 개인정보"],
  ["security", "7. 개인정보의 안전성 확보조치"],
  ["cookies", "8. 자동 수집 장치의 설치·운영과 거부"],
  ["marketing", "9. 광고성 정보 전송"],
  ["ai", "10. AI 행사 요약과 개인정보"],
  ["officer", "11. 개인정보 보호책임자"],
  ["remedy", "12. 권익침해 구제 방법"],
  ["changes", "13. 개인정보 처리방침의 변경"],
] as const;

export default function PrivacyPolicyPage() {
  return (
    <article className="mx-auto max-w-4xl break-keep px-5 py-12 sm:px-8 sm:py-16">
      <nav aria-label="현재 위치" className="mb-8 flex gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">듀잇 홈</Link><span aria-hidden>/</span><span aria-current="page">개인정보 처리방침</span>
      </nav>
      <header>
        <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">개인정보 처리방침</h1>
        <p className="mt-6 leading-7">
          듀잇을 운영하는 {OPERATOR_NAME}(이하 &lsquo;운영자&rsquo;)은 「개인정보 보호법」 등 관련 법령을 지키며, 이용자의 개인정보를 보호하고 관련 고충을 신속하게 처리하기 위하여 다음과 같이 개인정보 처리방침을 정하여 공개합니다.
          이 처리방침은 듀잇 앱(iOS·Android)과 웹사이트(www.dutyit.net)에 적용됩니다.
        </p>
        <p className="mt-3 text-sm text-muted-foreground">시행일: {PRIVACY_POLICY_EFFECTIVE_DATE}</p>
      </header>

      <nav aria-label="개인정보 처리방침 목차" className="mt-8 rounded-xl bg-muted/60 p-5">
        <ol className="grid gap-1.5 text-sm sm:grid-cols-2">
          {TOC.map(([id, title]) => <li key={id}><a href={`#${id}`} className="hover:text-brand">{title}</a></li>)}
        </ol>
      </nav>

      <Section id="processing" title="1. 처리하는 개인정보의 항목, 목적, 근거와 보유기간">
        <p>운영자는 서비스 제공에 필요한 최소한의 개인정보만 처리합니다. 처리 목적이 바뀌면 「개인정보 보호법」 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 합니다.</p>
        <Table
          caption="처리하는 개인정보의 항목, 목적, 근거와 보유기간"
          headers={["구분", "처리 항목", "처리 목적", "처리 근거", "보유기간"]}
          rows={PROCESSING_ROWS}
        />
        <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
          <li>Google·Apple 로그인 시 해당 사업자로부터 위 회원 가입·로그인 항목을 제공받습니다. Apple의 &lsquo;나의 이메일 가리기&rsquo;를 선택하면 Apple이 만든 중계 이메일 주소를 받습니다.</li>
          <li>행사 제보 시 이름·연락처 등 제보자의 개인정보를 입력받지 않습니다. 다만 제보하신 이미지 파일에 포함된 촬영 정보 등 메타데이터와 파일 이름이 함께 저장될 수 있으니, 개인정보가 담긴 파일은 올리지 마세요.</li>
          <li>앱에서 기기 캘린더 접근을 허용한 경우, 북마크한 행사를 기기 캘린더에 추가하거나 기기 캘린더 일정을 듀잇 캘린더에 함께 보여주기 위해 기기 안에서만 일정 정보를 읽고 씁니다. 기기 캘린더의 일정 정보는 운영자의 서버로 전송하지 않습니다.</li>
          <li>웹사이트에서 행사 조회수를 셀 때 중복 집계를 막기 위해 접속 IP 주소를 변환한 값(해시)을 최대 10분 동안 서버 메모리에 임시로 보관한 뒤 삭제합니다.</li>
          <li>회원 가입과 로그인에 필요한 정보는 계약 이행을 위해 처리하므로 별도 동의를 받지 않으며, 동의가 필요한 광고성 정보 수신은 회원이 직접 선택한 경우에만 처리합니다.</li>
        </ul>
      </Section>

      <Section id="third-party" title="2. 개인정보의 제3자 제공">
        <p>운영자는 이용자의 개인정보를 제3자에게 제공하지 않습니다. 다만 이용자가 별도로 동의한 경우나 법률에 특별한 규정이 있는 경우(수사기관의 영장 제시 등)에는 「개인정보 보호법」 제17조와 제18조에 따라 제공할 수 있습니다.</p>
        <p>듀잇은 직업소개를 하지 않으며 이용자의 이력서나 개인정보를 구인기관에 전달하지 않습니다. 채용 공고 지원은 고용24 또는 구인기관이 안내하는 방법으로 이용자가 직접 진행합니다.</p>
      </Section>

      <Section id="processors" title="3. 개인정보 처리업무의 위탁과 국외 이전">
        <p>운영자는 서비스 제공을 위해 다음과 같이 개인정보 처리업무를 위탁하고 있으며, 수탁자가 국외에 있어 개인정보가 국외로 이전됩니다. 이 이전은 「개인정보 보호법」 제28조의8 제1항 제3호에 따라 이용자와의 계약 체결·이행을 위해 필요한 처리위탁·보관으로서 이 처리방침에 공개하는 방법으로 이루어집니다.</p>
        <Table
          caption="개인정보 처리업무 위탁과 국외 이전 현황"
          headers={["수탁자 (이전 국가)", "위탁 업무", "이전 항목", "이전 시기·방법", "보유·이용 기간", "연락처"]}
          rows={PROCESSOR_ROWS}
        />
        <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
          <li>운영자는 위탁 계약을 통해 수탁자가 위탁 업무 목적 외로 개인정보를 처리하지 않도록 하고, 안전성 확보조치와 관리·감독에 관한 사항을 정하고 있습니다. 수탁자나 위탁 업무가 바뀌면 이 처리방침을 통해 알립니다.</li>
          <li><strong className="text-foreground">국외 이전을 거부하는 방법과 효과:</strong> 이용 통계는 아래 8번의 방법으로 언제든지 거부할 수 있으며, 거부하더라도 서비스 이용에는 제한이 없습니다. 로그인 인증, 푸시 알림, 웹사이트·API 전송은 서비스 제공에 필수적인 처리이므로, 이를 거부하려면 회원 탈퇴 또는 해당 기능 이용 중단이 필요하며 이 경우 회원 서비스나 알림을 이용할 수 없습니다.</li>
        </ul>
      </Section>

      <Section id="destruction" title="4. 개인정보의 파기 절차와 방법">
        <p>운영자는 보유기간이 지나거나 처리 목적이 달성된 개인정보를 지체 없이 파기합니다.</p>
        <ul className="list-disc space-y-2 pl-5">
          <li><strong>회원 탈퇴:</strong> 탈퇴를 요청하면 회원 정보, 북마크, 알림 설정·구독·내역과 푸시 토큰을 즉시 삭제하고, 로그인 인증(Firebase Authentication) 계정도 함께 삭제합니다. 운영 데이터베이스의 백업본에 남은 정보는 최대 7일 이내에 자동으로 삭제됩니다.</li>
          <li><strong>파기 방법:</strong> 전자적 파일 형태의 정보는 복구하거나 재생할 수 없는 기술적 방법으로 영구 삭제합니다. 종이 문서로 개인정보를 처리하지 않습니다.</li>
          <li><strong>법령에 따른 보존:</strong> 다른 법령에 따라 보존해야 하는 정보(통신비밀보호법에 따른 로그기록 3개월)는 해당 기간 동안 다른 정보와 분리하여 보관한 뒤 파기합니다.</li>
        </ul>
      </Section>

      <Section id="rights" title="5. 정보주체와 법정대리인의 권리·의무와 행사 방법">
        <p>이용자는 언제든지 자신의 개인정보에 대해 열람, 정정·삭제, 처리정지와 동의 철회를 요구할 수 있습니다.</p>
        <ul className="list-disc space-y-2 pl-5">
          <li><strong>직접 하기:</strong> 앱의 &lsquo;계정 설정&rsquo;에서 닉네임 수정과 회원 탈퇴를, &lsquo;앱 설정&rsquo;에서 알림·광고성 정보 수신 설정 변경과 이용 통계 수집 거부를 할 수 있습니다. 웹사이트에서는 계정 메뉴의 &lsquo;내 알림과 행사 구독&rsquo;에서 행사 구독 조건 변경을, &lsquo;회원 탈퇴&rsquo;에서 회원 탈퇴를 할 수 있으며, 아래 8번의 설정으로 이 브라우저의 이용 통계 수집을 거부할 수 있습니다. 회원 탈퇴는 가입할 때보다 어렵지 않도록 앱과 웹사이트 모두에서 바로 할 수 있습니다.</li>
          <li><strong>요청하기:</strong> 아래 11번의 개인정보 보호책임자에게 이메일이나 전화로 요청하면 지체 없이, 늦어도 10일 이내에 조치하고 결과를 알려드립니다.</li>
          <li>법정대리인이나 위임을 받은 사람을 통해서도 권리를 행사할 수 있으며, 이 경우 위임장을 제출해야 합니다.</li>
          <li>다른 법령에서 수집 대상으로 정한 정보는 삭제를 요구할 수 없으며, 법률에 특별한 규정이 있는 등 「개인정보 보호법」 제35조 제4항, 제37조 제2항에 해당하는 경우 요구가 제한될 수 있습니다.</li>
          <li>운영자는 이용자의 권리나 의무에 중대한 영향을 미치는 결정을 완전히 자동화된 시스템만으로 하지 않습니다.</li>
        </ul>
      </Section>

      <Section id="children" title="6. 만 14세 미만 아동의 개인정보">
        <p>듀잇은 만 14세 이상만 회원으로 가입할 수 있으며, 만 14세 미만 아동의 개인정보를 수집하지 않습니다. 만 14세 미만 아동의 개인정보가 수집된 사실을 알게 되면 지체 없이 파기합니다.</p>
      </Section>

      <Section id="security" title="7. 개인정보의 안전성 확보조치">
        <ul className="list-disc space-y-2 pl-5">
          <li><strong>관리적 조치:</strong> 개인정보를 취급하는 사람을 운영자와 지정된 관리자로 최소화하고, 관리자 권한은 기존 관리자만 부여할 수 있도록 관리합니다.</li>
          <li><strong>기술적 조치:</strong> 모든 통신 구간을 HTTPS로 암호화하고, 웹사이트의 로그인 세션 정보를 암호화(AES-256-GCM)하여 저장하며, 관리자 비밀번호는 일방향 암호화(bcrypt)하여 저장합니다. 서버 운영·관리 기능은 외부에서 접근할 수 없도록 차단하고, 보안 업데이트를 적용합니다.</li>
          <li><strong>물리적 조치:</strong> 개인정보를 처리하는 서버와 관리 기기에 대한 접근을 운영자로 제한합니다.</li>
        </ul>
      </Section>

      <Section id="cookies" title="8. 자동 수집 장치의 설치·운영과 거부">
        <p>운영자는 서비스 제공과 이용 통계를 위해 쿠키와 이와 비슷한 기술을 사용합니다.</p>
        <ul className="list-disc space-y-2 pl-5">
          <li><strong>로그인 유지 쿠키(__Host-duit_session):</strong> 웹사이트 로그인 상태를 유지하기 위한 필수 쿠키로, 정보를 암호화해 저장하며 최대 1년 동안 유지됩니다.</li>
          <li><strong>Google 애널리틱스 쿠키(_ga, _ga_로 시작하는 쿠키):</strong> 웹사이트 이용 통계를 위해 사용하며 최대 2년 동안 유지됩니다.</li>
          <li><strong>브라우저 저장소(localStorage, IndexedDB):</strong> 북마크·알림 설정의 임시 저장, 화면 테마, 앱 설치 안내 닫기 기록, 이용 통계 거부 설정, 브라우저 푸시 알림 연결에 사용합니다.</li>
          <li><strong>앱 SDK:</strong> 앱은 Google 애널리틱스 for Firebase와 Firebase Crashlytics로 이용 통계와 오류 정보를 수집합니다.</li>
        </ul>
        <p className="font-semibold">거부하는 방법</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>앱: &lsquo;앱 설정 → 이용 통계 수집&rsquo;을 끄면 이용 통계와 오류 정보 수집이 중단됩니다. Android의 광고 ID는 기기의 &lsquo;설정 → Google → 광고&rsquo;에서 재설정하거나 삭제할 수 있습니다.</li>
          <li>웹사이트: 아래 설정으로 이 브라우저의 이용 통계 수집을 거부할 수 있습니다. 브라우저 설정에서 쿠키 저장을 차단할 수도 있지만, 이 경우 로그인 등 일부 기능을 이용하기 어렵습니다.</li>
        </ul>
        <AnalyticsOptOut />
        <p className="text-muted-foreground">운영자는 맞춤형 광고를 위해 이용자의 행태정보를 수집하거나 제3자에게 제공하지 않습니다.</p>
      </Section>

      <Section id="marketing" title="9. 광고성 정보 전송">
        <p>운영자는 이벤트·혜택 등 영리 목적의 광고성 정보를 회원이 별도로 동의한 경우에만 보냅니다. 동의는 앱의 알림 설정에서 언제든지 철회할 수 있으며, 동의하지 않아도 서비스 이용에 제한이 없습니다.</p>
        <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
          <li>광고성 정보에는 &lsquo;(광고)&rsquo; 표시와 전송자 정보, 수신 거부 방법을 함께 적습니다.</li>
          <li>오후 9시부터 다음 날 오전 8시까지는 별도로 동의한 경우가 아니면 광고성 정보를 보내지 않습니다.</li>
          <li>수신 동의·거부·철회를 처리하면 처리 결과를 알려드리며, 수신 동의를 받은 날부터 2년마다 동의 여부를 다시 확인합니다.</li>
          <li>북마크한 일정 알림과 회원이 직접 설정한 구독 조건의 새 공고 알림은 광고성 정보가 아니며, 알림 설정에서 끌 수 있습니다.</li>
        </ul>
      </Section>

      <Section id="ai" title="10. AI 행사 요약과 개인정보">
        <p>일부 행사에는 주최 측이 공개한 행사 자료를 바탕으로 생성형 인공지능이 정리한 요약이 &lsquo;AI로 정리했어요&rsquo; 표시와 함께 제공됩니다. 운영자는 이용자의 개인정보를 AI 행사 요약 생성이나 AI 모델 학습에 이용하지 않습니다.</p>
      </Section>

      <Section id="officer" title="11. 개인정보 보호책임자">
        <p>운영자는 개인정보 처리에 관한 업무를 총괄하고 관련 고충을 처리하기 위해 다음과 같이 개인정보 보호책임자를 두고 있습니다. 개인정보 보호와 관련된 문의, 불만, 피해 구제 요청은 아래로 연락해 주세요.</p>
        <dl className="grid gap-x-6 gap-y-2 rounded-xl border border-border p-5 sm:grid-cols-[8rem_1fr]">
          <dt className="font-semibold">성명·직책</dt><dd>{OPERATOR_NAME} (대표자)</dd>
          <dt className="font-semibold">전화</dt><dd><a className={linkClassName} href={`tel:${OPERATOR_PHONE.replaceAll("-", "")}`}>{OPERATOR_PHONE}</a></dd>
          <dt className="font-semibold">이메일</dt><dd><a className={linkClassName} href={`mailto:${OPERATOR_EMAIL}`}>{OPERATOR_EMAIL}</a></dd>
        </dl>
      </Section>

      <Section id="remedy" title="12. 권익침해 구제 방법">
        <p>개인정보 침해에 대한 피해 구제나 상담이 필요하면 아래 기관에 문의할 수 있습니다.</p>
        <Table caption="개인정보 권익침해 구제 기관" headers={["기관", "전화", "누리집"]} rows={REMEDY_ROWS} />
      </Section>

      <Section id="changes" title="13. 개인정보 처리방침의 변경">
        <p>이 개인정보 처리방침은 {PRIVACY_POLICY_EFFECTIVE_DATE}부터 적용됩니다. 내용을 추가·삭제·수정하는 경우 시행 7일 전부터 웹사이트와 앱에 알리며, 이용자의 권리에 중요한 변경이 있는 경우 최소 30일 전에 알리고 변경 전후를 비교할 수 있도록 안내합니다.</p>
        <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
          <li>이전 개인정보 처리방침(2025년 9월 6일 ~ {PRIVACY_POLICY_EFFECTIVE_DATE} 전날, 영문): <a className={linkClassName} href={PREVIOUS_PRIVACY_POLICY_URL}>보기</a></li>
          <li>서비스 이용 조건은 <Link className={linkClassName} href={TERMS_PATH}>이용약관</Link>에서 확인할 수 있습니다.</li>
        </ul>
      </Section>
    </article>
  );
}
