"use client";

import "../../design-tokens.css";
import "../../components.css";

interface StatusIndicatorProps {
    status: "active" | "inactive";
    children: string;
}

export function StatusIndicator({ status, children }: StatusIndicatorProps) {
    const className = `status-indicator ${status}`;

    return <span className={className}>{children}</span>;
}

interface SkeletonProps {
    width?: string;
    height?: string;
    className?: string;
}

export function Skeleton({ width = "100%", height = "20px", className = "" }: SkeletonProps) {
    return (
        <div
            className={`skeleton ${className}`}
            style={{ width, height }}
        ></div>
    );
}

interface HeroProps {
    title: string;
    subtitle?: string;
    actions?: React.ReactNode;
}

export function Hero({ title, subtitle, actions }: HeroProps) {
    return (
        <section className="hero">
            <div className="hero-background"></div>
            <h1 className="hero-title">{title}</h1>
            {subtitle && <p className="hero-subtitle">{subtitle}</p>}
            {actions && <div className="hero-actions">{actions}</div>}
        </section>
    );
}
