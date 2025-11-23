"use client";

import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from "react";
import "../../design-tokens.css";
import "../../components.css";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    state?: "default" | "error" | "success";
    label?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ state = "default", label, className = "", ...props }, ref) => {
        const stateClass = state !== "default" ? state : "";
        const classes = ["input", stateClass, className].filter(Boolean).join(" ");

        return (
            <div>
                {label && (
                    <label
                        style={{
                            display: "block",
                            marginBottom: "var(--space-2)",
                            color: "var(--color-text-secondary)",
                            fontWeight: "var(--font-weight-medium)",
                        }}
                    >
                        {label}
                    </label>
                )}
                <input ref={ref} className={classes} {...props} />
            </div>
        );
    }
);

Input.displayName = "Input";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    state?: "default" | "error" | "success";
    label?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ state = "default", label, className = "", ...props }, ref) => {
        const stateClass = state !== "default" ? state : "";
        const classes = ["input", "textarea", stateClass, className]
            .filter(Boolean)
            .join(" ");

        return (
            <div>
                {label && (
                    <label
                        style={{
                            display: "block",
                            marginBottom: "var(--space-2)",
                            color: "var(--color-text-secondary)",
                            fontWeight: "var(--font-weight-medium)",
                        }}
                    >
                        {label}
                    </label>
                )}
                <textarea ref={ref} className={classes} {...props} />
            </div>
        );
    }
);

Textarea.displayName = "Textarea";
