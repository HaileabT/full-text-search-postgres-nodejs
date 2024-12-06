import { EntityField } from "./EntityField";

export type FullTextSearchManagerOptions = {
  mainEntity: string;
  fieldsToBeSearched?: EntityField[];
};
