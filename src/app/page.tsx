import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, BellRing, CalendarDays, Check, ListFilter, Search } from "lucide-react";
import { Metadata } from "next";
import HeroCalendar from "@/src/components/home/HeroCalendar";
import HeroPhone from "@/src/assets/home/images/app_phone_hero.png";
import AppStore from "@/src/assets/home/images/apple_app_store.svg";
import GooglePlay from "@/src/assets/home/images/google_play.svg";

export const metadata: Metadata = {
  title: "간호의 오늘에 내일의 기회를 더해요 | 듀잇",
  description: "간호 대외활동·행사·학술대회·보수교육을 한곳에서 찾아보고, 다음 기회를 이어가요."
};

export default function Home() {
  return (
    <div className="overflow-hidden bg-paper">
      <section className="paper-glow relative">
        <div className="mx-auto grid min-h-[660px] max-w-[1440px] items-center gap-8 px-5 py-14 sm:px-8 md:min-h-[720px] md:grid-cols-[minmax(0,1.04fr)_minmax(0,0.96fr)] md:py-16 lg:px-11">
          <div className="relative z-10 max-w-[620px] md:pb-12">
            <p className="mb-5 text-[15px] font-semibold tracking-[-0.03em] text-muted">간호의 다음 기회를 더 가깝게</p>
            <h1 className="text-[34px] font-extrabold leading-[1.16] tracking-[-0.075em] text-ink sm:text-[58px] lg:text-[64px] xl:text-[70px]">
              간호의 오늘에<br />
              <span className="text-brand">내일의 기회를 더해요.</span>
            </h1>
            <p className="mt-7 max-w-[470px] text-[17px] leading-8 tracking-[-0.035em] text-muted sm:text-[18px]">
              듀잇은 간호 분야의 행사와 대외활동을 한곳에 모아, 나에게 맞는 다음 기회를 더 빠르게 찾도록 도와줘요.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link href="/events" className="inline-flex h-12 items-center gap-2 rounded-full bg-brand px-5 text-sm font-bold text-white shadow-[0_12px_24px_rgba(198,60,51,0.22)] transition hover:bg-brand-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
                행사 찾아보기 <ArrowRight size={17} strokeWidth={2.2} aria-hidden="true" />
              </Link>
              <a href="#download" className="inline-flex h-12 items-center rounded-full border border-line bg-surface/80 px-5 text-sm font-bold text-ink transition hover:border-brand hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
                앱으로 이어가기
              </a>
            </div>
          </div>

          <div className="relative min-h-[390px] md:min-h-[540px] lg:min-h-[590px]">
            <div className="absolute inset-x-[-18%] top-[-7%] bottom-[-12%] md:inset-x-[-10%]">
              <HeroCalendar />
            </div>
            <div className="absolute bottom-[-60px] right-[3%] h-[300px] w-[170px] overflow-hidden rounded-[28px] drop-shadow-[0_24px_25px_rgba(32,34,42,0.18)] sm:h-[384px] sm:w-[218px] md:bottom-[-28px] md:right-[2%] md:h-[465px] md:w-[265px] lg:h-[520px] lg:w-[295px]">
              <Image
                src={HeroPhone}
                alt="듀잇 행사 목록 앱 화면"
                fill
                priority
                sizes="(min-width: 1024px) 295px, (min-width: 768px) 265px, 218px"
                className="object-cover object-center"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="section-rule bg-surface">
        <div className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 md:py-28 lg:px-11">
          <div className="grid gap-12 md:grid-cols-[0.8fr_1.2fr] md:gap-20">
            <div>
              <p className="text-sm font-bold tracking-[-0.03em] text-brand">원하는 기회를 놓치지 않아요</p>
              <h2 className="mt-4 text-3xl font-extrabold leading-tight tracking-[-0.06em] text-ink sm:text-4xl">찾고, 고르고,<br />내 일정으로 이어가요.</h2>
              <p className="mt-5 max-w-sm text-[16px] leading-7 tracking-[-0.035em] text-muted">복잡한 정보는 덜어내고, 지금 필요한 행사만 빠르게 살펴볼 수 있어요.</p>
            </div>
            <ol className="divide-y divide-line border-y border-line">
              <HomeStep number="01" icon={<Search size={20} strokeWidth={1.8} />} title="행사를 찾아봐요" content="행사명과 유형, 일정으로 지금 관심 있는 주제를 좁혀봐요." />
              <HomeStep number="02" icon={<ListFilter size={20} strokeWidth={1.8} />} title="나에게 맞게 골라봐요" content="최신 등록순과 시작 임박순, 모집 마감순으로 비교해봐요." />
              <HomeStep number="03" icon={<BellRing size={20} strokeWidth={1.8} />} title="놓치지 않도록 챙겨요" content="관심 있는 기회는 앱에서 더 편하게 이어서 확인해요." />
            </ol>
          </div>
        </div>
      </section>

      <section id="download" className="relative overflow-hidden bg-[#d84c40] text-white">
        <div className="mx-auto grid max-w-[1440px] items-center gap-10 px-5 py-16 sm:px-8 md:grid-cols-[1fr_0.78fr] md:px-11 md:py-20">
          <div className="relative z-10 max-w-lg">
            <p className="text-sm font-bold text-white/82">언제든 이어서 찾아봐요</p>
            <h2 className="mt-4 text-3xl font-extrabold leading-tight tracking-[-0.06em] sm:text-4xl">내게 맞는 행사를<br />앱으로 더 가까이 챙겨요.</h2>
            <p className="mt-5 text-[16px] leading-7 text-white/88">새로 올라온 행사와 모집 마감일을 앱에서 한눈에 확인할 수 있어요.</p>
            <ul className="mt-7 space-y-2.5 text-sm font-medium text-white/90">
              <li className="flex items-center gap-2"><Check size={17} strokeWidth={2.4} aria-hidden="true" /> 관심 주제를 중심으로 찾아봐요</li>
              <li className="flex items-center gap-2"><Check size={17} strokeWidth={2.4} aria-hidden="true" /> 모집 마감일을 놓치지 않아요</li>
              <li className="flex items-center gap-2"><Check size={17} strokeWidth={2.4} aria-hidden="true" /> 캘린더에서 일정을 정리해요</li>
            </ul>
            <div className="mt-9 flex flex-wrap gap-3">
              <a href="https://apps.apple.com/kr/app/id6751395152" target="_blank" rel="noopener noreferrer" aria-label="애플 앱 스토어에서 듀잇 다운로드">
                <Image src={AppStore} width={150} height={50} alt="애플 앱 스토어에서 다운로드" className="h-[46px] w-auto" />
              </a>
              <a href="https://play.google.com/store/apps/details?id=com.dutyit.app" target="_blank" rel="noopener noreferrer" aria-label="구글 플레이에서 듀잇 다운로드">
                <Image src={GooglePlay} width={150} height={50} alt="구글 플레이에서 다운로드" className="h-[46px] w-auto" />
              </a>
            </div>
          </div>
          <div className="relative hidden min-h-[340px] md:block">
            <CalendarDays className="absolute right-[16%] top-[14%] size-48 text-white/10" strokeWidth={1} aria-hidden="true" />
            <div className="absolute -bottom-[145px] right-[9%] h-[520px] w-[290px] overflow-hidden rounded-[36px] drop-shadow-[0_30px_28px_rgba(91,24,18,0.34)]">
              <Image src={HeroPhone} alt="듀잇 앱 행사 목록 화면" fill sizes="290px" className="object-cover object-center" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

type HomeStepProps = {
  number: string;
  icon: ReactNode;
  title: string;
  content: string;
};

function HomeStep({ number, icon, title, content }: HomeStepProps) {
  return (
    <li className="grid grid-cols-[36px_1fr] gap-x-4 py-6 sm:grid-cols-[54px_42px_1fr] sm:items-center sm:gap-x-5">
      <span className="text-sm font-extrabold text-brand">{number}</span>
      <span className="hidden size-10 items-center justify-center rounded-full border border-line text-brand sm:inline-flex">{icon}</span>
      <div>
        <h3 className="text-lg font-bold tracking-[-0.045em] text-ink">{title}</h3>
        <p className="mt-1.5 text-sm leading-6 tracking-[-0.03em] text-muted">{content}</p>
      </div>
    </li>
  );
}
