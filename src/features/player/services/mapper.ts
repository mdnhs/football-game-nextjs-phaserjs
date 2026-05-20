import { mapSnakeToCamel } from '@/lib/utils';
import type { CurrentPlayer, CurrentPlayerApiResponse, PlaysRemaining, PlaysRemainingApiResponse } from '../types';

export const mapCurrentPlayer = (data: CurrentPlayerApiResponse): CurrentPlayer => mapSnakeToCamel(data);

export const mapPlaysRemaining = (data: PlaysRemainingApiResponse): PlaysRemaining => mapSnakeToCamel(data);
