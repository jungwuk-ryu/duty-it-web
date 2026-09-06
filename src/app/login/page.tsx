import type { Metadata } from "next";

import LoginForm from "@/src/components/LoginForm";

export const metadata: Metadata = {
    title: "로그인 | 듀잇",
    description: "Google 또는 Apple 계정으로 듀잇에 로그인하세요.",
    alternates: {
        canonical: "/login",
    },
};

export default function LoginPage() {
    return <LoginForm />;
}
