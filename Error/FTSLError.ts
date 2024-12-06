export class FTSLError extends Error {
  public reason?: string;
  constructor(public message: string) {
    super(message);
  }
}
