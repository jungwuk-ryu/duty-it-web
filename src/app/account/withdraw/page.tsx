import type { Metadata } from "next";
import WithdrawAccountForm from "@/src/components/WithdrawAccountForm";

export const metadata: Metadata = {
    title: "회원 탈퇴 | 듀잇",
    robots: { index: false, follow: false },
    alternates: { canonical: "/account/withdraw" },
};

export default function WithdrawAccountPage() {
    return <WithdrawAccountForm />;
}
