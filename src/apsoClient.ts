import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { QueryParams, EntityQueryBuilder, CacheEntry, ApsoClientConfig } from './types';
import { RequestQueryBuilder, CondOperator } from '@dataui/crud-request';

class QueryBuilder implements EntityQueryBuilder {
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

class EntityClient implements EntityQueryBuilder {
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

class ApsoClient {
  private baseURL: string;
  private apiKey: string;
  private client: 'axios' | 'fetch';
  private axiosInstance?: AxiosInstance;
  private cache: Map<string, CacheEntry<any>> = new Map();
  private debug: boolean;

  constructor(config: ApsoClientConfig) {
    this.baseURL = config.baseURL;
    this.apiKey = config.apiKey;
    this.client = config.client || 'fetch';
    this.debug = !!config.debug;
  }

  private async getAxiosInstance(): Promise<AxiosInstance> {
    if (!this.axiosInstance) {
      this.axiosInstance = axios.create({
        baseURL: this.baseURL,
        headers: {
          'x-api-key': `${this.apiKey}`,
        },
      });
    }
    return this.axiosInstance;
  }

  private getHeaders(): Record<string, string> {
    return {
      'x-api-key': `${this.apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  private async request<T>(method: string, url: string, data?: any, params?: Record<string, any>): Promise<T> {
    if (this.client === 'fetch') {
      const queryString = params ? '?' + new URLSearchParams(params as any).toString() : '';
      if (this.debug) {
        console.log(`[ApsoClient][DEBUG] ${method.toUpperCase()} ${this.baseURL}${url}${queryString}`);
      }
      const response = await fetch(`${this.baseURL}${url}${queryString}`, {
        method,
        headers: this.getHeaders(),
        body: data ? JSON.stringify(data) : undefined,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } else if (this.client === 'axios') {
      const axiosClient = await this.getAxiosInstance();
      const config = { params, headers: this.getHeaders() };
      if (this.debug) {
        const paramString = params ? '?' + new URLSearchParams(params as any).toString() : '';
        console.log(`[ApsoClient][DEBUG] ${method.toUpperCase()} ${this.baseURL}${url}${paramString}`);
      }
      if (method === 'get') {
        const response = await axiosClient.get<T>(url, config);
        return response.data;
      } else if (method === 'post') {
        const response = await axiosClient.post<T>(url, data, config);
        return response.data;
      } else if (method === 'put') {
        const response = await axiosClient.put<T>(url, data, config);
        return response.data;
      } else if (method === 'delete') {
        const response = await axiosClient.delete<T>(url, config);
        return response.data;
      }
    }

    throw new Error("Unsupported HTTP client");
  }

  public entity(entityName: string): EntityClient {
    return new EntityClient(this, entityName);
  }

  public async get<T>(resource: string, params?: QueryParams, useCache: boolean = false, cacheDuration: number = 60): Promise<T> {
    const queryString = this.buildQueryParams(params);
    const cacheKey = `${resource}${queryString}`;

    if (useCache) {
      const cached = this.cache.get(cacheKey);
      if (cached && cached.expiry > Date.now()) {
        return cached.data;
      }
    }

    const data = await this.request<T>('get', `${resource}${queryString}`);
    if (useCache) {
        this.cache.set(cacheKey, { data, expiry: Date.now() + cacheDuration * 1000 });
      }
      return data;
  }

  public async post<T>(resource: string, data: any): Promise<T> {
    return await this.request<T>('post', resource, data);
  }
  public async put<T>(resource: string, data: any): Promise<T> {
    return await this.request<T>('put', resource, data);
  }

  public async delete<T>(resource: string): Promise<T> {
    return await this.request<T>('delete', resource);
  }

  private buildQueryParams(params?: QueryParams): string {
    if (!params) return '';

    const qb = RequestQueryBuilder.create();

    // Select/fields
    if (params.fields) {
      qb.select(params.fields);
    }

    // Filter
    if (params.filter) {
      Object.entries(params.filter).forEach(([field, value]) => {
        if (typeof value === 'object' && value !== null) {
          // Support operators: { field: { $eq: value } }
          Object.entries(value).forEach(([op, v]) => {
            qb.setFilter({ field, operator: op as CondOperator, value: v });
          });
        } else {
          qb.setFilter({ field, operator: '$eq', value });
        }
      });
    }

    // OR
    if (params.or) {
      Object.entries(params.or).forEach(([field, value]) => {
        if (typeof value === 'object' && value !== null) {
          Object.entries(value).forEach(([op, v]) => {
            qb.setOr({ field, operator: op as CondOperator, value: v });
          });
        } else {
          qb.setOr({ field, operator: '$eq', value });
        }
      });
    }

    // Join
    if (params.join) {
      params.join.forEach((joinField) => {
        qb.setJoin({ field: joinField });
      });
    }

    // Sort
    if (params.sort) {
      Object.entries(params.sort).forEach(([field, order]) => {
        qb.sortBy({ field, order: order as 'ASC' | 'DESC' });
      });
    }

    // Limit, Offset, Page
    if (params.limit !== undefined) qb.setLimit(params.limit);
    if (params.offset !== undefined) qb.setOffset(params.offset);
    if (params.page !== undefined) qb.setPage(params.page);

    // Cache (resetCache)
    if (params.cache !== undefined) {
      if (params.cache) qb.resetCache();
    }

    const query = qb.query();
    return query ? `?${query}` : '';
  }
}

class ApsoClientFactory {
  private static clients: Map<string, ApsoClient> = new Map();

  public static getClient(config: ApsoClientConfig): ApsoClient {
    const clientKey = `${config.baseURL}-${config.apiKey}`;
    if (!ApsoClientFactory.clients.has(clientKey)) {
      ApsoClientFactory.clients.set(clientKey, new ApsoClient(config));
    }
    return ApsoClientFactory.clients.get(clientKey)!;
  }
}

export { ApsoClient, ApsoClientFactory, QueryBuilder, QueryParams, EntityQueryBuilder };
