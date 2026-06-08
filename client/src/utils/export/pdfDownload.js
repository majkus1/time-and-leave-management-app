/**
 * PDF w przeglądarce z obsługą polskich znaków (pdfmake + Roboto VFS).
 */

let pdfMakeReady = null

async function getPdfMake() {
	if (pdfMakeReady) return pdfMakeReady
	const pdfMakeModule = await import('pdfmake/build/pdfmake')
	const pdfFontsModule = await import('pdfmake/build/vfs_fonts')
	const pdfMake = pdfMakeModule.default ?? pdfMakeModule
	const vfs = pdfFontsModule.default?.pdfMake?.vfs ?? pdfFontsModule.pdfMake?.vfs
	if (vfs) pdfMake.vfs = vfs
	pdfMake.fonts = {
		Roboto: {
			normal: 'Roboto-Regular.ttf',
			bold: 'Roboto-Medium.ttf',
			italics: 'Roboto-Italic.ttf',
			bolditalics: 'Roboto-MediumItalic.ttf',
		},
	}
	pdfMakeReady = pdfMake
	return pdfMake
}

export async function downloadPdf(docDefinition, filename) {
	const pdfMake = await getPdfMake()
	const safeName = filename.endsWith('.pdf') ? filename : `${filename}.pdf`
	return new Promise((resolve, reject) => {
		try {
			pdfMake.createPdf(docDefinition).download(safeName, () => resolve())
		} catch (e) {
			reject(e)
		}
	})
}

export function buildPdfDocument({
	content,
	pageOrientation = 'portrait',
	pageSize = 'A4',
	pageMargins = [32, 32, 32, 38],
	styles,
	header,
	footer,
	info,
}) {
	return {
		pageSize,
		pageOrientation,
		pageMargins,
		info,
		defaultStyle: { font: 'Roboto', fontSize: 10 },
		styles,
		header,
		footer,
		content: Array.isArray(content) ? content : [content],
	}
}

export function pdfTitleBlock(title, subtitle) {
	const block = [{ text: title, fontSize: 13, bold: true, margin: [0, 0, 0, 6] }]
	if (subtitle) {
		block.push({ text: subtitle, fontSize: 10, color: '#505050', margin: [0, 0, 0, 10] })
	}
	return block
}

/** Wiersze etykieta–wartość (jak wcześniejszy pushLine w jsPDF). */
export function pdfLabelValueLines(lines) {
	return (lines || []).map(({ label, value }) => ({
		columns: [
			{ text: label, bold: true, width: 85 },
			{ text: String(value ?? ''), width: '*' },
		],
		margin: [0, 0, 0, 4],
	}))
}

export function pdfDataTable(headers, rows, widths, footerRow) {
	const body = [
		headers.map(h => ({ text: String(h ?? ''), bold: true })),
		...(rows || []).map(row => row.map(cell => String(cell ?? ''))),
	]
	if (footerRow?.length) {
		body.push(footerRow.map(cell => ({ text: String(cell ?? ''), bold: true })))
	}
	return {
		table: {
			headerRows: 1,
			widths,
			body,
		},
		layout: 'lightHorizontalLines',
		margin: [0, 6, 0, 0],
		fontSize: 8,
	}
}
