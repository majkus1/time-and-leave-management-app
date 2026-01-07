import React, { useState, useEffect } from 'react';
import Sidebar from '../dashboard/Sidebar';
import axios from 'axios';
import { API_URL } from '../../config';
import { useAuth } from '../../context/AuthContext';
import { useAlert } from '../../context/AlertContext';
import { useTranslation } from 'react-i18next';
import Loader from '../Loader';

const Legal = () => {
	const { userId, teamId, refreshUserData } = useAuth();
	const { showAlert } = useAlert();
	const { t, i18n } = useTranslation();
	const [acceptanceStatus, setAcceptanceStatus] = useState(null);
	const [loading, setLoading] = useState(true);
	const [accepting, setAccepting] = useState(false);
	const [currentDocuments, setCurrentDocuments] = useState({});

	useEffect(() => {
		if (userId && teamId) {
			fetchLegalStatus();
		}
	}, [userId, teamId]);

	const fetchLegalStatus = async () => {
		setLoading(true);
		try {
			const [docsRes, statusRes] = await Promise.all([
				axios.get(`${API_URL}/api/legal/current`, { withCredentials: true }),
				axios.get(`${API_URL}/api/legal/acceptance/status`, { withCredentials: true })
			]);

			setCurrentDocuments(docsRes.data.documents);
			setAcceptanceStatus(statusRes.data.status);
		} catch (error) {
			console.error('Error fetching legal status:', error);
			showAlert(t('legal.errorFetching'), 'error');
		} finally {
			setLoading(false);
		}
	};

	const handleAcceptDocuments = async () => {
		setAccepting(true);
		try {
			// Get all document types that need acceptance
			const documentsToAccept = Object.keys(acceptanceStatus.requiredDocuments)
				.filter(type => !acceptanceStatus.requiredDocuments[type].isAccepted);

			if (documentsToAccept.length === 0) {
				showAlert(t('legal.allAlreadyAccepted'), 'info');
				return;
			}

			await axios.post(`${API_URL}/api/legal/accept`, {
				documentTypes: documentsToAccept
			}, { withCredentials: true });

			showAlert(t('legal.successAccepting'), 'success');
			await refreshUserData();
			await fetchLegalStatus(); // Refresh status
		} catch (error) {
			console.error('Error accepting documents:', error);
			showAlert(error.response?.data?.message || t('legal.errorAccepting'), 'error');
		} finally {
			setAccepting(false);
		}
	};

	const getDocumentTitle = (type) => {
		const titles = {
			'TERMS': t('legal.termsTitle'),
			'PRIVACY': t('legal.privacyTitle'),
			'DPA': t('legal.dpaTitle')
		};
		return titles[type] || type;
	};

	const getDocumentUrl = (type) => {
		return `https://planopia.pl/${type.toLowerCase() === 'dpa' ? 'dpa' : type.toLowerCase() === 'terms' ? 'terms' : 'privacy'}`;
	};

	if (loading) {
		return (
			<>
				<Sidebar />
				<div className="logs-container" style={{ 
					maxWidth: '1200px', 
					margin: '0 auto',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					minHeight: '50vh'
				}}>
					<Loader />
				</div>
			</>
		);
	}

	const needsAcceptance = acceptanceStatus && !acceptanceStatus.allAccepted;

	return (
		<>
			<Sidebar />
			<div className="logs-container" style={{ 
				maxWidth: '1200px', 
				margin: '0 auto'
			}}>
				<div className="logs-header" style={{ marginBottom: '30px', textAlign: 'center' }}>
					<h2 style={{ 
						color: '#2c3e50', 
						marginBottom: '20px',
						fontSize: '28px',
						fontWeight: '600',
						textAlign: 'center'
					}}>
						<img src="/img/docs.png" alt="" style={{ marginRight: '10px', verticalAlign: 'middle' }} /> {t('legal.title')}
					</h2>
                    <hr></hr>
				</div>

				<div className="card-body" style={{
					backgroundColor: '#ffffff',
					borderRadius: '8px',
					boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
					padding: '24px',
					marginTop: '20px'
				}}>

					{needsAcceptance && (
						<div style={{ 
							marginBottom: '24px', 
							padding: '16px', 
							backgroundColor: '#fef3c7', 
							border: '1px solid #fbbf24', 
							borderRadius: '8px' 
						}}>
							<div style={{ display: 'flex', alignItems: 'flex-start' }}>
								<div style={{ flexShrink: 0, marginRight: '12px' }}>
									<svg style={{ width: '20px', height: '20px', color: '#f59e0b' }} viewBox="0 0 20 20" fill="currentColor">
										<path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
									</svg>
								</div>
								<div style={{ flex: 1 }}>
									<h3 style={{ fontSize: '14px', fontWeight: '500', color: '#92400e', marginBottom: '8px' }}>
										{t('legal.acceptanceRequired')}
									</h3>
									<div style={{ fontSize: '14px', color: '#78350f', marginBottom: '16px' }}>
										<p style={{ marginBottom: '8px' }}>{t('legal.someDocumentsRequire')}</p>
										<ul style={{ listStyle: 'disc', paddingLeft: '20px', marginTop: '8px' }}>
											{Object.entries(acceptanceStatus.requiredDocuments)
												.filter(([_, doc]) => !doc.isAccepted)
												.map(([type, doc]) => (
													<li key={type} style={{ marginBottom: '4px' }}>
														{getDocumentTitle(type)} ({t('legal.version')} {doc.currentVersion})
													</li>
												))}
										</ul>
									</div>
									<div>
										<button
											onClick={handleAcceptDocuments}
											disabled={accepting}
											style={{
												display: 'inline-flex',
												alignItems: 'center',
												padding: '8px 16px',
												border: 'none',
												borderRadius: '6px',
												fontSize: '14px',
												fontWeight: '500',
												color: '#ffffff',
												backgroundColor: accepting ? '#d97706' : '#f59e0b',
												cursor: accepting ? 'not-allowed' : 'pointer',
												opacity: accepting ? 0.6 : 1
											}}
											onMouseEnter={(e) => {
												if (!accepting) {
													e.target.style.backgroundColor = '#d97706';
												}
											}}
											onMouseLeave={(e) => {
												if (!accepting) {
													e.target.style.backgroundColor = '#f59e0b';
												}
											}}
										>
											{accepting ? t('legal.accepting') : t('legal.acceptAll')}
										</button>
									</div>
								</div>
							</div>
						</div>
					)}

					{!needsAcceptance && (
						<div style={{ 
							marginBottom: '24px', 
							padding: '16px', 
							backgroundColor: '#d1fae5', 
							border: '1px solid #10b981', 
							borderRadius: '8px' 
						}}>
							<div style={{ display: 'flex', alignItems: 'center' }}>
								<svg style={{ width: '20px', height: '20px', color: '#10b981', marginRight: '8px' }} viewBox="0 0 20 20" fill="currentColor">
									<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
								</svg>
								<span style={{ fontSize: '14px', fontWeight: '500', color: '#065f46' }}>
									{t('legal.allAccepted')}
								</span>
							</div>
						</div>
					)}

					<div style={{ marginTop: '24px' }}>
						<h2 style={{ padding: '15px', fontSize: '20px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>{t('legal.availableDocuments')}</h2>
						
						<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
							{Object.entries(acceptanceStatus?.requiredDocuments || {}).map(([type, doc]) => (
								<div key={type} style={{ 
									border: '1px solid #e5e7eb', 
									borderRadius: '8px', 
									padding: '16px',
									backgroundColor: '#ffffff'
								}}>
									<div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
										<div style={{ flex: 1 }}>
											<h3 style={{ fontSize: '18px', fontWeight: '500', color: '#111827', marginBottom: '8px' }}>
												{getDocumentTitle(type)}
											</h3>
											<p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
												{t('legal.version')} {doc.currentVersion} • {t('legal.effectiveFrom')} {new Date(doc.effectiveAt).toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'pl-PL')}
											</p>
											<div style={{ marginTop: '8px' }}>
												{doc.isAccepted ? (
													<span style={{
														display: 'inline-flex',
														alignItems: 'center',
														padding: '4px 10px',
														borderRadius: '9999px',
														fontSize: '12px',
														fontWeight: '500',
														backgroundColor: '#d1fae5',
														color: '#065f46'
													}}>
														{t('legal.accepted')}
													</span>
												) : (
													<span style={{
														display: 'inline-flex',
														alignItems: 'center',
														padding: '4px 10px',
														borderRadius: '9999px',
														fontSize: '12px',
														fontWeight: '500',
														backgroundColor: '#fef3c7',
														color: '#92400e'
													}}>
														{t('legal.requiresAcceptance')}
													</span>
												)}
											</div>
										</div>
										<div style={{ marginLeft: '16px', flexShrink: 0 }}>
											<a
												href={getDocumentUrl(type)}
												target="_blank"
												rel="noopener noreferrer"
												style={{
													display: 'inline-flex',
													alignItems: 'center',
													padding: '8px 16px',
													border: '1px solid #d1d5db',
													borderRadius: '6px',
													fontSize: '14px',
													fontWeight: '500',
													color: '#374151',
													backgroundColor: '#ffffff',
													textDecoration: 'none',
													boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
												}}
												onMouseEnter={(e) => {
													e.target.style.backgroundColor = '#f9fafb';
												}}
												onMouseLeave={(e) => {
													e.target.style.backgroundColor = '#ffffff';
												}}
											>
												{t('legal.browse')}
												<svg style={{ width: '16px', height: '16px', marginLeft: '8px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
												</svg>
											</a>
										</div>
									</div>
								</div>
							))}
						</div>
					</div>

					<div style={{ padding: '15px', marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #e5e7eb' }}>
						<p style={{ fontSize: '14px', color: '#6b7280' }}>
							{t('legal.publiclyAvailable')}
						</p>
					</div>
				</div>
			</div>
		</>
	);
};

export default Legal;

