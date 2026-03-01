'use client'

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import axios from 'axios'
import { API_URL } from '../config'
import { calculateTotalPrice, getPricePerUser, formatPrice, type PackageType, type Language } from '../lib/pricing'
import { getPackageModalTranslations } from '../lib/i18n/packageModal'
import { validatePackageRequest } from '../lib/validations/packageRequest'

interface PackageRequestModalProps {
	isOpen: boolean
	onClose: () => void
	packageType: PackageType
	lang?: Language
}

export default function PackageRequestModal({ isOpen, onClose, packageType, lang = 'pl' }: PackageRequestModalProps) {
	const [usersCountInput, setUsersCountInput] = useState<string>('5')
	const [dedicatedEnvironment, setDedicatedEnvironment] = useState<boolean>(false)
	const [companyName, setCompanyName] = useState('')
	const [email, setEmail] = useState('')
	const [phone, setPhone] = useState('')
	const [message, setMessage] = useState('')
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [submitMessage, setSubmitMessage] = useState('')

	// Convert input to number for calculations
	const usersCount = Math.max(5, parseInt(usersCountInput) || 5)

	// Use pricing module
	const pricePerUser = getPricePerUser(packageType, lang)
	const totalPrice = calculateTotalPrice(usersCount, packageType, lang)
	
	// Use i18n module
	const t = getPackageModalTranslations(lang, packageType)

	// Reset form function
	const resetForm = () => {
		setUsersCountInput('5')
		setDedicatedEnvironment(false)
		setCompanyName('')
		setEmail('')
		setPhone('')
		setMessage('')
		setSubmitMessage('')
		setIsSubmitting(false)
	}

	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = 'hidden'
		} else {
			document.body.style.overflow = 'unset'
			// Reset form when modal closes
			resetForm()
		}
		return () => {
			document.body.style.overflow = 'unset'
		}
	}, [isOpen])

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		// Use validation module
		const validation = validatePackageRequest({ email, companyName, usersCount, packageType: t.packageSelected })
		if (!validation.isValid) {
			setSubmitMessage(validation.errors[0] || t.validation.fillRequired)
			return
		}

		setIsSubmitting(true)
		setSubmitMessage('')

		try {
			const totalPriceText = formatPrice(totalPrice, lang)

			await axios.post(`${API_URL}/api/public/request-package`, {
				packageType: t.packageSelected,
				usersCount,
				totalPrice: totalPriceText,
				dedicatedEnvironment,
				companyName,
				email,
				phone: phone || undefined,
				message: message || undefined,
			})

			setSubmitMessage(t.messages.success)

			setTimeout(() => {
				onClose()
				// Form will be reset in useEffect when isOpen changes
			}, 2000)
		} catch (error) {
			setSubmitMessage(t.messages.error)
		} finally {
			setIsSubmitting(false)
		}
	}

	const [mounted, setMounted] = useState(false)

	useEffect(() => {
		setMounted(true)
	}, [])

	if (!isOpen || !mounted) return null

	const modalContent = (
		<div 
			className="fixed inset-0 flex items-center justify-center p-4 bg-white/80 backdrop-blur-sm"
			onClick={onClose}
			style={{ zIndex: 99999, position: 'fixed' }}
		>
			<div 
				className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
				onClick={(e) => e.stopPropagation()}
			>
				{/* Header */}
				<div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-2xl">
					<div className="flex items-center justify-between">
						<h2 className="text-2xl font-bold package-modal-title">{t.title}</h2>
						<button
							onClick={onClose}
							className="text-white hover:text-gray-200 transition p-2 rounded-lg hover:bg-white/10"
							aria-label={t.close}
						>
							<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>
					<div className="mt-3 bg-white/20 rounded-lg px-4 py-2 inline-block">
						<p className="font-semibold package-modal-text">{t.packageSelected}</p>
						<p className="text-sm package-modal-text-secondary">{formatPrice(pricePerUser, lang)} {t.pricePerUser}</p>
					</div>
				</div>

				{/* Form */}
				<form onSubmit={handleSubmit} className="p-6 space-y-6">
					{/* Users count */}
					<div>
						<label htmlFor="usersCount" className="block text-sm font-semibold text-gray-700 mb-2">
							{t.usersCount} <span className="text-red-500">*</span>
						</label>
						<input
							id="usersCount"
							type="number"
							min="5"
							value={usersCountInput}
							onChange={(e) => {
								setUsersCountInput(e.target.value)
							}}
							onBlur={(e) => {
								const value = parseInt(e.target.value)
								if (isNaN(value) || value < 5) {
									setUsersCountInput('5')
								} else {
									setUsersCountInput(value.toString())
								}
							}}
							className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							required
						/>
					</div>

					{/* Dedicated Environment */}
					<div className="bg-white border border-gray-200 rounded-lg p-4">
						<label className="flex items-start gap-3 cursor-pointer">
							<input
								type="checkbox"
								checked={dedicatedEnvironment}
								onChange={(e) => setDedicatedEnvironment(e.target.checked)}
								className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
							/>
							<div className="flex-1">
								<p className="font-semibold text-gray-900">{t.dedicatedEnvironment.label}</p>
								<p className="text-sm text-gray-600 mt-1">{t.dedicatedEnvironment.description}</p>
								<p className="text-xs text-gray-500 mt-1">{t.dedicatedEnvironment.price}</p>
							</div>
						</label>
					</div>

					{/* Total price display */}
					<div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border border-green-200">
						<div className="flex items-center justify-between">
							<span className="text-gray-700 font-semibold">{t.totalPrice}:</span>
								<span className="text-3xl font-bold text-green-600">
			{formatPrice(totalPrice, lang)}
			{dedicatedEnvironment && (
				<span className="text-sm font-normal text-gray-600 ml-2">
					{lang === 'pl' ? '+ ok. 25-30 zł / mieś.' : '+ $7 / month'}
				</span>
			)}
		</span>
						</div>
						<p className="text-xs text-gray-500 mt-1">
							{usersCount} {lang === 'pl' ? 'użytkowników' : 'users'} × {formatPrice(pricePerUser, lang)} = {formatPrice(totalPrice, lang)}
							{dedicatedEnvironment && (
								<span> {lang === 'pl' ? '+ ok. 25-30 zł / mieś. (osobny serwer)' : '+ $7 / month (dedicated server)'}</span>
							)}
						</p>
					</div>

					{/* Company name */}
					<div>
						<label htmlFor="companyName" className="block text-sm font-semibold text-gray-700 mb-2">
							{t.companyName} <span className="text-red-500">*</span>
						</label>
						<input
							id="companyName"
							type="text"
							value={companyName}
							onChange={(e) => setCompanyName(e.target.value)}
							className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							required
						/>
					</div>

					{/* Email */}
					<div>
						<label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
							{t.email} <span className="text-red-500">*</span>
						</label>
						<input
							id="email"
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							required
						/>
					</div>

					{/* Phone */}
					<div>
						<label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
							{t.phone}
						</label>
						<input
							id="phone"
							type="tel"
							value={phone}
							onChange={(e) => setPhone(e.target.value)}
							className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						/>
					</div>

					{/* Message */}
					<div>
						<label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">
							{t.message}
						</label>
						<textarea
							id="message"
							rows={4}
							value={message}
							onChange={(e) => setMessage(e.target.value)}
							placeholder={t.message}
							className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
						/>
					</div>

					{/* Submit message */}
					{submitMessage && (
						<div className={`p-4 rounded-lg ${submitMessage.includes('Dziękujemy') || submitMessage.includes('Thank you') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
							{submitMessage}
						</div>
					)}

					{/* Buttons */}
					<div className="flex gap-4 pt-4">
						<button
							type="button"
							onClick={onClose}
							className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
						>
							{t.close}
						</button>
						<button
							type="submit"
							disabled={isSubmitting}
							className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold shadow-md hover:shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{isSubmitting ? t.messages.sending : t.submit}
						</button>
					</div>
				</form>
			</div>
		</div>
	)

	return createPortal(modalContent, document.body)
}
