import Image from "next/image";
import { AppStoreButton } from "@/src/components/ui/app-store-button";
import { PlayStoreButton } from "@/src/components/ui/play-store-button";
import styles from "./home.module.css";

export default function HomeDownload() {
  return (
    <section id="download" aria-labelledby="download-title" className={styles.container + " " + styles.downloadSection}>
      <div className={styles.download}>
        <div className={styles.downloadMessage}>
          <Image src="/app-icon-transparent.png" alt="" width={100} height={100} sizes="(max-width: 699px) 68px, 100px" />
          <div><h2 id="download-title">당신의 다음 시작에,<br />듀잇이 함께할게요.</h2><p>관심 있는 행사부터 새로운 일자리까지.</p></div>
        </div>
        <div className={styles.downloadStores}>
          <p>지금 듀잇을 만나보세요.</p>
          <div className={styles.storeLinks}>
            <AppStoreButton
              href="https://apps.apple.com/kr/app/id6751395152"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="App Store에서 듀잇 다운로드 (새 탭)"
              className={styles.storeButton}
            />
            <PlayStoreButton
              href="https://play.google.com/store/apps/details?id=com.dutyit.app"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Google Play에서 듀잇 다운로드 (새 탭)"
              className={styles.storeButton}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
