/**
 * Eksport XLSX w przeglądarce (ExcelJS, dynamic import — bez xlsx/SheetJS).
 * @typedef {{ name: string, rows: unknown[][], colWidths?: number[], columnNumFmt?: Record<number, string>, dataStartRow?: number }} ExcelSheetInput
 */

export async function downloadExcelWorkbook(sheets, filename) {
	const ExcelJS = (await import('exceljs')).default
	const wb = new ExcelJS.Workbook()

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
		if (sheet.columnNumFmt && typeof sheet.columnNumFmt === 'object') {
			const firstDataRow = sheet.dataStartRow ?? 2
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
