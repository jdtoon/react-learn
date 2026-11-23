import { lazy, type ComponentType } from 'react';
import { createBrowserRouter, type RouteObject } from 'react-router';
import { ErrorPage } from '../pages/ErrorPage';
import { Layout } from './Layout';

function lazyPage<K extends string>(load: () => Promise<Record<K, ComponentType>>, name: K) {
  return lazy(async () => ({ default: (await load())[name] }));
}

const HomePage = lazyPage(() => import('../pages/HomePage'), 'HomePage');
const ModuleRoute = lazyPage(() => import('../pages/ModuleRoute'), 'ModuleRoute');
const NotFoundPage = lazyPage(() => import('../pages/NotFoundPage'), 'NotFoundPage');
const MeetingPage = lazyPage(() => import('../pages/MeetingPage'), 'MeetingPage');
const GlossaryPage = lazyPage(() => import('../pages/GlossaryPage'), 'GlossaryPage');
const KitPage = lazyPage(() => import('../pages/StubPage'), 'KitPage');

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        errorElement: <ErrorPage />,
        children: [
          { index: true, element: <HomePage /> },
          { path: 'modules/:slug', element: <ModuleRoute /> },
          { path: 'meeting', element: <MeetingPage /> },
          { path: 'glossary', element: <GlossaryPage /> },
          { path: 'kit', element: <KitPage /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
];

export function createAppRouter() {
  return createBrowserRouter(routes, { basename: import.meta.env.BASE_URL });
}
