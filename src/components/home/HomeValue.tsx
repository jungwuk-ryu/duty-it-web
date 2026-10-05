import styles from "./home.module.css";

export default function HomeValue() {
  return (
    <section className={styles.value} aria-labelledby="home-value-title">
      <div className={styles.container + " " + styles.valueContent}>
        <div>
          <p className={styles.valueLabel}>왜 듀잇인가요?</p>
          <h2 id="home-value-title">흩어진 간호 정보, 한곳에서 한눈에</h2>
        </div>
        <p className={styles.valueDescription}>
          여러 곳에 흩어진 교육·행사·채용 정보.<br />
          듀잇에서 모아보고, 나에게 필요한 기회를 찾아보세요.
        </p>
      </div>
    </section>
  );
}
