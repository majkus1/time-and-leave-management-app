import React, { createContext, useContext, useState } from 'react'

const AlertContext = createContext()

export const AlertProvider = ({ children }) => {
	const [alert, setAlert] = useState(null)

	const showAlert = (message, options = {}) => {
		return new Promise(resolve => {
			setAlert({
				type: 'alert',
				message,
				onClose: () => {
					setAlert(null)
					resolve()
				},
				...options,
			})
		})
	}

	const showConfirm = (message, options = {}) => {
		return new Promise(resolve => {
			setAlert({
				type: 'confirm',
				message,
				onConfirm: () => {
					setAlert(null)
					resolve(true)
				},
				onCancel: () => {
					setAlert(null)
					resolve(false)
				},
				confirmText: options.confirmText || 'OK',
				cancelText: options.cancelText || 'Anuluj',
				...options,
			})
		})
	}

	return (
		<AlertContext.Provider value={{ showAlert, showConfirm }}>
			{children}
			{alert && (
				<AlertComponent
					type={alert.type}
					message={alert.message}
					onClose={alert.onClose}
					onConfirm={alert.onConfirm}
					onCancel={alert.onCancel}
					confirmText={alert.confirmText}
					cancelText={alert.cancelText}
				/>
			)}
		</AlertContext.Provider>
	)
}

const AlertComponent = ({ type, message, onClose, onConfirm, onCancel, confirmText, cancelText }) => {
	const handleBackdropClick = e => {
		if (e.target === e.currentTarget) {
			if (type === 'alert') {
				onClose()
			} else if (onCancel) {
				onCancel()
			}
		}
	}

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-[1px]"
			style={{ zIndex: 100000000 }}
			onClick={handleBackdropClick}>
			<div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 transform transition-all">
				<div className="p-6">
					<div className="mb-4">
						<p className="text-gray-800 text-base leading-relaxed">{message}</p>
					</div>
					<div className="flex justify-end gap-3">
						{type === 'confirm' && (
							<button
								onClick={onCancel}
								className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors duration-200 font-medium">
								{cancelText}
							</button>
						)}
						<button
							onClick={type === 'alert' ? onClose : onConfirm}
							className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors duration-200 font-medium">
							{type === 'alert' ? 'OK' : confirmText}
						</button>
					</div>
				</div>
			</div>
		</div>
	)
}

export const useAlert = () => {
	const context = useContext(AlertContext)
	if (!context) {
		throw new Error('useAlert must be used within AlertProvider')
	}
	return context
}

