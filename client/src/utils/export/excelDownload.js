/**
 * Eksport XLSX w przeglądarce (ExcelJS, dynamic import — bez xlsx/SheetJS).
 * @typedef {{ name: string, rows: unknown[][], colWidths?: number[], columnNumFmt?: Record<number, string>, dataStartRow?: number, headerRowIndex?: number, title?: string, subtitle?: string, executive?: boolean }} ExcelSheetInput
 */

const REPORT_COLORS = {
	navy: 'FF0F2A4A',
	blue: 'FF2F91D0',
	green: 'FF16A34A',
	amber: 'FFF59E0B',
	purple: 'FF7C3AED',
	red: 'FFDC2626',
	lightBlue: 'FFEAF5FF',
	lightGreen: 'FFEAFBF0',
	lightAmber: 'FFFFF7ED',
	lightPurple: 'FFF5F3FF',
	lightGray: 'FFF4F7FB',
	border: 'FFD8E2EC',
	text: 'FF172A3A',
	muted: 'FF5D7186',
	white: 'FFFFFFFF',
}

function getLastColumnLetter(columnCount) {
	let dividend = Math.max(1, columnCount)
	let columnName = ''
	while (dividend > 0) {
		const modulo = (dividend - 1) % 26
		columnName = String.fromCharCode(65 + modulo) + columnName
		dividend = Math.floor((dividend - modulo) / 26)
	}
	return columnName
}

function findHeaderRowIndex(rows = []) {
	const index = rows.findIndex(row => Array.isArray(row) && row.filter(cell => cell !== null && cell !== undefined && cell !== '').length > 1)
	return index >= 0 ? index + 1 : 1
}

function styleReportSheet(ws, sheet) {
	const rowCount = ws.rowCount
	const columnCount = Math.max(
		1,
		...(sheet.rows || []).map(row => Array.isArray(row) ? row.length : 1),
		...(sheet.colWidths || []).map((_, index) => index + 1)
	)
	const lastColumn = getLastColumnLetter(columnCount)
	const headerRowIndex = sheet.headerRowIndex || findHeaderRowIndex(sheet.rows)

	ws.properties.defaultRowHeight = 22
	ws.pageSetup = {
		orientation: columnCount > 6 ? 'landscape' : 'portrait',
		fitToPage: true,
		fitToWidth: 1,
		fitToHeight: 0,
		margins: {
			left: 0.35,
			right: 0.35,
			top: 0.55,
			bottom: 0.55,
			header: 0.2,
			footer: 0.2,
		},
	}
	ws.properties.tabColor = { argb: REPORT_COLORS.blue }

	if (sheet.title || sheet.subtitle) {
		const titleRows = []
		if (sheet.title) titleRows.push([sheet.title])
		if (sheet.subtitle) titleRows.push([sheet.subtitle])
		titleRows.reverse().forEach(row => ws.insertRow(1, row))
		const inserted = titleRows.length
		if (inserted > 0) {
			ws.mergeCells(`A1:${lastColumn}1`)
			const titleCell = ws.getCell('A1')
			titleCell.font = { bold: true, size: 17, color: { argb: REPORT_COLORS.white } }
			titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: REPORT_COLORS.navy } }
			titleCell.alignment = { vertical: 'middle', horizontal: 'left' }
			ws.getRow(1).height = 30
		}
		if (inserted > 1) {
			ws.mergeCells(`A2:${lastColumn}2`)
			const subtitleCell = ws.getCell('A2')
			subtitleCell.font = { size: 11, color: { argb: REPORT_COLORS.muted } }
			subtitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: REPORT_COLORS.lightGray } }
			ws.getRow(2).height = 24
		}
	}

	const titleOffset = (sheet.title ? 1 : 0) + (sheet.subtitle ? 1 : 0)
	const effectiveHeaderRowIndex = headerRowIndex + titleOffset
	ws.views = [{ state: 'frozen', ySplit: effectiveHeaderRowIndex }]

	for (let rowNumber = 1; rowNumber <= ws.rowCount; rowNumber += 1) {
		const row = ws.getRow(rowNumber)
		row.eachCell({ includeEmpty: true }, (cell) => {
			cell.font = { ...(cell.font || {}), name: 'Calibri', color: cell.font?.color || { argb: REPORT_COLORS.text } }
			cell.alignment = {
				vertical: 'middle',
				wrapText: true,
				horizontal: typeof cell.value === 'number' ? 'right' : 'left',
			}
			cell.border = {
				top: { style: 'thin', color: { argb: REPORT_COLORS.border } },
				left: { style: 'thin', color: { argb: REPORT_COLORS.border } },
				bottom: { style: 'thin', color: { argb: REPORT_COLORS.border } },
				right: { style: 'thin', color: { argb: REPORT_COLORS.border } },
			}
		})
	}

	const headerRow = ws.getRow(effectiveHeaderRowIndex)
	headerRow.eachCell({ includeEmpty: true }, (cell) => {
		cell.font = { bold: true, color: { argb: REPORT_COLORS.white } }
		cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: REPORT_COLORS.blue } }
		cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
	})
	headerRow.height = 24

	for (let rowNumber = effectiveHeaderRowIndex + 1; rowNumber <= ws.rowCount; rowNumber += 1) {
		const row = ws.getRow(rowNumber)
		const isFooter = String(row.getCell(1).value || '').toLowerCase().includes('razem') || String(row.getCell(1).value || '').toLowerCase().includes('total')
		row.eachCell({ includeEmpty: true }, (cell) => {
			if (isFooter) {
				cell.font = { ...(cell.font || {}), bold: true, color: { argb: REPORT_COLORS.navy } }
				cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: REPORT_COLORS.lightGreen } }
			} else if (rowNumber % 2 === 0) {
				cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: REPORT_COLORS.lightGray } }
			}
		})
	}

	if (rowCount > headerRowIndex) {
		ws.autoFilter = {
			from: { row: effectiveHeaderRowIndex, column: 1 },
			to: { row: effectiveHeaderRowIndex, column: columnCount },
		}
	}

	if (sheet.executive) {
		ws.properties.tabColor = { argb: REPORT_COLORS.navy }
		ws.getRow(effectiveHeaderRowIndex).height = 26
		for (let rowNumber = effectiveHeaderRowIndex + 1; rowNumber <= ws.rowCount; rowNumber += 1) {
			const row = ws.getRow(rowNumber)
			const area = String(row.getCell(1).value || '').toLowerCase()
			const isSpacer = row.values.filter(Boolean).length === 0
			if (isSpacer) {
				row.height = 8
				continue
			}
			let fill = REPORT_COLORS.white
			let accent = REPORT_COLORS.blue
			if (area.includes('kpi')) {
				fill = REPORT_COLORS.lightBlue
				accent = REPORT_COLORS.blue
			} else if (area.includes('insight')) {
				fill = REPORT_COLORS.lightGreen
				accent = REPORT_COLORS.green
			} else if (area.includes('pracown')) {
				fill = REPORT_COLORS.lightPurple
				accent = REPORT_COLORS.purple
			} else if (area.includes('czynno')) {
				fill = REPORT_COLORS.lightAmber
				accent = REPORT_COLORS.amber
			} else if (area.includes('metadane')) {
				fill = REPORT_COLORS.lightGray
				accent = REPORT_COLORS.muted
			}
			row.eachCell({ includeEmpty: true }, (cell, columnNumber) => {
				cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fill } }
				if (columnNumber === 1) {
					cell.font = { ...(cell.font || {}), bold: true, color: { argb: accent } }
				}
				if (columnNumber === 3) {
					cell.font = { ...(cell.font || {}), bold: true, size: 12, color: { argb: REPORT_COLORS.navy } }
				}
			})
		}
	}
}

export async function downloadExcelWorkbook(sheets, filename) {
	const ExcelJS = (await import('exceljs')).default
	const wb = new ExcelJS.Workbook()
	wb.creator = 'Planopia'
	wb.created = new Date()

	for (const sheet of sheets) {
		const safeName = String(sheet.name || 'Sheet').slice(0, 31)
		const ws = wb.addWorksheet(safeName)
		for (const row of sheet.rows || []) {
			ws.addRow(row)
		}
		if (Array.isArray(sheet.colWidths)) {
			sheet.colWidths.forEach((w, i) => {
				const col = ws.getColumn(i + 1)
				col.width = w
			})
		}
		styleReportSheet(ws, sheet)
		if (sheet.columnNumFmt && typeof sheet.columnNumFmt === 'object') {
			const titleOffset = (sheet.title ? 1 : 0) + (sheet.subtitle ? 1 : 0)
			const firstDataRow = (sheet.dataStartRow ?? ((sheet.headerRowIndex || findHeaderRowIndex(sheet.rows)) + 1)) + titleOffset
			for (const [colKey, fmt] of Object.entries(sheet.columnNumFmt)) {
				const colIndex = Number(colKey)
				if (!fmt || !Number.isFinite(colIndex) || colIndex < 1) continue
				const col = ws.getColumn(colIndex)
				col.eachCell({ includeEmpty: false }, (cell, rowNumber) => {
					if (rowNumber >= firstDataRow && typeof cell.value === 'number') {
						cell.numFmt = fmt
					}
				})
			}
		}
	}

	const buffer = await wb.xlsx.writeBuffer()
	const blob = new Blob([buffer], {
		type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
	})
	const url = URL.createObjectURL(blob)
	const link = document.createElement('a')
	link.href = url
	link.download = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`
	document.body.appendChild(link)
	link.click()
	link.remove()
	URL.revokeObjectURL(url)
}
