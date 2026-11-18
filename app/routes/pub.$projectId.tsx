/**
 * Parent layout for all /pub/:projectId/* routes.
 * This file is required by React Router to register the nested route hierarchy.
 * All child routes (._index, .products, .product.$slug, etc.) are rendered here.
 */
import { Outlet } from 'react-router';

export default function PubLayout() {
  return <Outlet />;
}
