import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

const categories = [
    { title: "봉사", description: "현장에서 함께하는 간호 활동", type: "VOLUNTEER" },
    { title: "서포터즈", description: "간호의 가치를 알리는 경험", type: "SUPPORTERS" },
    { title: "학술대회", description: "새로운 지식을 나누는 자리", type: "CONFERENCE" },
    { title: "보수교육", description: "실무 역량을 채우는 시간", type: "CONTINUING_EDUCATION" },
] as const;

export default function EventCategoryExplore() {
    return (
        <section id="category-explore" aria-labelledby="event-category-explore-title">
            <header>
                <h2 id="event-category-explore-title" className="text-2xl font-bold tracking-tight text-foreground sm:text-[28px]">관심 분야별로 둘러보기</h2>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">내게 맞는 간호 활동과 다음 기회를 찾아보세요.</p>
            </header>
            <ul className="mt-5 grid grid-cols-2 gap-x-5 border-t border-border lg:grid-cols-4 lg:gap-x-8">
                {categories.map((category) => (
                    <li key={category.type} className="min-w-0 border-b border-border">
                        <Link href={`/events?types=${category.type}`} prefetch={false}
                            className="group block py-5 focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-4">
                            <span className="flex items-center justify-between gap-2 text-base font-bold text-foreground group-hover:text-brand">
                                {category.title}<ArrowUpRight size={17} aria-hidden />
                            </span>
                            <span className="mt-2 block text-xs leading-6 text-muted-foreground sm:text-sm">{category.description}</span>
                        </Link>
                    </li>
                ))}
            </ul>
        </section>
    );
}
