import React from 'react'
import { useLocation } from 'react-router-dom'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import Sidebar from '../dashboard/Sidebar'
import { useTranslation } from 'react-i18next'
import { useSettings } from '../../hooks/useSettings'
import { getLeaveRequestTypeName } from '../../utils/leaveRequestTypes'

function LeaveRequestPDFPreview() {
	const location = useLocation()
	const leaveRequest = location.state?.leaveRequest
	const { t, i18n } = useTranslation()
	const { data: settings } = useSettings()

	const generatePDF = async () => {
		const element = document.getElementById('pdf-content')
		
		// Lepsze opcje dla html2canvas
		const canvas = await html2canvas(element, {
			scale: 2,
			useCORS: true,
			allowTaint: true,
			backgroundColor: '#ffffff',
			width: element.scrollWidth,
			height: element.scrollHeight
		})
		
		const imgData = canvas.toDataURL('image/png')
		const pdf = new jsPDF('p', 'mm', 'a4')
		
		// Oblicz optymalne wymiary żeby wniosek zajmował całą stronę
		const imgProps = pdf.getImageProperties(imgData)
		const pdfWidth = pdf.internal.pageSize.getWidth()
		const pdfHeight = pdf.internal.pageSize.getHeight()
		
		// Marginesy 15mm z każdej strony
		const margin = 15
		const availableWidth = pdfWidth - (2 * margin)
		const availableHeight = pdfHeight - (2 * margin)
		
		// Oblicz proporcje obrazu
		const imgAspectRatio = imgProps.width / imgProps.height
		const pageAspectRatio = availableWidth / availableHeight
		
		let finalWidth, finalHeight
		
		if (imgAspectRatio > pageAspectRatio) {
			// Obraz jest szerszy niż strona - dopasuj do szerokości
			finalWidth = availableWidth
			finalHeight = availableWidth / imgAspectRatio
		} else {
			// Obraz jest wyższy niż strona - dopasuj do wysokości
			finalHeight = availableHeight
			finalWidth = availableHeight * imgAspectRatio
		}
		
		// Wycentruj obraz na stronie
		const x = margin + (availableWidth - finalWidth) / 2
		const y = margin + (availableHeight - finalHeight) / 2
		
		pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight)
		
		pdf.save(`${t('pdf.filename2')}_${leaveRequest.userId.lastName}.pdf`)
	}

	const formatDate = date => {
		const options = { day: '2-digit', month: 'long', year: 'numeric' }
		return new Date(date).toLocaleDateString(i18n.resolvedLanguage, options)
	}

	return (
		<>
			<Sidebar />

			<div id='pdf-leave-request'>
				<div id='pdf-content' style={{ 
					padding: '30px', 
					paddingTop: '80px',
					backgroundColor: '#ffffff',
					border: '1px solid #e5e7eb',
					borderRadius: '8px',
					boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
					maxWidth: '800px',
					margin: '0 auto'
				}}>
					<h2 style={{ 
						marginBottom: '25px',
						color: '#1e40af',
						fontSize: '24px',
						fontWeight: '600',
						textAlign: 'center',
						borderBottom: '2px solid #3b82f6',
						paddingBottom: '10px'
					}}>{t('leavepdf.title')}</h2>
					<div className='allrequests'>
						<div className='firsttworow'>
							<div className='detailsleave' style={{
								backgroundColor: '#f8fafc',
								padding: '20px',
								borderRadius: '6px',
								border: '1px solid #e2e8f0'
							}}>
								<p style={{ margin: '8px 0', fontSize: '14px' }}>
									<strong style={{ color: '#374151', minWidth: '120px', display: 'inline-block' }}>{t('leavepdf.date')}</strong> 
									<span style={{ color: '#1f2937' }}>{formatDate(leaveRequest.createdAt)}</span>
								</p>
								<p style={{ margin: '8px 0', fontSize: '14px' }}>
									<strong style={{ color: '#374151', minWidth: '120px', display: 'inline-block' }}>{t('leavepdf.name')}</strong> 
									<span style={{ color: '#1f2937' }}>{leaveRequest.userId.firstName} {leaveRequest.userId.lastName}</span>
								</p>
								<p style={{ margin: '8px 0', fontSize: '14px' }}>
									<strong style={{ color: '#374151', minWidth: '120px', display: 'inline-block' }}>{t('leavepdf.stano')}</strong> 
									<span style={{ color: '#1f2937' }}>{leaveRequest.userId.position}</span>
								</p>
								<p style={{ margin: '8px 0', fontSize: '14px' }}>
									<strong style={{ color: '#374151', minWidth: '120px', display: 'inline-block' }}>{t('leavepdf.type')}</strong> 
									<span style={{ color: '#1f2937' }}>{getLeaveRequestTypeName(settings, leaveRequest.type, t, i18n.resolvedLanguage)}</span>
								</p>
								<p style={{ margin: '8px 0', fontSize: '14px' }}>
									<strong style={{ color: '#374151', minWidth: '120px', display: 'inline-block' }}>{t('leavepdf.data1')}</strong> 
									<span style={{ color: '#1f2937' }}>{formatDate(leaveRequest.startDate)}</span>
								</p>
								<p style={{ margin: '8px 0', fontSize: '14px' }}>
									<strong style={{ color: '#374151', minWidth: '120px', display: 'inline-block' }}>{t('leavepdf.data2')}</strong> 
									<span style={{ color: '#1f2937' }}>{formatDate(leaveRequest.endDate)}</span>
								</p>
								<p style={{ margin: '8px 0', fontSize: '14px' }}>
									<strong style={{ color: '#374151', minWidth: '120px', display: 'inline-block' }}>{t('leavepdf.days')}</strong> 
									<span style={{ color: '#1f2937' }}>{leaveRequest.daysRequested}</span>
								</p>
								<p style={{ margin: '8px 0', fontSize: '14px' }}>
									<strong style={{ color: '#374151', minWidth: '120px', display: 'inline-block' }}>{t('leavepdf.personsub')} </strong>  
									 <span style={{ color: '#1f2937', marginLeft: '5px' }}>{leaveRequest.replacement || t('adminleavereq.none')} </span> 
								</p>
								<p style={{ margin: '8px 0', fontSize: '14px' }}>
									<strong style={{ color: '#374151', minWidth: '120px', display: 'inline-block' }}>{t('leavepdf.comm')}</strong> 
									<span style={{ color: '#1f2937' }}>{leaveRequest.additionalInfo || t('adminleavereq.none')}</span>
								</p>
							</div>
							<div className='othertwo'>
								<div className='resumedaysleave'>
									<p>{t('leavepdf.info1')}....................</p>
									<p>{t('leavepdf.info2')}....................</p>
									<p>{t('leavepdf.info3')}....................</p>
									<p>{t('leavepdf.info4')}....................</p>
								</div>
								<div className='signature-leave' style={{ margin: '35px 0px' }}>
									<p>
										<strong>{t('leavepdf.info5')}</strong>....................
									</p>
									<p>
										<strong>{t('leavepdf.info6')}</strong>....................
									</p>
									<p>
										<strong>{t('leavepdf.info7')}</strong>....................
									</p>
									<p>
										<strong>{t('leavepdf.info8')}</strong>....................
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>
				<button onClick={generatePDF} className='btn btn-primary btn-print-leavereq' style={{ marginLeft: '17px' }}>
				{t('leavepdf.info9')}
				</button>
			</div>
		</>
	)
}

export default LeaveRequestPDFPreview
