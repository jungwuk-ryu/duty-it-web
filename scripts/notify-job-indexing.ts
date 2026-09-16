import { parseArgs } from "node:util";
import { getJobNotifications, publishJobNotifications } from "../src/lib/job-indexing";

async function main() {
  const { values } = parseArgs({ options: {
    url: { type: "string", multiple: true },
    type: { type: "string", default: "URL_UPDATED" },
    publish: { type: "boolean", default: false },
  } });
  const plan = getJobNotifications(values.url ?? [], values.type);
  if (!values.publish) {
    console.info(JSON.stringify({ mode: "미리보기: 외부 전송 없음", notifications: plan }, null, 2));
    return;
  }
  await publishJobNotifications(plan, process.env.GOOGLE_INDEXING_ACCESS_TOKEN ?? "");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "채용 색인 알림에 실패했습니다.");
  process.exitCode = 1;
});
