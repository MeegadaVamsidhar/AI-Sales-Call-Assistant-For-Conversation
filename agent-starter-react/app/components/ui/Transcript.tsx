"use client";

import { ReactNode } from "react";
import "../../design-tokens.css";
import "../../components.css";

interface TranscriptCardProps {
    time: string;
    speaker: "agent" | "customer";
    speakerName: string;
    message: string;
    avatarColor?: string;
}

export function TranscriptCard({
    time,
    speaker,
    speakerName,
    message,
    avatarColor,
}: TranscriptCardProps) {
    const cardClass = speaker === "agent" ? "transcript-card agent" : "transcript-card customer";
    const defaultAvatarColor = speaker === "agent"
        ? "var(--gradient-primary)"
        : "var(--gradient-primary-end)";

    return (
        <div className={cardClass}>
            <div className="transcript-time">{time}</div>
            <div className="transcript-content">
                <div className="transcript-speaker">
                    <div
                        className="transcript-avatar"
                        style={{ background: avatarColor || defaultAvatarColor }}
                    ></div>
                    {speakerName}
                </div>
                <div className="transcript-message">{message}</div>
            </div>
        </div>
    );
}

interface TranscriptListProps {
    children: ReactNode;
}

export function TranscriptList({ children }: TranscriptListProps) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            {children}
        </div>
    );
}
