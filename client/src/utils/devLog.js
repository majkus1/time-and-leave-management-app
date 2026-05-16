/** Logi tylko w `npm run dev` — w produkcyjnym bundlu Vite je wycina. */
export function devLog(...args) {
	if (import.meta.env.DEV) {
		console.log(...args)
	}
}

export function devWarn(...args) {
	if (import.meta.env.DEV) {
		console.warn(...args)
	}
}
