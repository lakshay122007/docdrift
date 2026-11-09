export class DocdriftError extends Error {
  public readonly exitCode: number;

  public constructor(message: string, exitCode = 2) {
    super(message);
    this.name = "DocdriftError";
    this.exitCode = exitCode;
  }
}
