"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export type CategoryExploreImage = {
    src: string;
    title: string;
};

type CategoryExploreCardProps = {
    actionLabel: string;
    href: string;
    images: readonly CategoryExploreImage[];
    title: string;
};

const IMAGE_ROTATION_INTERVAL = 8_000;

export default function CategoryExploreCard({
    actionLabel,
    href,
    images,
    title,
}: CategoryExploreCardProps) {
    const cardRef = useRef<HTMLAnchorElement>(null);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [isInView, setIsInView] = useState(true);
    const activeImage = images[activeImageIndex] ?? images[0];

    useEffect(() => {
        const card = cardRef.current;
        if (card == null) return;

        if (typeof IntersectionObserver === "undefined") {
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => setIsInView(entry?.isIntersecting ?? false),
            { threshold: 0.3 },
        );

        observer.observe(card);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!isInView || images.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

        const intervalId = window.setInterval(() => {
            setActiveImageIndex((currentIndex) => (currentIndex + 1) % images.length);
        }, IMAGE_ROTATION_INTERVAL);

        return () => window.clearInterval(intervalId);
    }, [images.length, isInView]);

    if (activeImage == null) return null;

    return (
        <Link
            ref={cardRef}
            href={href}
            prefetch={false}
            aria-label={`${title} ${activeImage.title}. ${actionLabel}`}
            className="group relative isolate block min-h-[22rem] overflow-hidden rounded-[1.5rem] bg-slate-950 shadow-[0_14px_32px_rgba(15,23,42,0.16)] transition duration-500 hover:-translate-y-1 hover:shadow-[0_20px_46px_-16px_rgba(198,60,51,0.55)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-4 sm:min-h-[25rem] xl:min-h-[28rem]"
        >
            <Image
                key={activeImage.src}
                src={activeImage.src}
                alt=""
                fill
                quality={70}
                sizes="(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw"
                className="animate-[category-image-fade_700ms_ease-out] object-cover transition-transform duration-700 ease-out motion-reduce:animate-none motion-reduce:transition-none group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/72 via-40% to-transparent" />

            <div className="relative flex h-full min-h-[22rem] flex-col justify-end p-5 text-white sm:min-h-[25rem] sm:p-6 xl:min-h-[28rem]">
                <div>
                    <h3 className="text-3xl font-bold tracking-[-0.04em] drop-shadow-sm sm:text-[2rem]">
                        {title}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-sm font-medium leading-6 text-white/82">{activeImage.title}</p>
                </div>

                <div className="mt-7 flex items-center justify-between rounded-xl border border-white/25 bg-black/15 px-4 py-3 text-sm font-bold transition-colors duration-300 group-hover:bg-white/15">
                    <span>{actionLabel}</span>
                    <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none" aria-hidden />
                </div>
            </div>
        </Link>
    );
}
