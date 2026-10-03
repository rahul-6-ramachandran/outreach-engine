import { RouterProvider } from 'react-router-dom';
import { createAppRouter } from './router';

export function App() {
  const router = createAppRouter();

  return <RouterProvider router={router} />;
}