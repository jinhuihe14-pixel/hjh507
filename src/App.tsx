import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import Students from '@/pages/Students';
import StudentDetail from '@/pages/StudentDetail';
import Orders from '@/pages/Orders';
import Lessons from '@/pages/Lessons';
import Refunds from '@/pages/Refunds';
import Channels from '@/pages/Channels';
import Courses from '@/pages/Courses';
import Reports from '@/pages/Reports';
import { useDataStore } from '@/store/useDataStore';
import { useEffect } from 'react';

function App() {
  const { initData } = useDataStore();

  useEffect(() => {
    initData();
  }, [initData]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="students" element={<Students />} />
          <Route path="students/:id" element={<StudentDetail />} />
          <Route path="orders" element={<Orders />} />
          <Route path="lessons" element={<Lessons />} />
          <Route path="refunds" element={<Refunds />} />
          <Route path="channels" element={<Channels />} />
          <Route path="courses" element={<Courses />} />
          <Route path="reports" element={<Reports />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
