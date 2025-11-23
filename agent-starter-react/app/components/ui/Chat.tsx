"use client";

import { ReactNode } from "react";
import "../../design-tokens.css";
import "../../components.css";

interface ChatBubbleProps {
    type: "user" | "agent";
    children: ReactNode;
}

export function ChatBubble({ type, children }: ChatBubbleProps) {
    const className = type === "user" ? "bubble-user" : "bubble-agent";

    return <div className={className}>{children}</div>;
}

export function ChatContainer({ children }: { children: ReactNode }) {
    return <div className="chat-container">{children}</div>;
}

export function TypingIndicator() {
    return (
        <div className="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
        </div>
    );
}
