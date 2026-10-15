// Zmiana klucza (np. przy nowym ogłoszeniu) pokaże pasek ponownie także tym, którzy zamknęli poprzedni
export const ANNOUNCE_DISMISS_KEY = 'planopia_announce_partner_v1'

/**
 * Wykonywany w <head> layoutu PL jeszcze przed renderem strony — po zamknięciu paska kolejna wizyta nie „skacze”.
 * W layoucie, a nie w pasku, bo przy przejściu na stronę główną bez przeładowania skrypt w komponencie się nie wykona.
 */
export const ANNOUNCE_DISMISS_SCRIPT = `try{if(localStorage.getItem('${ANNOUNCE_DISMISS_KEY}'))document.documentElement.classList.add('lab-off')}catch(e){}`
