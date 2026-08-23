import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAdminStore from './store/useAdminStore';

import LoginPage       from './pages/LoginPage';
import Layout          from './components/Layout';
import DashboardPage   from './pages/DashboardPage';
import OrdersPage      from './pages/OrdersPage';
import DriversPage     from './pages/DriversPage';
import CustomersPage   from './pages/CustomersPage';
import PricingPage     from './pages/PricingPage';
import PromoPage       from './pages/PromoPage';
import AnalyticsPage   from './pages/AnalyticsPage';
import NotificationsPage from './pages/NotificationsPage';
import SettingsPage    from './pages/SettingsPage';

const PrivateRoute = ({ children }) => {
  const isLoggedIn = useAdminStore(s => s.isLoggedIn);
  return isLoggedIn ? children : <Navigate to="/login" />;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index              element={<DashboardPage />}    />
          <Route path="orders"      element={<OrdersPage />}       />
          <Route path="drivers"     element={<DriversPage />}      />
          <Route path="customers"   element={<CustomersPage />}    />
          <Route path="pricing"     element={<PricingPage />}      />
          <Route path="promos"      element={<PromoPage />}        />
          <Route path="analytics"   element={<AnalyticsPage />}    />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="settings"    element={<SettingsPage />}     />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
