import Image from "next/image";
import PrimaryCard from "../components/ui/PrimaryCard";
import MockUp from "@/src/assets/home/images/app_mockup.png";
import AppStore from "@/src/assets/home/images/apple_app_store.svg";
import GooglePlay from "@/src/assets/home/images/google_play.svg";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "듀잇 - 간호 행사가 한 곳에!",
  description: "국내 모든 간호 행사를 한곳에 모아두었어요."
};

export default function Home() {
  return (
    <div className="flex flex-col px-5 md:px-20 gap-20 container mx-auto px-4">
      <div className="pt-20 flex flex-col md:flex-row justify-center items-center gap-20">
        <div className="flex flex-col gap-5 text-center md:text-left">
          <h1 className="text-4xl md:text-5xl font-bold leading-relaxed tracking-tighter">
            <span className="text-brand">듀잇</span>과 함께,<br className="hidden md:block" /> 모든 간호사 행사를 한눈에!
          </h1>
          <p className="text-gray-600 text-xl">
            국내 모든 간호 행사를 한곳에 모아두었어요.
          </p>
        </div>
        <div className="flex justify-center items-center">
          <Image
            src={MockUp}
            alt="앱 화면 목업"
            width={420}
            height={420}
            priority
            sizes="(min-width: 768px) 420px, 80vw"
            className="drop-shadow-xl rounded-2xl"
          />
        </div>
      </div>

      <div className="flex flex-col justify-center text-center">
        <SectionDescription title="듀잇의 특별한 기능" desc="간호사·간호대학생분들을 위한 맞춤형 기능을 만나보세요." />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-20">
          <PrimaryCard title="맞춤 검색 & 필터" content="행사 종류, 주최별로 원하는 행사를 쉽게 찾아보세요." />
          <PrimaryCard title="관심 행사 알림" content="북마크한 행사의 신청 마감일을 놓치지 않도록 알려드립니다." />
          <PrimaryCard title="캘린더에서 한눈에" content="관심 있는 행사를 캘린더에서 한눈에 확인할 수 있습니다." />
        </div>
      </div>

      <section id="download">
        <div className="flex flex-col bg-brand py-20 text-center text-white">
          <h3 className="text-2xl font-bold">지금 듀잇을 다운로드하세요!</h3>
          <p className="leading-8 text-white/96">언제 어디서든 최신 간호 행사 정보를 확인하고 앞서 나아가세요.</p>
          <div className="flex flex-row pt-10 gap-5 justify-center">
            <a href="https://apps.apple.com/kr/app/id6751395152" target="_blank" rel="noopener noreferrer" aria-label="애플 앱 스토어로 이동">
              <Image
                src={AppStore}
                width={150}
                height={50}
                alt="애플 앱 스토어"
              />
            </a>
            <a href="https://play.google.com/store/apps/details?id=com.dutyit.app" target="_blank" rel="noopener noreferrer" aria-label="구글 플레이 스토어로 이동">
              <Image
                src={GooglePlay}
                width={150}
                height={50}
                alt="애플 앱 스토어"
              /></a>
          </div>
        </div>
      </section>
    </div>
  );
}

type SectionProps = {
  title: string;
  desc: string;
};

function SectionDescription({ title, desc }: SectionProps) {
  return (
    <header className="space-y-2">
      <h2 className="text-2xl font-bold leading-relaxed">{title}</h2>
      <p className="text-gray-500">{desc}</p>
    </header>
  );
}