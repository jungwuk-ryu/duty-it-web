import Image from "next/image";
import AppStore from "@/src/assets/home/images/apple_app_store.svg";
import GooglePlay from "@/src/assets/home/images/google_play.svg";
import styles from "./home.module.css";

export default function HomeDownload() {
  return (
    <section id="download" aria-labelledby="download-title" className={`${styles.container} ${styles.downloadSection}`}>
      <div className={styles.download}>
        <div className={styles.downloadMessage}>
          <Image src="/app-icon-transparent.png" alt="" width={100} height={100} sizes="(max-width: 699px) 68px, 100px" />
          <div><h2 id="download-title">당신의 다음 시작에,<br />듀잇이 함께할게요.</h2><p>관심 있는 행사부터 새로운 일자리까지.</p></div>
        </div>
        <div className={styles.downloadStores}>
          <p>지금 듀잇을 만나보세요.</p>
          <div className={styles.storeLinks}>
            <a href="https://apps.apple.com/kr/app/id6751395152" target="_blank" rel="noopener noreferrer" aria-label="App Store에서 듀잇 다운로드 (새 탭)">
              <Image src={AppStore} width={148} height={49} alt="App Store에서 다운로드" />
            </a>
            <a href="https://play.google.com/store/apps/details?id=com.dutyit.app" target="_blank" rel="noopener noreferrer" aria-label="Google Play에서 듀잇 다운로드 (새 탭)">
              <Image src={GooglePlay} width={164} height={49} alt="Google Play에서 다운로드" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
