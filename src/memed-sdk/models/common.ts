export type QueryValue = string | number | boolean | null | undefined;
export type QueryString = Record<string, QueryValue>;

export interface RequestOptions {
  signal?: AbortSignal;
  headers?: Record<string, string>;
}

export interface Response<T> {
  data: T;
}

export interface Paginated<T> extends Response<T[]> {
  current_page: number;
  per_page: number;
  total_items: number;
}
