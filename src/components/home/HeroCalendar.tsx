"use client";

import dynamic from "next/dynamic";

const CalendarScene = dynamic(() => import("./ThreeCalendarScene"), {
    ssr: false,
    loading: () => <div className="h-full w-full" aria-hidden="true" />,
});

export default function HeroCalendar() {
    return <CalendarScene />;
}
