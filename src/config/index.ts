interface IConfig {
  apiBaseUrl: string;
  node_env: string;
}

export const config: IConfig = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL!,
  node_env: import.meta.env.VITE_NODE_ENV!,
};
import app from "../../../backend/src/app";
