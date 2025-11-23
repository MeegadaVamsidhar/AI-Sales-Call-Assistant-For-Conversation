"use client";

import { useState } from "react";
import "../../design-tokens.css";
import "../../components.css";

interface RatingProps {
    value?: number;
    onChange?: (rating: number) => void;
    max?: number;
    readonly?: boolean;
}

export function Rating({
    value = 0,
    onChange,
    max = 5,
    readonly = false,
}: RatingProps) {
    const [hoverRating, setHoverRating] = useState(0);

    const handleClick = (rating: number) => {
        if (!readonly && onChange) {
            onChange(rating);
        }
    };

    const handleMouseEnter = (rating: number) => {
        if (!readonly) {
            setHoverRating(rating);
        }
    };

    const handleMouseLeave = () => {
        setHoverRating(0);
    };

    return (
        <div className="rating" onMouseLeave={handleMouseLeave}>
            {Array.from({ length: max }, (_, index) => {
                const starValue = index + 1;
                const isFilled = starValue <= (hoverRating || value);

                return (
                    <svg
                        key={starValue}
                        className={`rating-star ${isFilled ? "filled" : ""}`}
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        onClick={() => handleClick(starValue)}
                        onMouseEnter={() => handleMouseEnter(starValue)}
                        style={{ cursor: readonly ? "default" : "pointer" }}
                    >
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                );
            })}
        </div>
    );
}
