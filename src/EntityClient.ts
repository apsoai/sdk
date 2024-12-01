import { ApsoClient, QueryParams } from "./apsoClient";

export interface EntityQueryBuilder {
    select(fields: string[]): this;
    where(filter: Record<string, any>): this;
    or(orCondition: Record<string, any>): this;
    join(joinTables: string[]): this;
    orderBy(sort: Record<string, 'ASC' | 'DESC'>): this;
    limit(limit: number): this;
    offset(offset: number): this;
    page(page: number): this;
    cache(useCache?: boolean, duration?: number): this;
  }
  
 export class QueryBuilder implements EntityQueryBuilder {
    private params: QueryParams = {};
    private useCache: boolean = false;
    private cacheDuration: number = 60; // Default cache duration in seconds
  
    public select(fields: string[]): this {
      this.params.fields = fields;
      return this;
    }
  
    public where(filter: Record<string, any>): this {
      this.params.filter = filter;
      return this;
    }
  
    public or(orCondition: Record<string, any>): this {
      this.params.or = orCondition;
      return this;
    }
  
    public join(joinTables: string[]): this {
      this.params.join = joinTables;
      return this;
    }
  
    public orderBy(sort: Record<string, 'ASC' | 'DESC'>): this {
      this.params.sort = sort;
      return this;
    }
  
    public limit(limit: number): this {
      this.params.limit = limit;
      return this;
    }
  
    public offset(offset: number): this {
      this.params.offset = offset;
      return this;
    }
  
    public page(page: number): this {
      this.params.page = page;
      return this;
    }
  
    public cache(useCache: boolean = true, duration: number = 60): this {
      this.useCache = useCache;
      this.cacheDuration = duration;
      return this;
    }
  
    public build(): { params: QueryParams; useCache: boolean; cacheDuration: number } {
      return {
        params: this.params,
        useCache: this.useCache,
        cacheDuration: this.cacheDuration,
      };
    }
  }
  
  export class EntityClient implements EntityQueryBuilder {
    private apsoClient: ApsoClient;
    private entityName: string;
    private queryBuilder: QueryBuilder;
  
    constructor(apsoClient: ApsoClient, entityName: string) {
      this.apsoClient = apsoClient;
      this.entityName = entityName;
      this.queryBuilder = new QueryBuilder();
    }
  
    public select(fields: string[]): this {
      this.queryBuilder.select(fields);
      return this;
    }
  
    public where(filter: Record<string, any>): this {
      this.queryBuilder.where(filter);
      return this;
    }
  
    public or(orCondition: Record<string, any>): this {
      this.queryBuilder.or(orCondition);
      return this;
    }
  
    public join(joinTables: string[]): this {
      this.queryBuilder.join(joinTables);
      return this;
    }
  
    public orderBy(sort: Record<string, 'ASC' | 'DESC'>): this {
      this.queryBuilder.orderBy(sort);
      return this;
    }
  
    public limit(limit: number): this {
      this.queryBuilder.limit(limit);
      return this;
    }
  
    public offset(offset: number): this {
      this.queryBuilder.offset(offset);
      return this;
    }
  
    public page(page: number): this {
      this.queryBuilder.page(page);
      return this;
    }
  
    public cache(useCache: boolean = true, duration: number = 60): this {
      this.queryBuilder.cache(useCache, duration);
      return this;
    }
  
    public async get<T>(): Promise<T> {
      const { params, useCache, cacheDuration } = this.queryBuilder.build();
      return await this.apsoClient.get<T>(`/${this.entityName}`, params, useCache, cacheDuration);
    }
  
    public async post<T>(data: any): Promise<T> {
      return await this.apsoClient.post<T>(`/${this.entityName}`, data);
    }
  
    public async put<T>(data: any): Promise<T> {
      return await this.apsoClient.put<T>(`/${this.entityName}`, data);
    }
  
    public async delete<T>(): Promise<T> {
      return await this.apsoClient.delete<T>(`/${this.entityName}`);
    }
  }