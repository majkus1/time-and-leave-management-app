import React, { useState } from 'react';
import Sidebar from './Sidebar';
import MonthlyCalendar from '../workcalendars/MonthlyCalendar';

function Dashboard() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <>
      <Sidebar />
      <div className="content p-3">
        <div className="calendar-section">
          <MonthlyCalendar />
        </div>
      </div>
    </>
  );
}

export default Dashboard;
