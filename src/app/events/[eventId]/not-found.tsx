import Link from "next/link";
export default function NotFound() {
  return <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center"><h1 className="text-2xl font-bold">행사를 찾을 수 없어요</h1><p className="text-muted-foreground">삭제되었거나 유효하지 않은 행사입니다.</p><Link href="/events?view=list" className="font-bold text-brand underline">행사 목록으로</Link></div>;
}
