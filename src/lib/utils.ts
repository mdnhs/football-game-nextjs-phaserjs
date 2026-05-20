import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { CamelCaseKeys, SnakeCaseKeys } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

export function mapSnakeToCamel<T>(obj: T): CamelCaseKeys<T> {
  if (obj === null || obj === undefined) return obj as CamelCaseKeys<T>;

  if (Array.isArray(obj)) {
    return obj.map((item) => mapSnakeToCamel(item)) as CamelCaseKeys<T>;
  }

  if (typeof obj === 'object' && (obj as object).constructor === Object) {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      result[toCamelCase(key)] = mapSnakeToCamel(value);
    }
    return result as CamelCaseKeys<T>;
  }

  return obj as CamelCaseKeys<T>;
}

export function mapCamelToSnake<T>(obj: T): SnakeCaseKeys<T> {
  if (obj === null || obj === undefined) return obj as SnakeCaseKeys<T>;

  if (Array.isArray(obj)) {
    return obj.map((item) => mapCamelToSnake(item)) as SnakeCaseKeys<T>;
  }

  if (typeof obj === 'object' && (obj as object).constructor === Object) {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      result[toSnakeCase(key)] = mapCamelToSnake(value);
    }
    return result as SnakeCaseKeys<T>;
  }

  return obj as SnakeCaseKeys<T>;
}
