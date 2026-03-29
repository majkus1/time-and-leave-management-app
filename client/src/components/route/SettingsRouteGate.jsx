import Settings from '../profile/Settings'

/** /settings dla wszystkich zalogowanych; worker/przełożony — tylko push (logika w Settings.jsx). */
export default function SettingsRouteGate() {
	return <Settings />
}
