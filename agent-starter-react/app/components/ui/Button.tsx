"use client";

import { ButtonHTMLAttributes } from "react";
import "../../design-tokens.css";
import "../../components.css";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary";
    size?: "small" | "default" | "large";
    fullWidth?: boolean;
}

export function Button({
    variant = "primary",
    size = "default",
    fullWidth = false,
    className = "",
    children,
    ...props
}: ButtonProps) {
    const baseClass = variant === "primary" ? "cta-primary" : "cta-secondary";
    const sizeClass = size !== "default" ? size : "";
    const widthClass = fullWidth ? "full-width" : "";

    const classes = [baseClass, sizeClass, widthClass, className]
        .filter(Boolean)
        .join(" ");

    return (
        <button className={classes} {...props}>
            {children}
        </button>
    );
}
