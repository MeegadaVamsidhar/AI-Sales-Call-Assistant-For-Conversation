export type ThemeMode = 'light' | 'dark' | 'system';

export interface AppConfig {
    sandboxId?: string;
    companyName: string;
    pageTitle: string;
    pageDescription: string;
    supportsChatInput: boolean;
    supportsVideoInput: boolean;
    supportsScreenShare: boolean;
    isPreConnectBufferEnabled: boolean;
    logo: string;
    accent: string;
    logoDark: string;
    accentDark: string;
    startButtonText: string;
    agentName?: string;
}

export interface SandboxConfig {
    [key: string]: {
        type: string;
        value: any;
    } | null;
}
