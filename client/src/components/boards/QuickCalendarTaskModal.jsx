import React, { useEffect, useState } from 'react'
import Modal from 'react-modal'
import { useTranslation } from 'react-i18next'
import { useBoardUsers, useCreateTask } from '../../hooks/useBoards'
import { useAlert } from '../../context/AlertContext'
import { useAuth } from '../../context/AuthContext'
import { buildSchedulePayload } from '../../utils/taskScheduleTime'
import TaskScheduleTimeInput from './TaskScheduleTimeInput'

const SCHEDULE_DEADLINE = 'deadline'
const SCHEDULE_PERIOD = 'period'
const SCHEDULE_NONE = 'none'

const TASK_STATUSES = [
	{ id: 'todo' },
	{ id: 'in-progress' },
	{ id: 'review' },
	{ id: 'done' },
]

/**
 * Szybkie zadanie (calendarOnly) — widoczne w kalendarzu i na tablicy Kanban.
 * @param {{
 *   boardId: string | null,
 *   boardsForPicker?: Array<{ _id: string, name?: string }> | null,
 *   onClose: () => void,
 *   onSuccess: () => void,
 * }} props
 */
function QuickCalendarTaskModal({ boardId: fixedBoardId, boardsForPicker, onClose, onSuccess }) {
	const { t } = useTranslation()
	const { showAlert } = useAlert()
	const { userId } = useAuth()
	const createTaskMutation = useCreateTask()

	const [pickedBoardId, setPickedBoardId] = useState(fixedBoardId || '')
	const [title, setTitle] = useState('')
	const [status, setStatus] = useState('todo')
	const [scheduleMode, setScheduleMode] = useState(SCHEDULE_NONE)
	const [dueDate, setDueDate] = useState('')
	const [dueTime, setDueTime] = useState('')
	const [periodStart, setPeriodStart] = useState('')
	const [periodEnd, setPeriodEnd] = useState('')
	const [periodStartTime, setPeriodStartTime] = useState('')
	const [periodEndTime, setPeriodEndTime] = useState('')
	const [assignToAllMembers, setAssignToAllMembers] = useState(false)
	const [selectedAssignees, setSelectedAssignees] = useState([])

	const effectiveBoardId = fixedBoardId || pickedBoardId
	const { data: boardUsers = [] } = useBoardUsers(effectiveBoardId, !!effectiveBoardId)

	useEffect(() => {
		if (fixedBoardId) setPickedBoardId(fixedBoardId)
	}, [fixedBoardId])

	useEffect(() => {
		if (!boardsForPicker?.length || fixedBoardId) return
		if (!pickedBoardId && boardsForPicker[0]?._id) {
			setPickedBoardId(String(boardsForPicker[0]._id))
		}
	}, [boardsForPicker, fixedBoardId, pickedBoardId])

	useEffect(() => {
		if (!userId || assignToAllMembers || selectedAssignees.length > 0) return
		const currentUserInBoard = boardUsers.find((user) => String(user._id) === String(userId))
		if (currentUserInBoard) {
			setSelectedAssignees([String(userId)])
		}
	}, [userId, boardUsers, assignToAllMembers, selectedAssignees.length])

	const handleSubmit = async (e) => {
		e.preventDefault()
		if (!effectiveBoardId) {
			await showAlert(t('boards.pickBoardForQuickTask') || 'Wybierz tablicę')
			return
		}
		if (!title.trim()) {
			await showAlert(t('boards.taskTitleRequired') || 'Tytuł jest wymagany')
			return
		}
		if (!assignToAllMembers && selectedAssignees.length === 0) {
			await showAlert(t('boards.assigneeRequired') || 'Wybierz osobę')
			return
		}

		const payload = {
			title: title.trim(),
			description: '',
			status,
			priority: 'medium',
			assignToAllMembers,
			assignedTo: assignToAllMembers ? [] : selectedAssignees,
			calendarOnly: true,
			...buildSchedulePayload(scheduleMode, {
				dueDate,
				dueTime,
				periodStart,
				periodEnd,
				periodStartTime,
				periodEndTime,
			}),
		}

		if (scheduleMode === SCHEDULE_DEADLINE && !dueDate) {
			await showAlert(t('boards.deadlineRequired') || 'Podaj termin (deadline)')
			return
		}
		if (scheduleMode === SCHEDULE_PERIOD && (!periodStart || !periodEnd)) {
			await showAlert(t('boards.periodRequired') || 'Podaj daty okresu')
			return
		}

		try {
			await createTaskMutation.mutateAsync({
				boardId: effectiveBoardId,
				data: payload,
			})
			await showAlert(t('boards.taskCreateSuccess') || 'Utworzono')
			onSuccess()
		} catch (error) {
			await showAlert(error.response?.data?.message || t('boards.taskCreateError') || 'Błąd')
		}
	}

	return (
		<Modal
			isOpen
			onRequestClose={onClose}
			overlayClassName="board-modal-overlay"
			className="board-modal board-quick-task-modal"
			style={{
				overlay: {
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					padding: '20px 0',
					backgroundColor: 'rgba(0, 0, 0, 0.5)',
					backdropFilter: 'blur(2px)',
				},
				content: {
					position: 'relative',
					inset: 'unset',
					margin: '0 auto',
					maxWidth: '520px',
					width: '90%',
					maxHeight: 'calc(100vh - 40px)',
					overflowY: 'auto',
					borderRadius: '12px',
					padding: '20px',
					backgroundColor: 'white',
				},
			}}
			contentLabel={t('boards.quickCalendarTask') || 'Szybkie zadanie'}
		>
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
				<h2 style={{ margin: 0, color: '#2c3e50', fontSize: '20px', fontWeight: 600 }}>
					{t('boards.quickCalendarTask') || 'Szybkie zadanie (kalendarz)'}
				</h2>
				<button
					type="button"
					onClick={onClose}
					style={{
						background: 'transparent',
						border: 'none',
						fontSize: '26px',
						cursor: 'pointer',
						color: '#7f8c8d',
						lineHeight: 1,
					}}
				>
					×
				</button>
			</div>
			<p style={{ color: '#7f8c8d', fontSize: '14px', marginTop: 0 }}>
				{t('boards.quickCalendarTaskHelp') || 'Widoczne tylko w kalendarzu, nie na tablicy Kanban.'}
			</p>
			<form onSubmit={handleSubmit}>
				{!fixedBoardId && Array.isArray(boardsForPicker) && boardsForPicker.length > 0 && (
					<div style={{ marginBottom: '16px' }}>
						<label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: '#2c3e50' }}>
							{t('boards.board') || 'Tablica'}
						</label>
						<select
							value={pickedBoardId}
							onChange={(e) => setPickedBoardId(e.target.value)}
							style={{
								width: '100%',
								padding: '10px',
								border: '1px solid #bdc3c7',
								borderRadius: '6px',
								fontSize: '16px',
							}}
						>
							{boardsForPicker.map((b) => (
								<option key={b._id} value={b._id}>
									{b.name || b._id}
								</option>
							))}
						</select>
					</div>
				)}

				<div style={{ marginBottom: '16px' }}>
					<label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: '#2c3e50' }}>
						{t('boards.status') || 'Status'}
					</label>
					<select
						value={status}
						onChange={(e) => setStatus(e.target.value)}
						style={{
							width: '100%',
							padding: '10px',
							border: '1px solid #bdc3c7',
							borderRadius: '6px',
							fontSize: '16px',
						}}
					>
						{TASK_STATUSES.map((s) => (
							<option key={s.id} value={s.id}>
								{t(`boards.status.${s.id}`)}
							</option>
						))}
					</select>
				</div>

				<div style={{ marginBottom: '16px' }}>
					<label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: '#2c3e50' }}>
						{t('boards.quickTaskSubject') || 'Temat / opis'} *
					</label>
					<input
						type="text"
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						style={{
							width: '100%',
							padding: '12px',
							border: '1px solid #bdc3c7',
							borderRadius: '6px',
							fontSize: '16px',
						}}
						required
					/>
				</div>

				<div style={{ marginBottom: '16px' }}>
					<label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#2c3e50' }}>
						{t('boards.scheduleType') || 'Termin / okres'}
					</label>
					<label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', cursor: 'pointer' }}>
						<input
							type="radio"
							name="sched"
							checked={scheduleMode === SCHEDULE_NONE}
							onChange={() => setScheduleMode(SCHEDULE_NONE)}
						/>
						<span>{t('boards.noSchedule') || 'Brak'}</span>
					</label>
					<label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', cursor: 'pointer' }}>
						<input
							type="radio"
							name="sched"
							checked={scheduleMode === SCHEDULE_DEADLINE}
							onChange={() => setScheduleMode(SCHEDULE_DEADLINE)}
						/>
						<span>{t('boards.deadline') || 'Deadline (jeden dzień)'}</span>
					</label>
					<label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
						<input
							type="radio"
							name="sched"
							checked={scheduleMode === SCHEDULE_PERIOD}
							onChange={() => setScheduleMode(SCHEDULE_PERIOD)}
						/>
						<span>{t('boards.workPeriod') || 'Okres realizacji'}</span>
					</label>
				</div>

				{scheduleMode === SCHEDULE_DEADLINE && (
					<div style={{ marginBottom: '16px' }}>
						<label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>{t('boards.deadline') || 'Deadline'}</label>
						<input
							type="date"
							value={dueDate}
							onChange={(e) => setDueDate(e.target.value)}
							style={{
								display: 'block',
								width: '100%',
								maxWidth: '250px',
								boxSizing: 'border-box',
								padding: '10px',
								border: '1px solid #bdc3c7',
								borderRadius: '6px',
							}}
						/>
						<TaskScheduleTimeInput
							id="quick-task-due-time"
							value={dueTime}
							onChange={setDueTime}
							t={t}
						/>
					</div>
				)}

				{scheduleMode === SCHEDULE_PERIOD && (
					<div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
						<div>
							<label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>{t('boards.periodFrom') || 'Od'}</label>
							<input
								type="date"
								value={periodStart}
								onChange={(e) => setPeriodStart(e.target.value)}
								style={{
									display: 'block',
									width: '100%',
									maxWidth: '250px',
									boxSizing: 'border-box',
									padding: '10px',
									border: '1px solid #bdc3c7',
									borderRadius: '6px',
								}}
							/>
							<TaskScheduleTimeInput
								id="quick-task-period-start-time"
								value={periodStartTime}
								onChange={setPeriodStartTime}
								label={t('boards.scheduleTimeFrom') || 'Godzina rozpoczęcia (opcjonalnie)'}
								t={t}
							/>
						</div>
						<div>
							<label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>{t('boards.periodTo') || 'Do'}</label>
							<input
								type="date"
								value={periodEnd}
								onChange={(e) => setPeriodEnd(e.target.value)}
								style={{
									display: 'block',
									width: '100%',
									maxWidth: '250px',
									boxSizing: 'border-box',
									padding: '10px',
									border: '1px solid #bdc3c7',
									borderRadius: '6px',
								}}
							/>
							<TaskScheduleTimeInput
								id="quick-task-period-end-time"
								value={periodEndTime}
								onChange={setPeriodEndTime}
								label={t('boards.scheduleTimeTo') || 'Godzina zakończenia (opcjonalnie)'}
								t={t}
							/>
						</div>
					</div>
				)}

				<div style={{ marginBottom: '16px' }}>
					<label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>{t('boards.assignTo') || 'Przypisz'}</label>
					<label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', cursor: 'pointer' }}>
						<input
							type="checkbox"
							checked={assignToAllMembers}
							onChange={(e) => {
								setAssignToAllMembers(e.target.checked)
								if (e.target.checked) setSelectedAssignees([])
							}}
						/>
						<span>{t('boards.assignToAllMembers') || 'Wszyscy członkowie'}</span>
					</label>
					{!assignToAllMembers && (
						<div
							className="board-modal__members-list"
							style={{
								border: '1px solid #e1e8ed',
								borderRadius: '6px',
								maxHeight: '140px',
								overflowY: 'auto',
								padding: '10px',
								backgroundColor: '#fafbfd',
							}}
						>
							{boardUsers.length === 0 ? (
								<p style={{ margin: 0, color: '#7f8c8d' }}>{t('boards.noMembersToAssign') || 'Brak członków'}</p>
							) : (
								boardUsers.map((user) => (
									<label key={user._id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', cursor: 'pointer' }}>
										<input
											type="checkbox"
											checked={selectedAssignees.includes(String(user._id))}
											onChange={() => {
												setSelectedAssignees((prev) =>
													prev.includes(String(user._id))
														? prev.filter((id) => id !== String(user._id))
														: [...prev, String(user._id)]
												)
											}}
										/>
										<span>
											{user.firstName} {user.lastName} ({user.username})
										</span>
									</label>
								))
							)}
						</div>
					)}
				</div>

				<div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
					<button
						type="button"
						className="board-modal__btn board-modal__btn--secondary"
						onClick={onClose}
						style={{
							padding: '10px 18px',
							border: '1px solid #bdc3c7',
							borderRadius: '6px',
							backgroundColor: 'white',
							cursor: 'pointer',
						}}
					>
						{t('boards.cancel') || 'Anuluj'}
					</button>
					<button
						type="submit"
						className="board-modal__btn board-modal__btn--primary"
						disabled={createTaskMutation.isPending}
						style={{
							padding: '10px 18px',
							border: 'none',
							borderRadius: '6px',
							backgroundColor: '#27ae60',
							color: '#fff',
							cursor: createTaskMutation.isPending ? 'not-allowed' : 'pointer',
							opacity: createTaskMutation.isPending ? 0.7 : 1,
						}}
					>
						{createTaskMutation.isPending ? '…' : t('boards.create') || 'Utwórz'}
					</button>
				</div>
			</form>
		</Modal>
	)
}

export default QuickCalendarTaskModal
