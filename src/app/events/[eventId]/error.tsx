"use client";
import Link from "next/link";
import { Button } from "@/src/components/ui/button";
export default function Error({ reset }: { reset: () => void }) {
  return <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center"><h1 className="text-2xl font-bold">행사를 불러오지 못했어요</h1><p className="text-muted-foreground">잠시 후 다시 시도해 주세요.</p><Button onClick={reset}>다시 시도</Button><Link href="/events?view=list" className="text-sm underline">행사 목록으로</Link></div>;
}
