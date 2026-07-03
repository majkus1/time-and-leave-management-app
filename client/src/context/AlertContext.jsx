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
					content={alert.content}
					panelClassName={alert.panelClassName}
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

const AlertComponent = ({ type, message, content, panelClassName, onClose, onConfirm, onCancel, confirmText, cancelText }) => {
	const handleBackdropClick = e => {
		if (e.target === e.currentTarget) {
			if (type === 'alert') {
				onClose()
			} else if (onCancel) {
				onCancel()
			}
		}
	}

	const panelClasses = ['po-alert-panel', 'rounded-lg', 'w-full', 'mx-4', 'transform', 'transition-all']
	if (panelClassName) {
		panelClasses.push(panelClassName)
	} else {
		panelClasses.push('max-w-md')
	}

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-[1px] po-alert-backdrop"
			style={{ zIndex: 100000000 }}
			onClick={handleBackdropClick}>
			<div className={panelClasses.join(' ')}>
				<div className="p-6">
					<div className={content ? 'mb-5' : 'mb-4'}>
						{content ? (
							content
						) : (
							<p className="po-alert-message text-base leading-relaxed">{message}</p>
						)}
					</div>
					<div className="flex justify-end gap-3 flex-wrap">
						{type === 'confirm' && (
							<button
								onClick={onCancel}
								className="po-alert-btn-secondary px-4 py-2 rounded-md transition-colors duration-200 font-medium">
								{cancelText}
							</button>
						)}
						<button
							onClick={type === 'alert' ? onClose : onConfirm}
							className="po-alert-btn-primary px-4 py-2 rounded-md transition-colors duration-200 font-medium">
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

