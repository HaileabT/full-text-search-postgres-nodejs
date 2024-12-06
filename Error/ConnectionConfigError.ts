import { FTSLError } from "./FTSLError";

export class ConnectionConfigError extends FTSLError {
  constructor(
    public message: string,
    errType: "argument" | "connection",
    configField?: string
  ) {
    super(message);

    if (errType === "argument" && !configField) {
      throw new Error("Config error throwing error.");
    }
    this.reason =
      errType === "argument"
        ? "Invalid input for " + configField + "."
        : "Problem occured trying to connect.";
  }
}
