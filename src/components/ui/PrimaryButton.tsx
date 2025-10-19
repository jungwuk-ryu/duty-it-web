import React from "react";

type Props = {
    children: React.ReactNode;
    onClick?: () => void;
};

export default function PrimaryButton({ children, onClick }: Props) {
    return (
        <button
            onClick={onClick}
            className="bg-brand rounded-3xl text-white px-4 py-2 cursor-pointer"
        >
            {children}
        </button>
    );
}
