import { Client } from "pg";
import { EntityField } from "../types/EntityField";
import { FTSLError } from "../Error/FTSLError";
import { FullTextSearchManagerOptions } from "../types/FullTextSearchManagerOptions";
import { generateTSVectorsValue } from "./queries/tsVectorValues";
import { generateProcedure, registerTriggers } from "./queries/triggerFunction";

export class FullTextSearchManager {
  private static ftsl: Map<string, FullTextSearchManager> = new Map<string, FullTextSearchManager>();
  public mainEntity!: string;
  public fieldName!: string;
  public entitiesAndFields?: EntityField[];
  private static client: Client;

  private constructor(options: FullTextSearchManagerOptions, fieldName: string = "weighted_document") {
    this.fieldName = fieldName;
    FullTextSearchManager.client.connect();

    this.mainEntity = options.mainEntity;

    if (options.fieldsToBeSearched) {
      this.entitiesAndFields = options.fieldsToBeSearched;
      Promise.resolve(
        this.checkEntitesAndFields()
          .then(() => {
            this.createTsVector();
          })
          .then(() => {
            this.createTriggers();
          })
      );
    }
  }

  public static init(
    client: Client,
    options: FullTextSearchManagerOptions,
    force: boolean = false
  ): FullTextSearchManager | undefined {
    if (!FullTextSearchManager.client) FullTextSearchManager.client = client;

    if (FullTextSearchManager.ftsl.get(options.mainEntity) && !force)
      return FullTextSearchManager.ftsl.get(options.mainEntity);

    FullTextSearchManager.ftsl.set(options.mainEntity, new FullTextSearchManager(options));
    return FullTextSearchManager.ftsl.get(options.mainEntity);
  }

  public static get(mainEntity: string): FullTextSearchManager | undefined {
    if (!FullTextSearchManager.ftsl?.get(mainEntity)) {
      throw new FTSLError("Full text search manager not initiated.");
    }

    return FullTextSearchManager.ftsl.get(mainEntity);
  }

  private async checkEntitesAndFields() {
    const client = FullTextSearchManager.client;
    if (!this.entitiesAndFields) return;

    const actualEntitiesFields: EntityField[] = [];

    try {
      for (let entityField of this.entitiesAndFields) {
        if (entityField.entity.split(/[,;\. ]+/).length > 1 || entityField.field.split(/[,;\. ]+/).length > 1) {
          throw new FTSLError(
            "Invalid entity or field names for entity " + entityField.entity + " or field " + entityField.field + "."
          );
        }

        await client.query(`SELECT ${entityField.field} FROM public.${entityField.entity};`);

        if (entityField.entity !== this.mainEntity) {
          if (!entityField.relationField) {
            throw new FTSLError("No foriegn key field given for entity " + entityField.entity);
          }

          const relationQuery = `
          SELECT EXISTS ( SELECT * FROM public.${entityField.entity}) AS related;
          `;

          const relationResult = await client.query(relationQuery);

          if (relationResult.rows[0].related) {
            actualEntitiesFields.push(entityField);
          }
        } else {
          actualEntitiesFields.push(entityField);
        }

        this.entitiesAndFields = actualEntitiesFields;

        const result = await client.query(`SELECT * FROM public.${this.mainEntity};`);
        const resultFields: string[] = result.fields.map((field) => field.name);
        if (!resultFields.includes(this.fieldName)) {
          await client.query(`ALTER TABLE public.${this.mainEntity} ADD COLUMN ${this.fieldName} tsvector;`);
        }
      }
    } catch (err: any) {
      const error = new FTSLError(err.message);
      error.stack = err.stack ? err.stack : {};
      throw error;
    }
  }

  private async createTsVector() {
    const client = FullTextSearchManager.client;
    try {
      if (!this.entitiesAndFields) return;
      let fieldValue = generateTSVectorsValue(this.entitiesAndFields, this.mainEntity, false);

      if (fieldValue.trim() === "") return;

      const query = `
         UPDATE public.${this.mainEntity} SET ${this.fieldName}=${fieldValue ? fieldValue : " "} FROM ${this.entitiesAndFields
           .map((entity) => {
             if (entity.entity !== this.mainEntity) {
               return entity.entity;
             }
           })
           .join(" ")
           .trim()
           .split(" ")
           .join(",")};
         `;

      await client.query(query);
    } catch (err: any) {
      const error = new FTSLError(err.message);
      error.stack = err.stack ? err.stack : {};
      throw error;
    }
  }

  private async createTriggers() {
    const client = FullTextSearchManager.client;

    const entities: string[] = [];

    if (!this.entitiesAndFields) return;
    this.entitiesAndFields.forEach((entry) => {
      if (entities.includes(entry.entity)) return;
      entities.push(entry.entity);
    });

    const mainFunctionName = this.mainEntity + "_" + this.fieldName;
    const otherTablesFunctionName = "update_" + this.mainEntity + "_" + this.fieldName;

    const mainQuery = generateProcedure(
      this.mainEntity,
      this.fieldName,
      this.mainEntity,
      this.entitiesAndFields,
      mainFunctionName
    );
    const otherQuery = generateProcedure(
      this.mainEntity,
      this.fieldName,
      this.entitiesAndFields.filter((entry) => entry.entity !== this.mainEntity)[0].entity,
      this.entitiesAndFields,
      otherTablesFunctionName
    );

    console.log(this.entitiesAndFields);

    try {
      await client.query(mainQuery);
      await client.query(otherQuery);

      for (let entry of this.entitiesAndFields) {
        if (entry.entity === this.mainEntity) {
          await client.query(registerTriggers(this.mainEntity, this.fieldName, mainFunctionName));
        } else {
          await client.query(registerTriggers(entry.entity, this.fieldName, otherTablesFunctionName));
        }
      }
    } catch (err: any) {
      console.log(err);
    }
  }

  async search<T>(keyword: string) {
    const client = FullTextSearchManager.client;
    const query = `SELECT * FROM public.${this.mainEntity} WHERE ${this.fieldName} @@ to_tsquery('simple', COALESCE('${keyword}', ' '));`;

    return (await client.query<any, T>(query)).rows;
  }
}
