import { apiGet } from './client';

export function getRecipes() {
  return apiGet('/recipes');
}
