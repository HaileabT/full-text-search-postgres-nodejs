import { EntityField } from "../../types/EntityField";
import { generateTSVectorsValue } from "./tsVectorValues";

export function generateProcedure(
  mainEntity: string,
  fieldName: string,
  entity: string,
  entitiesAndFields: EntityField[],
  funcName: string
): string {
  if (!entitiesAndFields) return "";
  if (!generateTSVectorsValue(entitiesAndFields, mainEntity, false)) return "";
  let fieldValue = generateTSVectorsValue(entitiesAndFields, mainEntity, entity === mainEntity);

  const query = `
CREATE OR REPLACE FUNCTION ${funcName}()
RETURNS TRIGGER AS $$

BEGIN
  ${mainEntity !== entity ? `UPDATE public.${mainEntity} SET ${fieldName} = ` : `NEW.${fieldName} := `}${fieldValue} FROM ${entitiesAndFields
    .map((entity) => {
      if (entity.entity !== mainEntity) {
        return entity.entity;
      }
    })
    .join(" ")
    .trim()
    .split(" ")
    .join(",")};
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
    `;
  return query;
}

export function registerTriggers(entity: string, field: string, functionName: string) {
  const query = `
  DO $$
BEGIN
    IF NOT EXISTS (
        SELECT trigger_name
        FROM information_schema.triggers
        WHERE trigger_name = 'update_${field}_trigger_on_${entity}'
    ) THEN
    CREATE TRIGGER update_${field}_trigger_on_${entity}
    AFTER INSERT OR UPDATE ON public.${entity}
    FOR EACH ROW
    EXECUTE PROCEDURE ${functionName}();    
    END IF;
END;
$$;
    `;

  return query;
}
