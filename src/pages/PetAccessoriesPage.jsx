import { lazy } from 'react';

const CategoryPage = lazy(() => import('./CategoryPage'));

export default function PetAccessoriesPage() {
  return <CategoryPage slug="pet-accessories" />;
}
