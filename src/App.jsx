import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Page Imports
import Main from './Pages/Main';
import Login from './Pages/Login';
import Register from './Pages/Register';
import Pickup from './Pages/Pickup';
import Otp from './Pages/Otp';
import ReportPollution from './Pages/ReportPollution';
import ReportLeftoverFood from './Pages/ReportFood';
import ForgotPassword from './Pages/ForgotPassword';
import ResetPassword from './ResetPassword';
import Dashboard from './Pages/Dashboard';
import AdminDashboard from './Pages/AdminDashboard';
import VolunteerPortal from './Pages/VolunteerPortal';
import UserManagement from './Pages/UserManagement'; // 🔥 1. Add this import

// Component Imports
import ProtectedRoute from './Components/ProtectedRoute';
import PaymentSuccess from './Pages/PaymentSuccess';
import PaymentFailure from './Pages/PaymentFailure';

import ReportDetails from './Pages/ReportDetails';
import RevenueAnalysisPage from './Components/Admin/RevenueAnalysis';
import WasteAnalysisPage from './Pages/WasteAnalysisPage';
import FoodAnalysisPage from './Pages/FoodAnalysisPage';
import VolunteerHistory from './Pages/VolunteerHistory';
import DeletionLogs from './Pages/DeletionLogs';

import UserReports from './Pages/UserReports';

function App() {
  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#1E293B",
            color: "#F8FAFC",
            borderRadius: "12px",
          },
          success: { style: { background: "#16A34A" } },
          error: { style: { background: "#DC2626" } },
        }}
      />

      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path='/' element={<Main />} />
          <Route path='/login' element={<Login />} />
          <Route path='/register' element={<Register />} />
          <Route path='/otp' element={<Otp />} />
          <Route path='/forgot-password' element={<ForgotPassword />} />
          <Route path='/reset-password' element={<ResetPassword />} />


          {/* Regular User Routes */}
          <Route path='/pick-up' element={<ProtectedRoute allowedRoles={['user']}><Pickup /></ProtectedRoute>} />
          <Route path='/report-pollution' element={<ProtectedRoute allowedRoles={['user']}><ReportPollution /></ProtectedRoute>} />
          <Route path='/report-food' element={<ProtectedRoute allowedRoles={['user']}><ReportLeftoverFood /></ProtectedRoute>} />
          <Route path='/dashboard' element={<ProtectedRoute allowedRoles={['user']}><Dashboard /></ProtectedRoute>} />
          <Route path='/my-reports' element={<ProtectedRoute allowedRoles={['user']}><UserReports /></ProtectedRoute>} />
          <Route
            path="/payment-success"
            element={
              <ProtectedRoute allowedRoles={['user', 'admin', 'volunteer']}>
                <PaymentSuccess />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payment-failure"
            element={
              <ProtectedRoute allowedRoles={['user', 'admin', 'volunteer']}>
                <PaymentFailure />
              </ProtectedRoute>
            }
          />


          {/* Staff Routes */}
          <Route path="/admin-dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
          <Route
            path="/admin/report/:type/:id"
            element={<ProtectedRoute allowedRoles={['admin']}><ReportDetails /></ProtectedRoute>}
          />
          <Route
            path="/admin/revenue-analysis"
            element={<ProtectedRoute allowedRoles={['admin']}><RevenueAnalysisPage /></ProtectedRoute>}
          />
          <Route
            path="/admin/waste-analysis"
            element={<ProtectedRoute allowedRoles={['admin']}><WasteAnalysisPage /></ProtectedRoute>}
          />
          <Route
            path="/admin/food-analysis"
            element={<ProtectedRoute allowedRoles={['admin']}><FoodAnalysisPage /></ProtectedRoute>}
          />



          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <UserManagement />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/deletion-logs"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DeletionLogs />
              </ProtectedRoute>
            }
          />

          <Route path="/volunteer-portal" element={<ProtectedRoute allowedRoles={['volunteer']}><VolunteerPortal /></ProtectedRoute>} />
          <Route path="/volunteer-history" element={<ProtectedRoute allowedRoles={['volunteer']}><VolunteerHistory /></ProtectedRoute>} />

          {/* Fallback Route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;