import { EntityField } from "../../types/EntityField";
export function generateTSVectorsValue(
  entitiesAndFields: EntityField[],
  mainEntity: string,
  forNewTrigger: boolean = false
): string {
  let fieldValue = "";
  for (let entry of entitiesAndFields) {
    fieldValue += `to_tsvector('simple', COALESCE(${forNewTrigger && entry.entity === mainEntity ? "NEW." : entry.entity === mainEntity ? "" : `public.${entry.entity}.`}${entry.field}, '')) || `;
  }

  if (fieldValue.trim() !== "") {
    fieldValue = fieldValue.substring(0, fieldValue.length - 4);
  }
  return fieldValue;
}
