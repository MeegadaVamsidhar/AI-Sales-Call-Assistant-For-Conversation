import type { AppConfig } from './lib/types';

export const APP_CONFIG_DEFAULTS: AppConfig = {
  companyName: 'Springboard',
  pageTitle: 'Springboard Voice Agent',
  pageDescription: 'A voice agent built to get more information about our books',

  supportsChatInput: true,
  supportsVideoInput: true,
  supportsScreenShare: true,
  isPreConnectBufferEnabled: true,

  logo: '/Main.svg',
  // Updated to match the purple from your card button
  accent: '#6f2aff',
  logoDark: '/lk-logo-dark.svg',
  // Dark theme primary tuned to a teal/purple complement
  accentDark: '#5b9cff',
  startButtonText: 'CLICK HERE TO CONNECT',

  agentName: undefined,
};
