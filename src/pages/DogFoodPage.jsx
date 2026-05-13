import { lazy } from 'react';

// Lazy load the shared category page to keep bundle lean
const CategoryPage = lazy(() => import('./CategoryPage'));

export default function DogFoodPage() {
  return <CategoryPage slug="dog-food" />;
}
