# This is a lightweight full text search library for nodejs postgres

## Usage
1. Clone it
```git
git clone https://github.com/HaileabT/full-text-search-postgres-nodejs.git /your/desired/path
```

2. Install dependencies
```npm
npm i
```

3. Create postgres connection
```typescript
const connectionObject = new PostgresConnection("postgres", "password@", 5432, "random_db", "localhost");
```

4. Create a search manager
```typescript
const searchManagerOptions: FullTextSearchManagerOptions = {
  mainEntity: "foo",
  fieldsToBeSearched: [
    { entity: "bar", field: "title", relationField: "foo_id", rank: "A" },
    { entity: "foo", field: "name", relationField: "", rank: "A" },
  ],
};

const searchManager = FullTextSearchManager.init(connectionObject.conn, searchManagerOptions);
```

#### FullTextSearchManagerOptions
```typescript
type FullTextSearchManagerOptions = {
  mainEntity: string;  // Entity to be searched
  fieldsToBeSearched?: EntityField[];  // Fields to be searched picked from all entities
};
```

#### EntityField
```typescript
interface EntityField = {
  entity: string; // Entity where the might-be-searched field exists
  field: string; // Field name
  relationField?: string; // The foreign key with which the main entity relates to this field's entity
  rank?: "A" | "B" | "C" | "D"; // Rank of this field
}

```

5. Search
```typescript
const searchResults = async () => {
  if (!searchManager) return;
  const res = await searchManager.search("addiction");

  console.log(res);
};

searchResults();
```
