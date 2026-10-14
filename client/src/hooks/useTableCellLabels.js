import { useEffect } from 'react'

/**
 * Na telefonie tabele paneli (klasa .ap-scroll) układają się w karty: każda komórka pokazuje nazwę swojej kolumny
 * (CSS: td::before { content: attr(data-label) }). Hook przepisuje nagłówki kolumn do data-label komórek w obrębie
 * kontenera i pilnuje tego przy każdej zmianie danych, więc żadna kolumna nie chowa się poza ekranem.
 */
export function useTableCellLabels(rootRef) {
	useEffect(() => {
		const root = rootRef.current
		if (!root) return undefined
		const label = () => {
			for (const table of root.querySelectorAll('.ap-scroll table')) {
				const heads = [...table.querySelectorAll('thead th')].map(th => th.textContent.trim())
				for (const row of table.querySelectorAll('tbody tr, tfoot tr')) {
					;[...row.children].forEach((cell, i) => {
						const text = heads[i] || ''
						if (cell.getAttribute('data-label') !== text) cell.setAttribute('data-label', text)
					})
				}
			}
		}
		label()
		const observer = new MutationObserver(label)
		observer.observe(root, { childList: true, subtree: true, characterData: true })
		return () => observer.disconnect()
	}, [rootRef])
}
