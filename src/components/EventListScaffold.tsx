import styles from "./ui/event-item.module.css";

type Props = {
    count?: number;
};

export default function EventListScaffold({ count = 12 }: Props) {
    return (
        <div aria-busy="true" aria-live="polite">
            <p className="sr-only">행사 목록을 불러오는 중입니다.</p>
            <div className="mb-4 flex items-center justify-between">
                <div className="h-4 w-52 rounded-full bg-border" />
            </div>
            <div className={styles.grid} aria-hidden="true">
                {Array.from({ length: count }, (_, index) => (
                    <div key={index}>
                        <div className={styles.skeletonImage} />
                        <div className={styles.skeletonMeta} />
                        <div className={styles.skeletonTitle} />
                        <div className={styles.skeletonHost} />
                    </div>
                ))}
            </div>
        </div>
    );
}
