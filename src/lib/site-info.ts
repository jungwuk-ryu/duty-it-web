import { SITE_ORIGIN } from "./seo";

// Service facts shared by the visible about page, JSON-LD, and llms.txt.
// Do not add inferred operator identities, refresh schedules, or third-party statistics.
export const SITE_INTRO = "듀잇(DuIt)은 간호사와 간호대학생을 위한 대외활동·행사와 채용 정보를 모아보는 서비스입니다.";
export const CONTACT_EMAIL = "contact@dutyit.net";
export const ORGANIZATION_ID = `${SITE_ORIGIN}/#organization`;
export const WEBSITE_ID = `${SITE_ORIGIN}/#website`;
export const OFFICIAL_APP_LINKS = [
  { label: "App Store에서 듀잇 다운로드", url: "https://apps.apple.com/kr/app/id6751395152" },
  { label: "Google Play에서 듀잇 다운로드", url: "https://play.google.com/store/apps/details?id=com.dutyit.app" },
];
export const INFORMATION_POLICIES = [
  { label: "행사·대외활동", text: "듀잇은 행사 일정, 신청 기간, 주최자와 주최 페이지 링크를 제공합니다. 참가 자격, 비용, 장소와 일정 변경은 주최 측의 원문에서 확인해 주세요." },
  { label: "채용 공고", text: "듀잇은 고용24에서 제공하는 채용 정보를 안내합니다. 실제 지원 방법과 최신 모집 조건은 공고에 연결된 고용24 원문에서 확인해 주세요." },
  { label: "AI 행사 요약", text: "일부 행사에는 AI가 행사 자료를 바탕으로 정리한 내용이 표시됩니다. 요약에는 오류나 누락이 있을 수 있으므로 신청 전 주최 페이지에서 확인해 주세요." },
];
export const SERVICE_FAQS = [
  {
    question: "간호대학생 대외활동은 어디에서 찾나요?",
    answer: "듀잇의 대외활동·행사 목록에서 봉사, 서포터즈, 공모전과 학술대회·교육 정보를 찾아볼 수 있습니다. 검색어, 행사 종류와 모집 상태로 활동을 좁히고 주최 측의 참가 자격을 확인해 주세요.",
    href: "/events", linkLabel: "간호대학생 대외활동 찾기",
  },
  {
    question: "듀잇에서 채용 공고에 바로 지원할 수 있나요?",
    answer: "듀잇에서 채용기관, 근무 조건, 접수 마감과 지원 정보를 확인한 뒤, 공고의 고용24 링크로 이동해 안내된 방법에 따라 지원할 수 있습니다.",
    href: "/jobs", linkLabel: "간호 채용 공고 찾기",
  },
  {
    question: "관심 있는 행사와 채용 공고는 어떻게 저장하나요?",
    answer: "로그인한 뒤 행사나 채용 공고의 북마크 버튼을 누르면 내 북마크에서 다시 볼 수 있습니다. 북마크는 로그인한 계정에 저장됩니다.",
    href: "/bookmarks", linkLabel: "내 북마크 열기",
  },
  {
    question: "새로운 간호 행사는 어떻게 제보하나요?",
    answer: "듀잇의 행사 제보하기에서 행사 정보를 보내주세요. 제보한 행사는 검토 후 행사 목록에 반영됩니다. 정보 수정이나 서비스 문의는 contact@dutyit.net으로 보내주세요.",
    href: "/submit-event", linkLabel: "간호 행사 제보하기",
  },
];

export function getOrganizationStructuredData() {
  return {
    "@context": "https://schema.org", "@type": "Organization", "@id": ORGANIZATION_ID,
    name: "듀잇", alternateName: "DuIt", url: `${SITE_ORIGIN}/`,
    description: SITE_INTRO, logo: `${SITE_ORIGIN}/app-icon-transparent.png`,
    email: CONTACT_EMAIL, sameAs: OFFICIAL_APP_LINKS.map(({ url }) => url),
  };
}

export function getWebsiteStructuredData() {
  return {
    "@context": "https://schema.org", "@type": "WebSite", "@id": WEBSITE_ID,
    name: "듀잇", alternateName: "DuIt", url: `${SITE_ORIGIN}/`, inLanguage: "ko-KR",
    publisher: { "@id": ORGANIZATION_ID },
  };
}

export function getAboutStructuredData() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "AboutPage", "@id": `${SITE_ORIGIN}/about#page`, url: `${SITE_ORIGIN}/about`,
        name: "듀잇은 어떤 서비스인가요?", description: SITE_INTRO, inLanguage: "ko-KR",
        about: { "@id": ORGANIZATION_ID }, isPartOf: { "@id": WEBSITE_ID },
      },
      {
        "@type": "FAQPage", "@id": `${SITE_ORIGIN}/about#faq`, inLanguage: "ko-KR",
        isPartOf: { "@id": `${SITE_ORIGIN}/about#page` },
        mainEntity: SERVICE_FAQS.map(({ question, answer }) => ({
          "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer },
        })),
      },
      {
        "@type": "BreadcrumbList", itemListElement: [
          { "@type": "ListItem", position: 1, name: "듀잇", item: `${SITE_ORIGIN}/` },
          { "@type": "ListItem", position: 2, name: "듀잇 소개", item: `${SITE_ORIGIN}/about` },
        ],
      },
    ],
  };
}

export function getLlmsText() {
  return `# 듀잇 (DuIt)

> ${SITE_INTRO}

## 주요 페이지
- [듀잇 홈](${SITE_ORIGIN}/): 서비스 소개와 행사·채용 탐색
- [듀잇 소개와 이용 안내](${SITE_ORIGIN}/about): 서비스 범위, 정보 출처, 이용 FAQ, 문의 방법
- [간호대학생·간호사 대외활동](${SITE_ORIGIN}/events): 봉사·서포터즈·공모전과 학술대회·교육, 모집 기간과 주최자 원문 링크
- [간호 채용 공고](${SITE_ORIGIN}/jobs): 채용기관, 근무 조건, 접수 마감과 고용24 지원 링크
- [사이트맵](${SITE_ORIGIN}/sitemap.xml): 공개 페이지와 행사·채용 상세 주소

## 정보 출처와 확인 방법
${INFORMATION_POLICIES.map(({ label, text }) => `- ${label}: ${text}`).join("\n")}
- 듀잇은 서비스 기능과 이용 안내의 원출처입니다. 개별 행사와 채용 조건의 원출처는 해당 주최자와 채용기관입니다.
- 행사·채용 정보는 변경될 수 있습니다. 상세 페이지와 연결된 원문에서 최신 내용을 확인해 주세요.
- 듀잇은 행사 주최자가 아니며 참가·환불은 주최 측 정책을 따릅니다.
- 로그인, 내 북마크, 행사 제보와 내부 API는 공개 검색 콘텐츠에 포함하지 않습니다.

## 공식 앱과 문의
${OFFICIAL_APP_LINKS.map(({ label, url }) => `- [${label}](${url})`).join("\n")}
- 문의: ${CONTACT_EMAIL}
`;
}
