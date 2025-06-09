interface IConfig {
  oauth: {
    google: {
      clientId: string;
      redirectUri: string;
    };
    facebook: {
      clientId: string;
      redirectUri: string;
    };
    apple: {
      clientId: string;
      redirectUri: string;
    };
  };
  apiBaseUrl: string;
  node_env: string;
}

export const config: IConfig = {
  oauth: {
    google: {
      clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      redirectUri: import.meta.env.VITE_GOOGLE_REDIRECT_URI,
    },
    facebook: {
      clientId: import.meta.env.VITE_FACEBOOK_CLIENT_ID,
      redirectUri: import.meta.env.VITE_FACEBOOK_REDIRECT_URI,
    },
    apple: {
      clientId: import.meta.env.VITE_APPLE_CLIENT_ID,
      redirectUri: import.meta.env.VITE_APPLE_REDIRECT_URI,
    },
  },
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL!,
  node_env: import.meta.env.VITE_NODE_ENV!,
};

