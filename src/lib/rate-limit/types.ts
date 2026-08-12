export interface RateLimitConfig {
  /** Max allowed hits within the window. */
  limit: number;
  windowSeconds: number;
}

export interface RateLimitDecision {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number | null;
}
