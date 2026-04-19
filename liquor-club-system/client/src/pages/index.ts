import { lazy, Suspense } from 'react';

const Login = lazy(() => import('./Login'));
const Dashboard = lazy(() => import('./Dashboard'));
const POS = lazy(() => import('./POS'));
const Inventory = lazy(() => import('./Inventory'));
const Customers = lazy(() => import('./Customers'));
const Reports = lazy(() => import('./Reports'));
const Settings = lazy(() => import('./Settings'));

export {
  Login,
  Dashboard,
  POS,
  Inventory,
  Customers,
  Reports,
  Settings,
};
