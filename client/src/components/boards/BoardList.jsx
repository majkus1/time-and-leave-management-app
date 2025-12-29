import React, { useState } from 'react'
import Sidebar from '../dashboard/Sidebar'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { useAlert } from '../../context/AlertContext'
import Loader from '../Loader'
import { useBoards, useCreateBoard, useDeleteBoard, useBoardUsers } from '../../hooks/useBoards'
import CreateBoardModal from './CreateBoardModal'
import EditBoardModal from './EditBoardModal'
import UsersInfoModal from '../shared/UsersInfoModal'
import { Link } from 'react-router-dom'

function BoardList() {
	const { t } = useTranslation()
	const { role, userId } = useAuth()
	const { showAlert, showConfirm } = useAlert()
	const { data: boards = [], isLoading, refetch } = useBoards()
	const createBoardMutation = useCreateBoard()
	const deleteBoardMutation = useDeleteBoard()
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
	const [editingBoard, setEditingBoard] = useState(null)
	const [usersInfoModal, setUsersInfoModal] = useState({ isOpen: false, boardId: null })
	const isAdmin = role && role.includes('Admin')
	// Hook dla użytkowników tablicy w modalu
	const { data: boardUsers = [], isLoading: loadingBoardUsers } = useBoardUsers(
		usersInfoModal.boardId,
		usersInfoModal.isOpen
	)

	const handleDeleteBoard = async (board) => {
		const confirmed = await showConfirm(
			t('boards.deleteConfirm') || 'Czy na pewno chcesz usunąć tę tablicę?'
		)
		if (!confirmed) return

		try {
			await deleteBoardMutation.mutateAsync(board._id)
			await showAlert(t('boards.deleteSuccess') || 'Tablica została usunięta pomyślnie')
			refetch()
		} catch (error) {
			await showAlert(error.response?.data?.message || t('boards.deleteError') || 'Błąd podczas usuwania tablicy')
		}
	}

	if (isLoading) {
		return (
			<>
				<Sidebar />
				<div className="content-with-loader">
					<Loader />
				</div>
			</>
		)
	}

	return (
		<>
			<Sidebar />
			<div style={{ maxWidth: '1200px', padding: '15px' }} className='board-list'>
				<div style={{ marginBottom: '30px' }}>
					<h2 style={{ 
						color: '#2c3e50', 
						marginBottom: '20px',
						fontSize: '28px',
						fontWeight: '600'
					}}>
					<img src="/img/task-list.png" alt='icon of boards' />	{t('boards.title') || 'Tablice zadań'}
					</h2>
					<button
						onClick={() => setIsCreateModalOpen(true)}
						style={{
							padding: '12px 24px',
							backgroundColor: '#3498db',
							color: 'white',
							border: 'none',
							borderRadius: '8px',
							fontSize: '16px',
							fontWeight: '500',
							cursor: 'pointer',
							boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
						}}>
						{t('boards.createBoard') || 'Utwórz nową tablicę'}
					</button>
				</div>

				<div style={{
					display: 'grid',
					gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
					gap: '20px'
				}}>
					{boards.map((board) => (
						<div
							key={board._id}
							style={{
								backgroundColor: 'white',
								borderRadius: '12px',
								padding: '20px',
								boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
								transition: 'transform 0.2s',
								cursor: 'pointer',
								position: 'relative'
							}}
							onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
							onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
							<Link
								to={`/boards/${board._id}`}
								style={{ textDecoration: 'none', color: 'inherit' }}>
								<h3 style={{ 
									color: '#2c3e50', 
									marginBottom: '10px',
									fontSize: '20px',
									fontWeight: '600'
								}}>
									{board.name}
								</h3>
								{board.description && (
									<p style={{ 
										color: '#7f8c8d', 
										fontSize: '16px',
										marginBottom: '10px'
									}}>
										{board.description}
									</p>
								)}
								<div style={{ 
									fontSize: '12px', 
									color: '#95a5a6',
									marginTop: '10px'
								}}>
									{board.type === 'team' && `📋 ${t('boards.boardType.team')}`}
									{board.type === 'department' && `🏢 ${t('boards.boardType.department')}`}
									{board.type === 'custom' && `⭐ ${t('boards.boardType.custom')}`}
								</div>
							</Link>
							<div style={{
								position: 'absolute',
								top: '10px',
								right: '10px',
								display: 'flex',
								gap: '8px',
								alignItems: 'center'
							}}>
								<button
									onClick={(e) => {
										e.preventDefault()
										e.stopPropagation()
										setUsersInfoModal({ isOpen: true, boardId: board._id })
									}}
									style={{
										background: 'transparent',
										border: 'none',
										color: '#3498db',
										cursor: 'pointer',
										fontSize: '16px',
										padding: '4px 8px',
										borderRadius: '4px',
										transition: 'all 0.2s'
									}}
									onMouseEnter={(e) => {
										e.target.style.backgroundColor = '#ebf5fb'
										e.target.style.color = '#2980b9'
									}}
									onMouseLeave={(e) => {
										e.target.style.backgroundColor = 'transparent'
										e.target.style.color = '#3498db'
									}}
									title={t('usersInfo.viewUsers') || 'Zobacz użytkowników'}>
									ℹ️
								</button>
								{!board.isTeamBoard && board.type === 'custom' && (isAdmin || (board.createdBy && board.createdBy._id === userId)) && (
									<>
										<button
											onClick={(e) => {
												e.preventDefault()
												e.stopPropagation()
												setEditingBoard(board)
											}}
											style={{
												background: '#3498db',
												border: 'none',
												color: 'white',
												cursor: 'pointer',
												fontSize: '16px',
												padding: '4px 8px',
												borderRadius: '4px'
											}}
											title={t('boards.edit') || 'Edytuj tablicę'}>
											✏️
										</button>
										<button
											onClick={(e) => {
												e.preventDefault()
												e.stopPropagation()
												handleDeleteBoard(board)
											}}
											style={{
												background: 'transparent',
												border: 'none',
												color: '#dc3545',
												cursor: 'pointer',
												fontSize: '20px',
												padding: '4px 8px'
											}}
											title={t('boards.delete') || 'Usuń tablicę'}>
											×
										</button>
									</>
								)}
							</div>
						</div>
					))}
				</div>

				{boards.length === 0 && (
					<div style={{ 
						textAlign: 'center', 
						padding: '40px',
						color: '#7f8c8d'
					}}>
						<p>{t('boards.noBoards') || 'Brak tablic. Utwórz nową tablicę!'}</p>
					</div>
				)}
			</div>

			{isCreateModalOpen && (
				<CreateBoardModal
					onClose={() => setIsCreateModalOpen(false)}
					onSuccess={() => {
						setIsCreateModalOpen(false)
						refetch()
					}}
				/>
			)}

			{editingBoard && (
				<EditBoardModal
					board={editingBoard}
					onClose={() => setEditingBoard(null)}
					onSuccess={() => {
						setEditingBoard(null)
						refetch()
					}}
				/>
			)}

			{/* Modal z użytkownikami tablicy */}
			<UsersInfoModal
				isOpen={usersInfoModal.isOpen}
				onClose={() => setUsersInfoModal({ isOpen: false, boardId: null })}
				users={boardUsers}
				isLoading={loadingBoardUsers}
				title={t('usersInfo.boardUsers') || 'Użytkownicy tablicy'}
			/>
		</>
	)
}

export default BoardList

