import type { Metadata } from "next";

import SubmitEventForm from "@/src/components/SubmitEventForm";

export const metadata: Metadata = {
    title: "행사 제보하기 | 듀잇",
    description: "듀잇에 간호 행사를 제보해 주세요. 검토 후 행사 목록에 반영됩니다.",
    alternates: {
        canonical: "/submit-event",
    },
};

export default function SubmitEventPage() {
    return (
        <section className="px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
            <div className="mx-auto w-full max-w-3xl">
                <SubmitEventForm />
            </div>
        </section>
    );
}
