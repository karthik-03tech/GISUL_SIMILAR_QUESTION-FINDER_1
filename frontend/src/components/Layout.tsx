import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout() {
  return (
    <div>
      <Sidebar />
      <div className="page-layout">
        <div className="page-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
