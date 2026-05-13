import { lazy } from 'react';

const CategoryPage = lazy(() => import('./CategoryPage'));

export default function CatFoodPage() {
  return <CategoryPage slug="cat-food" />;
}
