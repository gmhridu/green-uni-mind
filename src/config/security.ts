/**
 * Security Configuration for Green Uni Mind Frontend
 * Implements enterprise-level security measures for production environments
 */

import { Environment } from '@/utils/environment';

/**
 * Security configuration constants
 */
export const SecurityConfig = {
  // Redux DevTools Security
  REDUX_DEVTOOLS: {
    ENABLED: Environment.isDevelopment(),
    SANITIZE_ACTIONS: true,
    SANITIZE_STATE: true,
    TRACE_LIMIT: 25,
  },

  // API Security
  API_SECURITY: {
    ENCRYPT_REQUESTS: Environment.isProduction(),
    ENCRYPT_RESPONSES: Environment.isProduction(),
    OBFUSCATE_ENDPOINTS: Environment.isProduction(),
    REQUEST_SIGNING: Environment.isProduction(),
  },

  // Cookie Security
  COOKIE_SECURITY: {
    HTTP_ONLY: true,
    SECURE: Environment.isProduction(),
    SAME_SITE: Environment.isProduction() ? 'strict' : 'lax',
    DOMAIN_RESTRICTION: Environment.isProduction(),
    TOKEN_ROTATION: true,
    MAX_AGE: Environment.isProduction() ? 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000, // 1 day prod, 7 days dev
  },

  // Data Encryption
  ENCRYPTION: {
    ALGORITHM: 'AES-256-GCM',
    KEY_ROTATION_INTERVAL: 24 * 60 * 60 * 1000, // 24 hours
    ENCRYPT_LOCAL_STORAGE: Environment.isProduction(),
    ENCRYPT_SESSION_STORAGE: Environment.isProduction(),
  },

  // Content Security Policy
  CSP: {
    ENABLED: Environment.isProduction(),
    DIRECTIVES: {
      'default-src': ["'self'"],
      'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      'font-src': ["'self'", 'https://fonts.gstatic.com'],
      'img-src': ["'self'", 'data:', 'https:', 'blob:'],
      'connect-src': ["'self'", 'https://api.stripe.com', 'wss:'],
      'media-src': ["'self'", 'blob:', 'https:'],
      'object-src': ["'none'"],
      'base-uri': ["'self'"],
      'form-action': ["'self'"],
      'frame-ancestors': ["'none'"],
      'upgrade-insecure-requests': [],
    },
  },

  // Security Headers
  SECURITY_HEADERS: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  },

  // Sensitive Data Patterns
  SENSITIVE_PATTERNS: [
    /password/i,
    /token/i,
    /secret/i,
    /key/i,
    /auth/i,
    /credential/i,
    /session/i,
    /cookie/i,
    /email/i,
    /phone/i,
    /ssn/i,
    /credit.*card/i,
    /bank.*account/i,
  ],

  // API Endpoint Obfuscation
  ENDPOINT_OBFUSCATION: {
    ENABLED: Environment.isProduction(),
    SALT: Environment.isProduction() ? process.env.VITE_API_SALT || 'default-salt' : '',
    HASH_ALGORITHM: 'SHA-256',
  },
};

/**
 * Sanitize sensitive data for logging/debugging
 */
export const sanitizeData = (data: any): any => {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const sanitized = Array.isArray(data) ? [...data] : { ...data };

  for (const key in sanitized) {
    if (SecurityConfig.SENSITIVE_PATTERNS.some(pattern => pattern.test(key))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeData(sanitized[key]);
    }
  }

  return sanitized;
};

/**
 * Generate secure random string
 */
export const generateSecureRandom = (length: number = 32): string => {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Hash string using SHA-256
 */
export const hashString = async (input: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

/**
 * Obfuscate API endpoint for production
 */
export const obfuscateEndpoint = async (endpoint: string): Promise<string> => {
  if (!SecurityConfig.ENDPOINT_OBFUSCATION.ENABLED) {
    return endpoint;
  }

  const salt = SecurityConfig.ENDPOINT_OBFUSCATION.SALT;
  const hash = await hashString(endpoint + salt);
  return `/api/v1/secure/${hash.substring(0, 16)}`;
};

/**
 * Validate Content Security Policy
 */
export const validateCSP = (): string => {
  if (!SecurityConfig.CSP.ENABLED) {
    return '';
  }

  const directives = SecurityConfig.CSP.DIRECTIVES;
  const cspString = Object.entries(directives)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; ');

  return cspString;
};

/**
 * Security event logger
 */
export const logSecurityEvent = (event: string, details: any = {}) => {
  if (Environment.isDevelopment()) {
    console.warn(`🔒 Security Event: ${event}`, sanitizeData(details));
  }

  // In production, this would send to a security monitoring service
  if (Environment.isProduction()) {
    // TODO: Implement production security logging
    // Example: Send to security monitoring service
  }
};

/**
 * Check if current environment is secure
 */
export const isSecureEnvironment = (): boolean => {
  return (
    Environment.isProduction() &&
    window.location.protocol === 'https:' &&
    !window.location.hostname.includes('localhost')
  );
};

/**
 * Initialize security measures
 */
export const initializeSecurity = () => {
  // Set security headers if possible
  if (SecurityConfig.CSP.ENABLED) {
    const csp = validateCSP();
    if (csp) {
      const meta = document.createElement('meta');
      meta.httpEquiv = 'Content-Security-Policy';
      meta.content = csp;
      document.head.appendChild(meta);
    }
  }

  // Log security initialization
  logSecurityEvent('security_initialized', {
    environment: Environment.getEnvironment(),
    secure: isSecureEnvironment(),
    timestamp: new Date().toISOString(),
  });
};
