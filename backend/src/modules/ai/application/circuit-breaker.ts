export class CircuitBreaker {
  private failures = 0;
  private openUntil: number | null = null;

  constructor(private readonly failureThreshold: number, private readonly openSeconds: number) {}

  isOpen(): boolean {
    if (!this.openUntil) return false;
    if (Date.now() > this.openUntil) {
      this.openUntil = null;
      this.failures = 0;
      return false;
    }
    return true;
  }

  recordFailure() {
    this.failures += 1;
    if (this.failures >= this.failureThreshold) {
      this.openUntil = Date.now() + this.openSeconds * 1000;
    }
  }

  recordSuccess() {
    this.failures = 0;
    this.openUntil = null;
  }
}
