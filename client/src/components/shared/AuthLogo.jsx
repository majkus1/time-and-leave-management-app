export default function AuthLogo({ maxWidth = '180px', style = {}, className = '' }) {
	return (
		<img
			src="/img/new-logoplanopia.png"
			alt="Planopia"
			className={['app-brand-logo', className].filter(Boolean).join(' ')}
			style={{ maxWidth, ...style }}
		/>
	)
}
