"use client";

import { ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";
import "../../design-tokens.css";
import "../../components.css";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: ReactNode;
    children: ReactNode;
    actions?: ReactNode;
}

export function Modal({ isOpen, onClose, title, children, actions }: ModalProps) {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }

        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                onClose();
            }
        };

        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return createPortal(
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                {title && <h2 className="modal-title">{title}</h2>}
                <div className="modal-body">{children}</div>
                {actions && <div className="modal-actions">{actions}</div>}
            </div>
        </div>,
        document.body
    );
}
