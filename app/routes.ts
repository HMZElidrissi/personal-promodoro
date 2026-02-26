import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
  index('routes/home.tsx'),
  route('history', 'routes/history.tsx'),
  route('distractions', 'routes/distractions.tsx'),
] satisfies RouteConfig;
