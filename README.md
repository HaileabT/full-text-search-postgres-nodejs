# This is a lightweight full text search library for nodejs postgres

## Usage
1. Create postgres connection
```typescript
const conn = new PostgresConnection("postgres", "password@", 5432, "random_db", "localhost");
```

2. Create a search manager
```typescript
const searchManager = FullTextSearchManager.init(conn.conn, {
  mainEntity: "user",
  fieldsToBeSearched: [
    { entity: "post", field: "title", relationField: "user_id", rank: "A" },
    { entity: "user", field: "name", relationField: "", rank: "A" },
  ],
});
```

3. Search
```typescript
const searchResults = async () => {
  if (!searchManager) return;
  const res = await searchManager.search("addiction");

  console.log(res);
};

searchResults();
```
