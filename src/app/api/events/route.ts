import { EventsFetchError, fetchEvents } from "@/src/lib/api/events";
import { getEventPageRequestFromUrlSearchParams } from "@/src/lib/event-query";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const CLIENT_CACHE_SECONDS = 30;

export async function GET(request: NextRequest) {
    const pageRequest = getEventPageRequestFromUrlSearchParams(request.nextUrl.searchParams);

    try {
        const events = await fetchEvents({
            cursor: pageRequest.cursor,
            field: pageRequest.field,
            hostId: pageRequest.hostId,
            searchKeyword: pageRequest.searchKeyword,
            size: 12,
            statusGroup: pageRequest.statusGroup,
            types: pageRequest.types,
        });

        return NextResponse.json(events, {
            headers: {
                "Cache-Control": `private, max-age=${CLIENT_CACHE_SECONDS}, stale-while-revalidate=${CLIENT_CACHE_SECONDS}`,
            },
        });
    } catch (error) {
        if (error instanceof EventsFetchError && error.status < 500) {
            return NextResponse.json(
                { message: "행사 목록을 불러올 수 없습니다." },
                { status: error.status },
            );
        }

        console.error("Failed to fetch client events list", getSafeErrorLog(error));
        return NextResponse.json(
            { message: "행사 목록을 불러올 수 없습니다." },
            { status: 502 },
        );
    }
}

function getSafeErrorLog(error: unknown) {
    if (error instanceof Error) {
        return { name: error.name, message: error.message };
    }

    return { type: typeof error };
}
