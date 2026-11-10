export class DriftcheckError extends Error {
  public readonly exitCode: number;

  public constructor(message: string, exitCode = 2) {
    super(message);
    this.name = "DriftcheckError";
    this.exitCode = exitCode;
  }
}
