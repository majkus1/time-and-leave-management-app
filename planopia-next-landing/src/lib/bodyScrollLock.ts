/** Zdejmuje blokadę scrolla z body (menu mobilne, modale, galeria). */
export function resetBodyScrollLock() {
	if (typeof document === 'undefined') return
	document.body.style.overflow = ''
	document.body.style.paddingRight = ''
	document.body.classList.remove('mobile-menu-open')
}
