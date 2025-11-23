"use client";

import { useState } from "react";
import "../../design-tokens.css";
import "../../components.css";

export default function ComponentShowcase() {
    const [isDark, setIsDark] = useState(false);

    const toggleTheme = () => {
        setIsDark(!isDark);
        document.documentElement.classList.toggle("dark");
    };

    return (
        <div className={isDark ? "dark" : ""}>
            <div style={{ fontFamily: "var(--font-primary)", margin: 0, padding: 0 }}>
                {/* Theme Toggle */}
                <button
                    className="cta-secondary theme-toggle"
                    onClick={toggleTheme}
                    style={{
                        position: "fixed",
                        top: "var(--space-6)",
                        right: "var(--space-6)",
                        zIndex: 1000,
                    }}
                >
                    {isDark ? "☀️" : "🌙"} Toggle {isDark ? "Light" : "Dark"} Mode
                </button>

                {/* Header */}
                <header
                    style={{
                        textAlign: "center",
                        padding: "var(--space-16) var(--space-6)",
                        borderBottom: "1px solid var(--color-border-default)",
                        marginBottom: "var(--space-12)",
                    }}
                >
                    <h1
                        className="hero-title"
                        style={{ marginBottom: "var(--space-4)" }}
                    >
                        <span className="text-gradient">AI Sales Call Assistant</span>
                        <br />
                        Design System
                    </h1>
                    <p className="hero-subtitle">
                        Modern, premium UI components with glassmorphism and delightful
                        micro-interactions
                    </p>
                </header>

                <div
                    className="container"
                    style={{ maxWidth: "1200px", margin: "0 auto", padding: "var(--space-8)" }}
                >
                    {/* Buttons Section */}
                    <ButtonsSection />

                    {/* Cards Section */}
                    <CardsSection />

                    {/* Chat Interface Section */}
                    <ChatSection />

                    {/* Input Fields Section */}
                    <InputSection />

                    {/* Transcript Cards Section */}
                    <TranscriptSection />

                    {/* Rating Component Section */}
                    <RatingSection />

                    {/* Status Indicators Section */}
                    <StatusSection />

                    {/* Loading States Section */}
                    <LoadingSection />

                    {/* Color Palette Section */}
                    <ColorSection />

                    {/* Footer */}
                    <Footer />
                </div>
            </div>
        </div>
    );
}

// Buttons Section Component
function ButtonsSection() {
    return (
        <section className="section" style={{ marginBottom: "var(--space-16)" }}>
            <h2 className="section-title">Buttons</h2>
            <p className="section-description">
                Primary and secondary CTAs with hover, focus, and active states. All
                animations are smooth and responsive.
            </p>

            <div
                className="component-row"
                style={{
                    display: "flex",
                    gap: "var(--space-4)",
                    flexWrap: "wrap",
                    marginBottom: "var(--space-6)",
                }}
            >
                <button className="cta-primary">Primary Button</button>
                <button className="cta-primary large">Large Primary</button>
                <button className="cta-primary small">Small Primary</button>
                <button className="cta-primary" disabled>
                    Disabled
                </button>
            </div>

            <div
                className="component-row"
                style={{
                    display: "flex",
                    gap: "var(--space-4)",
                    flexWrap: "wrap",
                    marginBottom: "var(--space-6)",
                }}
            >
                <button className="cta-secondary">Secondary Button</button>
                <button className="cta-secondary large">Large Secondary</button>
                <button className="cta-secondary small">Small Secondary</button>
            </div>

            <div
                className="component-row"
                style={{
                    display: "flex",
                    gap: "var(--space-4)",
                    flexWrap: "wrap",
                    marginBottom: "var(--space-6)",
                }}
            >
                <button className="cta-primary full-width">Full Width Button</button>
            </div>
        </section>
    );
}

// Cards Section Component
function CardsSection() {
    return (
        <section className="section" style={{ marginBottom: "var(--space-16)" }}>
            <h2 className="section-title">Glass Cards</h2>
            <p className="section-description">
                Glassmorphic cards with backdrop blur, subtle borders, and interactive
                hover states.
            </p>

            <div
                className="grid-3"
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                    gap: "var(--space-6)",
                }}
            >
                <div className="card interactive accent-purple">
                    <h3
                        style={{
                            margin: "0 0 var(--space-3) 0",
                            fontSize: "var(--font-size-xl)",
                            color: "var(--color-text-primary)",
                        }}
                    >
                        Smart Recommendations
                    </h3>
                    <p
                        style={{
                            margin: 0,
                            color: "var(--color-text-secondary)",
                            lineHeight: "var(--line-height-relaxed)",
                        }}
                    >
                        AI-powered book suggestions based on real-time conversation analysis
                        and customer preferences.
                    </p>
                </div>

                <div className="card interactive accent-pink">
                    <h3
                        style={{
                            margin: "0 0 var(--space-3) 0",
                            fontSize: "var(--font-size-xl)",
                            color: "var(--color-text-primary)",
                        }}
                    >
                        Real-time Analysis
                    </h3>
                    <p
                        style={{
                            margin: 0,
                            color: "var(--color-text-secondary)",
                            lineHeight: "var(--line-height-relaxed)",
                        }}
                    >
                        Track customer sentiment, engagement levels, and purchase intent
                        during live conversations.
                    </p>
                </div>

                <div className="card interactive accent-green">
                    <h3
                        style={{
                            margin: "0 0 var(--space-3) 0",
                            fontSize: "var(--font-size-xl)",
                            color: "var(--color-text-primary)",
                        }}
                    >
                        Call Transcripts
                    </h3>
                    <p
                        style={{
                            margin: 0,
                            color: "var(--color-text-secondary)",
                            lineHeight: "var(--line-height-relaxed)",
                        }}
                    >
                        Detailed conversation records with timestamps, speaker
                        identification, and key insights.
                    </p>
                </div>
            </div>
        </section>
    );
}

// Chat Section Component
function ChatSection() {
    return (
        <section className="section" style={{ marginBottom: "var(--space-16)" }}>
            <h2 className="section-title">Chat Interface</h2>
            <p className="section-description">
                Chat bubbles with slide-in animations, typing indicators, and proper
                message alignment.
            </p>

            <div className="card" style={{ maxWidth: "600px" }}>
                <div className="chat-container">
                    <div className="bubble-agent">
                        Hello! How can I help you find the perfect book today?
                    </div>

                    <div className="bubble-user">
                        I'm looking for mystery novels with strong female leads.
                    </div>

                    <div className="bubble-agent">
                        Excellent choice! Based on your preference, I'd recommend "The Girl
                        with the Dragon Tattoo" by Stieg Larsson. It features Lisbeth
                        Salander, one of the most iconic female protagonists in mystery
                        fiction. Would you like to hear more about it?
                    </div>

                    <div className="bubble-user">Yes, that sounds interesting!</div>

                    <div className="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
            </div>
        </section>
    );
}

// Input Section Component
function InputSection() {
    return (
        <section className="section" style={{ marginBottom: "var(--space-16)" }}>
            <h2 className="section-title">Input Fields</h2>
            <p className="section-description">
                Form inputs with focus states, validation feedback, and smooth
                animations.
            </p>

            <div style={{ maxWidth: "500px" }}>
                <div style={{ marginBottom: "var(--space-4)" }}>
                    <label
                        style={{
                            display: "block",
                            marginBottom: "var(--space-2)",
                            color: "var(--color-text-secondary)",
                            fontWeight: "var(--font-weight-medium)",
                        }}
                    >
                        Default Input
                    </label>
                    <input
                        type="text"
                        className="input"
                        placeholder="Enter your name..."
                    />
                </div>

                <div style={{ marginBottom: "var(--space-4)" }}>
                    <label
                        style={{
                            display: "block",
                            marginBottom: "var(--space-2)",
                            color: "var(--color-text-secondary)",
                            fontWeight: "var(--font-weight-medium)",
                        }}
                    >
                        Success State
                    </label>
                    <input
                        type="text"
                        className="input success"
                        defaultValue="valid@email.com"
                    />
                </div>

                <div style={{ marginBottom: "var(--space-4)" }}>
                    <label
                        style={{
                            display: "block",
                            marginBottom: "var(--space-2)",
                            color: "var(--color-text-secondary)",
                            fontWeight: "var(--font-weight-medium)",
                        }}
                    >
                        Error State
                    </label>
                    <input
                        type="text"
                        className="input error"
                        placeholder="Required field"
                    />
                </div>

                <div>
                    <label
                        style={{
                            display: "block",
                            marginBottom: "var(--space-2)",
                            color: "var(--color-text-secondary)",
                            fontWeight: "var(--font-weight-medium)",
                        }}
                    >
                        Textarea
                    </label>
                    <textarea
                        className="input textarea"
                        placeholder="Your feedback..."
                    ></textarea>
                </div>
            </div>
        </section>
    );
}

// Transcript Section Component
function TranscriptSection() {
    return (
        <section className="section" style={{ marginBottom: "var(--space-16)" }}>
            <h2 className="section-title">Transcript Cards</h2>
            <p className="section-description">
                Timeline-style transcript entries with speaker avatars and accent
                borders.
            </p>

            <div style={{ maxWidth: "700px" }}>
                <div
                    style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}
                >
                    <div className="transcript-card agent">
                        <div className="transcript-time">3:45</div>
                        <div className="transcript-content">
                            <div className="transcript-speaker">
                                <div className="transcript-avatar"></div>
                                AI Agent
                            </div>
                            <div className="transcript-message">
                                Based on your interest in mystery novels with strong female
                                leads, I recommend "The Silent Patient" by Alex Michaelides.
                                It's a psychological thriller that's been getting excellent
                                reviews.
                            </div>
                        </div>
                    </div>

                    <div className="transcript-card customer">
                        <div className="transcript-time">3:52</div>
                        <div className="transcript-content">
                            <div className="transcript-speaker">
                                <div
                                    className="transcript-avatar"
                                    style={{ background: "var(--gradient-primary-end)" }}
                                ></div>
                                Customer
                            </div>
                            <div className="transcript-message">
                                That sounds perfect! What's the price and do you have it in
                                stock?
                            </div>
                        </div>
                    </div>

                    <div className="transcript-card agent">
                        <div className="transcript-time">3:55</div>
                        <div className="transcript-content">
                            <div className="transcript-speaker">
                                <div className="transcript-avatar"></div>
                                AI Agent
                            </div>
                            <div className="transcript-message">
                                Great choice! The book is priced at $16.99 and we have it in
                                stock. We also have the audiobook version for $24.99 if you're
                                interested. Would you like to proceed with the order?
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

// Rating Section Component
function RatingSection() {
    const [rating, setRating] = useState(3);

    return (
        <section className="section" style={{ marginBottom: "var(--space-16)" }}>
            <h2 className="section-title">Rating Component</h2>
            <p className="section-description">
                Interactive star rating with hover effects and fill animations.
            </p>

            <div
                className="card"
                style={{ maxWidth: "400px", textAlign: "center" }}
            >
                <h3 style={{ margin: "0 0 var(--space-4) 0" }}>
                    Rate Your Experience
                </h3>
                <div
                    className="rating"
                    style={{ justifyContent: "center", marginBottom: "var(--space-4)" }}
                >
                    {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                            key={star}
                            className={`rating-star ${star <= rating ? "filled" : ""}`}
                            width="32"
                            height="32"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            onClick={() => setRating(star)}
                            style={{ cursor: "pointer" }}
                        >
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                    ))}
                </div>
                <p style={{ color: "var(--color-text-secondary)", margin: 0 }}>
                    {rating} out of 5 stars
                </p>
            </div>
        </section>
    );
}

// Status Section Component
function StatusSection() {
    return (
        <section className="section" style={{ marginBottom: "var(--space-16)" }}>
            <h2 className="section-title">Status Indicators</h2>
            <p className="section-description">
                Status badges for showing active states, online/offline, etc.
            </p>

            <div
                className="component-row"
                style={{
                    display: "flex",
                    gap: "var(--space-4)",
                    flexWrap: "wrap",
                    marginBottom: "var(--space-6)",
                }}
            >
                <span className="status-indicator active">Active Call</span>
                <span className="status-indicator inactive">Offline</span>
            </div>
        </section>
    );
}

// Loading Section Component
function LoadingSection() {
    return (
        <section className="section" style={{ marginBottom: "var(--space-16)" }}>
            <h2 className="section-title">Loading States</h2>
            <p className="section-description">
                Skeleton loaders with shimmer animation for better perceived
                performance.
            </p>

            <div className="card" style={{ maxWidth: "400px" }}>
                <div
                    className="skeleton"
                    style={{
                        height: "24px",
                        width: "60%",
                        marginBottom: "var(--space-3)",
                    }}
                ></div>
                <div
                    className="skeleton"
                    style={{
                        height: "16px",
                        width: "100%",
                        marginBottom: "var(--space-2)",
                    }}
                ></div>
                <div
                    className="skeleton"
                    style={{
                        height: "16px",
                        width: "90%",
                        marginBottom: "var(--space-2)",
                    }}
                ></div>
                <div
                    className="skeleton"
                    style={{ height: "16px", width: "75%" }}
                ></div>
            </div>
        </section>
    );
}

// Color Section Component
function ColorSection() {
    return (
        <section className="section" style={{ marginBottom: "var(--space-16)" }}>
            <h2 className="section-title">Color Palette</h2>
            <p className="section-description">
                Primary gradient, semantic colors, and neutral grays.
            </p>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
                    gap: "var(--space-4)",
                }}
            >
                <ColorSwatch
                    name="Primary Gradient"
                    color="var(--gradient-primary)"
                />
                <ColorSwatch name="Success" color="var(--color-success)" />
                <ColorSwatch name="Error" color="var(--color-error)" />
                <ColorSwatch name="Warning" color="var(--color-warning)" />
                <ColorSwatch name="Info" color="var(--color-info)" />
            </div>
        </section>
    );
}

// Color Swatch Component
function ColorSwatch({ name, color }: { name: string; color: string }) {
    return (
        <div style={{ textAlign: "center" }}>
            <div
                style={{
                    height: "100px",
                    background: color,
                    borderRadius: "var(--radius-lg)",
                    marginBottom: "var(--space-2)",
                }}
            ></div>
            <div
                style={{
                    fontSize: "var(--font-size-sm)",
                    color: "var(--color-text-secondary)",
                }}
            >
                {name}
            </div>
        </div>
    );
}

// Footer Component
function Footer() {
    return (
        <footer
            style={{
                textAlign: "center",
                padding: "var(--space-12) 0",
                borderTop: "1px solid var(--color-border-default)",
                marginTop: "var(--space-16)",
            }}
        >
            <p
                style={{
                    color: "var(--color-text-secondary)",
                    marginBottom: "var(--space-4)",
                }}
            >
                AI Sales Call Assistant Design System v2.0
            </p>
            <div
                className="component-row"
                style={{
                    display: "flex",
                    gap: "var(--space-4)",
                    justifyContent: "center",
                    flexWrap: "wrap",
                }}
            >
                <button className="cta-secondary">📚 Full Documentation</button>
                <button className="cta-secondary">⚡ Quick Reference</button>
                <button className="cta-secondary">🎬 Animation Specs</button>
            </div>
        </footer>
    );
}
