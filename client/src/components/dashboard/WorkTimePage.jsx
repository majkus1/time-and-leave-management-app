import React from 'react'
import Sidebar from './Sidebar'
import MonthlyCalendar from '../workcalendars/MonthlyCalendar'
import OnboardingChecklist from '../onboarding/OnboardingChecklist'

function WorkTimePage() {
	return (
		<>
			<Sidebar />
			<div className="content p-3">
				<OnboardingChecklist />
				<div className="calendar-section">
					<MonthlyCalendar />
				</div>
			</div>
		</>
	)
}

export default WorkTimePage
