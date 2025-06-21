// Frontend keep-alive service to prevent backend sleeping
class FrontendKeepAlive {
  private intervalId: number | null = null;
  private readonly backendUrl: string;
  private readonly interval: number; // in milliseconds

  constructor(backendUrl: string, intervalMinutes: number = 10) {
    this.backendUrl = backendUrl;
    this.interval = intervalMinutes * 60 * 1000;
  }

  start(): void {
    if (this.intervalId) {
      console.log('Keep-alive service is already running');
      return;
    }

    console.log(`Starting frontend keep-alive service for ${this.backendUrl}`);
    
    // Initial ping after 1 minute
    setTimeout(() => {
      this.ping();
    }, 60000);

    // Set up recurring pings
    this.intervalId = window.setInterval(() => {
      this.ping();
    }, this.interval);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('Frontend keep-alive service stopped');
    }
  }

  private async ping(): Promise<void> {
    try {
      const response = await fetch(`${this.backendUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Don't include credentials for health check
        credentials: 'omit',
      });

      if (response.ok) {
        console.log(`Keep-alive ping successful: ${response.status} - ${new Date().toISOString()}`);
      } else {
        console.warn(`Keep-alive ping failed: ${response.status}`);
      }
    } catch (error) {
      console.error('Keep-alive ping error:', error);
    }
  }
}

// Create and export singleton instance
// In development, use local backend; in production, use the production backend
const getBackendUrl = () => {
  const isDevelopment = import.meta.env.VITE_NODE_ENV === 'development' ||
                       import.meta.env.DEV ||
                       window.location.hostname === 'localhost';

  if (isDevelopment) {
    return 'http://localhost:5000'; // Local backend for development
  }

  return import.meta.env.VITE_BACKEND_URL || 'https://green-uni-mind-backend-oxpo.onrender.com';
};

const frontendKeepAlive = new FrontendKeepAlive(
  getBackendUrl(),
  10 // Ping every 10 minutes
);

export default frontendKeepAlive;
