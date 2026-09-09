import React from "react";

type Props = {
    title: string;
    content: string;
};

export default function PrimaryCard({ title, content }: Props) {
    return (
        <div className="drop-shadow-lg rounded-xl bg-background p-10 hover:scale-103 transition-transform hover:shadow-lg">
            <p className="text-xl font-bold leading-relaxed">{title}</p>
            <p className="text-muted-foreground">{content}</p>
        </div>
    );
}