import React from 'react'
import Sidebar from './Sidebar'
import MonthlyCalendar from '../workcalendars/MonthlyCalendar'

function WorkTimePage() {
	return (
		<>
			<Sidebar />
			<div className="content p-3">
				<div className="calendar-section">
					<MonthlyCalendar />
				</div>
			</div>
		</>
	)
}

export default WorkTimePage
