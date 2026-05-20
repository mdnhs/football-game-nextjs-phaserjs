export interface PaginationType {
  totalData: number;
  totalPages: number;
  currentPage: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ServiceResponse<T> {
  error: boolean;
  message: string;
  data: T | null;
  pagination?: PaginationType;
  status?: number;
}

// Case conversion type utilities

export type SnakeToCamelCase<S extends string> = S extends `${infer Head}_${infer Tail}`
  ? `${Head}${Capitalize<SnakeToCamelCase<Tail>>}`
  : S;

export type CamelCaseKeys<T> =
  T extends Array<infer U>
    ? Array<CamelCaseKeys<U>>
    : T extends object
      ? {
          [K in keyof T as SnakeToCamelCase<string & K>]: CamelCaseKeys<T[K]>;
        }
      : T;

export type CamelToSnakeCase<S extends string> = S extends `${infer Head}${infer Tail}`
  ? Head extends Uppercase<Head>
    ? Head extends Lowercase<Head>
      ? `${Head}${CamelToSnakeCase<Tail>}`
      : `_${Lowercase<Head>}${CamelToSnakeCase<Tail>}`
    : `${Head}${CamelToSnakeCase<Tail>}`
  : S;

export type SnakeCaseKeys<T> =
  T extends Array<infer U>
    ? Array<SnakeCaseKeys<U>>
    : T extends object
      ? {
          [K in keyof T as CamelToSnakeCase<string & K>]: SnakeCaseKeys<T[K]>;
        }
      : T;
