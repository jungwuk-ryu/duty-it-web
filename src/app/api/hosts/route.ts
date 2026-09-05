import { NextResponse } from "next/server";

export const runtime = "nodejs";

const HOST_LIST_CACHE_SECONDS = 300;

type HostOption = {
    id: number;
    name: string;
};

export async function GET() {
    const apiBase = process.env.API_BASE?.replace(/\/$/, "");
    if (!apiBase) {
        return NextResponse.json(
            { message: "주최 기관 목록을 현재 불러올 수 없습니다." },
            { status: 503 },
        );
    }

    const params = new URLSearchParams({
        field: "NAME",
        page: "0",
        size: "1000",
        sortDirection: "ASC",
    });

    try {
        const upstreamResponse = await fetch(`${apiBase}/v1/hosts?${params.toString()}`, {
            next: { revalidate: HOST_LIST_CACHE_SECONDS },
        });

        if (!upstreamResponse.ok) {
            return NextResponse.json(
                { message: "주최 기관 목록을 현재 불러올 수 없습니다." },
                { status: 502 },
            );
        }

        const hosts = getHostOptions(await upstreamResponse.json());
        if (!hosts) {
            return NextResponse.json(
                { message: "주최 기관 목록 형식이 올바르지 않습니다." },
                { status: 502 },
            );
        }

        return NextResponse.json(
            { hosts },
            {
                headers: {
                    "Cache-Control": `public, max-age=${HOST_LIST_CACHE_SECONDS}, s-maxage=${HOST_LIST_CACHE_SECONDS}, stale-while-revalidate=60`,
                },
            },
        );
    } catch {
        return NextResponse.json(
            { message: "주최 기관 목록을 현재 불러올 수 없습니다." },
            { status: 502 },
        );
    }
}

function getHostOptions(value: unknown): HostOption[] | null {
    if (!isRecord(value) || !Array.isArray(value.content)) return null;

    return value.content.flatMap((host) => {
        if (!isRecord(host)) return [];

        const id = host.id;
        const name = host.name;
        if (
            typeof id !== "number"
            || !Number.isSafeInteger(id)
            || id <= 0
            || typeof name !== "string"
            || !name.trim()
        ) {
            return [];
        }

        return [{ id, name: name.trim() }];
    });
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}
