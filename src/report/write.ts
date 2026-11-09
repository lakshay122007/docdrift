export function writeOutput(output: string): void {
  try {
    process.stdout.write(output);
  } catch (error) {
    if (!(error instanceof Error && "code" in error && error.code === "EPIPE")) {
      throw error;
    }
  }
}
