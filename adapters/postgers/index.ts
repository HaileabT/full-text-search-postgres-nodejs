import { Client, ConnectionConfig, ExecuteConfig } from "pg";
import { FTSLError } from "../../Error/FTSLError";
import { ConnectionConfigError } from "../../Error/ConnectionConfigError";

export class PostgresConnection {
  public connConfig!: ConnectionConfig;
  public conn!: Client;

  constructor(
    public username: string,
    public password: string,
    public port: number | string,
    public databaseName: string,
    public host: string
  ) {
    if (username.trim() === "") {
      throw new ConnectionConfigError(
        "Username is empty.",
        "argument",
        "username"
      );
    }

    if (password.trim() === "") {
      throw new ConnectionConfigError(
        "Password is empty.",
        "argument",
        "username"
      );
    }

    if (host.trim() === "") {
      throw new ConnectionConfigError(
        "Host parameter is empty.",
        "argument",
        "username"
      );
    }

    if (databaseName.trim() === "") {
      throw new ConnectionConfigError(
        "Database name is empty.",
        "argument",
        "username"
      );
    }

    if (typeof port === "string" && isNaN(parseInt(port))) {
      throw new ConnectionConfigError(
        "Please provide a numerical port number.",
        "argument",
        "port"
      );
    }

    const portNumber = parseInt(port.toString());
    if (portNumber > 49151 || portNumber < 1024) {
      throw new ConnectionConfigError(
        "Port number out of range.",
        "argument",
        "port"
      );
    }

    this.connConfig = {
      user: username,
      password: password,
      database: databaseName,
      host: host,
      port: portNumber,
    };

    try {
      this.conn = new Client(this.connConfig);
    } catch (err: any) {
      const connectionError = new FTSLError("ERR: " + err.message);
      throw connectionError;
    }
  }

  public async connect() {
    try {
      await this.conn.connect();
    } catch (err: any) {
      const connectionError = new ConnectionConfigError(
        err.message,
        "connection"
      );
      throw connectionError;
    }
  }
}
