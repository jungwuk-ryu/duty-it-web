import assert from "node:assert/strict";
import test from "node:test";
import { JobPostingPageSchema, JobPostingSchema } from "./schemas/job";

const encodedJob = {
    id: 1,
    isActive: true,
    company: { id: 2, corpNm: "병원 &amp; 센터" },
    wantedTitle: "중흥골드스파&amp;리조트 &#40;간호사&#41; 모집",
    jobCont: "간호 &lt;script&gt;업무&lt;/script&gt; &amp;lt;표기&gt;",
    dtlRecrContUrl: "https://example.com/apply?a=1&amp;b=2",
};

test("job API text is decoded once for list and detail views", () => {
    const detail = JobPostingSchema.parse(encodedJob);
    const list = JobPostingPageSchema.parse({
        content: [encodedJob],
        pageInfo: { hasNext: false, pageSize: 1 },
    }).content[0];

    for (const job of [detail, list]) {
        assert.equal(job.wantedTitle, "중흥골드스파&리조트 (간호사) 모집");
        assert.equal(job.company.corpNm, "병원 & 센터");
        assert.equal(job.jobCont, "간호 <script>업무</script> &lt;표기>");
        assert.equal(job.dtlRecrContUrl, "https://example.com/apply?a=1&b=2");
    }
});
