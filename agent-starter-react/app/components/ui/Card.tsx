"use client";

import { HTMLAttributes, ReactNode } from "react";
import "../../design-tokens.css";
import "../../components.css";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    variant?: "default" | "compact" | "spacious";
    accent?: "purple" | "pink" | "green";
    interactive?: boolean;
    children: ReactNode;
}

export function Card({
    variant = "default",
    accent,
    interactive = false,
    className = "",
    children,
    ...props
}: CardProps) {
    const variantClass = variant !== "default" ? variant : "";
    const accentClass = accent ? `accent-${accent}` : "";
    const interactiveClass = interactive ? "interactive" : "";

    const classes = ["card", variantClass, accentClass, interactiveClass, className]
        .filter(Boolean)
        .join(" ");

    return (
        <div className={classes} {...props}>
            {children}
        </div>
    );
}
