export interface EntityField {
  entity: string;
  field: string;
  relationField?: string;
  rank?: "A" | "B" | "C" | "D";
}
