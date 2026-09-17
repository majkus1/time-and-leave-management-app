// Źródło: TutorialModal (chat, announcements, settings-personal), chatController.createGeneralChannel /
// createChannelForDepartment, emailService (powiadomienia czat/komunikaty), planCatalog.MODULE_API_PREFIXES.chat.
module.exports = {
	id: 'chat',
	order: 6,
	title: { pl: 'Czat, komunikaty i powiadomienia', en: 'Chat, announcements and notifications' },
	summary: {
		pl: 'Czat zespołowy (kanał ogólny, działy, prywatne rozmowy), komunikaty od administracji, powiadomienia e-mail i push.',
		en: 'Team chat (general channel, departments, private chats), announcements, e-mail and push notifications.',
	},
	keywords: {
		pl: ['czat', 'wiadomoś', 'kanał', 'komunikat', 'ogłoszen', 'powiadom', 'push', 'mail', 'prywatn', 'sms', 'slack', 'teams', 'whatsapp', 'dzwonek'],
		en: ['chat', 'message', 'channel', 'announcement', 'notification', 'push', 'mail', 'private', 'sms', 'slack', 'teams', 'whatsapp'],
	},
	requires: { modules: ['chat'], bundles: ['pro', 'business'], trial: true, freemium: false },
	suggestedQuestions: {
		pl: ['Jak działa czat zespołowy?', 'Czym różnią się komunikaty od czatu?', 'Jakie powiadomienia dostają pracownicy i czy można je wyłączyć?'],
		en: ['How does the team chat work?', 'How do announcements differ from chat?', 'What notifications do employees get and can they turn them off?'],
	},
	body: {
		pl: `### Czat
- Menu → „Czat”: kanał ogólny całego zespołu tworzy się automatycznie, każdy dział dostaje własny kanał, można tworzyć kanały z dowolnymi osobami i rozmowy prywatne. Wiadomości w czasie rzeczywistym, historia zapisana, licznik nieprzeczytanych w menu, powiadomienia o nowych wiadomościach (przeglądarka/push i e-mail).
- Plan: moduł Czat ({{price.module.chat}} zł netto/mies. do Core) albo Pro/Business; w okresie próbnym dostępny; w planie darmowym nie.

### Komunikaty
- Menu → „Komunikaty”: ogłoszenia od Administratora/HR do całego zespołu, działu albo wybranych osób, z tytułem, treścią i załącznikami. Odbiorcy dostają e-mail i push; w menu widać nieprzeczytane. Dostępne w planach płatnych i w okresie próbnym.

### Powiadomienia
- Push (przeglądarka/telefon): każdy włącza je dla siebie w menu → Ustawienia → Powiadomienia push i wybiera typy (urlopy, zadania, czat, grafik, komunikaty). Najlepiej działają w zainstalowanej Planopii (PWA).
- E-mail: wysyłany przy nowym wniosku urlopowym i decyzji, publikacji grafiku, zadaniach i komentarzach, wiadomościach na czacie, komunikatach. Każdy może wyłączyć wybrane e-maile w menu → Ustawienia → Powiadomienia e-mail.
- Dzwonek w aplikacji zbiera powiadomienia w jednym miejscu.

### Czego NIE robi
- Nie wysyła SMS-ów.
- Nie ma rozmów głosowych ani wideo.
- Nie integruje się ze Slackiem, Teams ani WhatsAppem.

### Gdzie w aplikacji / kto może
Czat: menu → Czat (każdy). Komunikaty: menu → Komunikaty (tworzy Administrator/HR, czytają odbiorcy). Powiadomienia: menu → Ustawienia (każdy dla siebie).`,
		en: null,
	},
}
