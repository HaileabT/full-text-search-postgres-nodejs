import { PostgresConnection } from "./adapters/postgers";
import { FullTextSearchManager } from "./manager";

const conn = new PostgresConnection("postgres", "root@postgres", 5432, "random_db", "localhost");

const ftsl = FullTextSearchManager.init(conn.conn, {
  mainEntity: "user",
  fieldsToBeSearched: [
    { entity: "post", field: "title", relationField: "user_id", rank: "A" },
    { entity: "user", field: "name", relationField: "", rank: "A" },
  ],
});

const searchResults = async () => {
  if (!ftsl) return;
  const res = await ftsl.search("addiction");

  console.log(res);
};

searchResults();
