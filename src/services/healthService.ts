export interface HealthCheckStatus {
  status: 'UP' | 'DOWN';
  timestamp: string;
  uptime: number;
  environment: string;
}

export class HealthService {
  public static getStatus(): HealthCheckStatus {
    return {
      status: 'UP',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    };
  }
}
