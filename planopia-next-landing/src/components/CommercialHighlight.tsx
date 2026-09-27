import type { Highlight, HighlightIcon } from '../data/commercialLandingCopy'

const QR_SIZE = 21

// Stały „szum” zamiast prawdziwego kodu — obrazek ma tylko sugerować zmianę kodu, nie dać się zeskanować.
function qrPath(seed: number) {
	let state = seed
	const next = () => {
		state = (state + 0x6d2b79f5) | 0
		let t = Math.imul(state ^ (state >>> 15), 1 | state)
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296
	}
	const inFinder = (x: number, y: number) =>
		(x < 8 && y < 8) || (x > QR_SIZE - 9 && y < 8) || (x < 8 && y > QR_SIZE - 9)
	let d = ''
	for (let y = 0; y < QR_SIZE; y++) {
		for (let x = 0; x < QR_SIZE; x++) {
			if (!inFinder(x, y) && next() > 0.52) d += `M${x} ${y}h1v1h-1z`
		}
	}
	return d
}

const QR_A = qrPath(7)
const QR_B = qrPath(1913)

function Finder({ x, y }: { x: number; y: number }) {
	return (
		<g>
			<rect x={x} y={y} width={7} height={7} fill="#0b1f40" />
			<rect x={x + 1} y={y + 1} width={5} height={5} fill="#fff" />
			<rect x={x + 2} y={y + 2} width={3} height={3} fill="#0b1f40" />
		</g>
	)
}

function Icon({ name }: { name: HighlightIcon }) {
	const common = {
		width: 24,
		height: 24,
		viewBox: '0 0 24 24',
		fill: 'none',
		stroke: 'currentColor',
		strokeWidth: 1.8,
		strokeLinecap: 'round' as const,
		strokeLinejoin: 'round' as const,
		'aria-hidden': true,
	}
	if (name === 'screen') {
		return (
			<svg {...common}>
				<rect x="4" y="2.5" width="16" height="19" rx="2.5" />
				<path d="M9 8h2v2H9zM13 8h2v2h-2zM9 12h2v2H9z" />
				<path d="M13.5 15.5a2 2 0 1 0 1.2-2" />
				<path d="M14.9 12.3l-.2 1.3 1.3.2" />
			</svg>
		)
	}
	if (name === 'pin') {
		return (
			<svg {...common}>
				<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0C18.5 15.4 12 21 12 21z" />
				<circle cx="12" cy="10" r="2.4" />
			</svg>
		)
	}
	if (name === 'badge') {
		return (
			<svg {...common}>
				<path d="M12 2.8l7 2.8v5.6c0 4.6-3 8.3-7 9.9-4-1.6-7-5.3-7-9.9V5.6z" />
				<path d="M12 8v4.2M12 15.4v.1" />
			</svg>
		)
	}
	return (
		<svg {...common}>
			<path d="M3.5 20.5h17M5.5 20.5V9l6.5-4.5L18.5 9v11.5" />
			<path d="M9.5 20.5v-5h5v5M9.5 11h5" />
		</svg>
	)
}

export default function CommercialHighlight({ highlight: h }: { highlight: Highlight }) {
	return (
		<section id={h.id} className="commercial-highlight scroll-mt-24" aria-labelledby={`${h.id}-heading`}>
			<div className="max-w-6xl mx-auto px-4 sm:px-5 py-12 md:py-16">
				<div className="grid grid-cols-1 md:grid-cols-[1.15fr_0.85fr] gap-10 md:gap-12 items-center">
					<div className="min-w-0">
						<p className="commercial-highlight__eyebrow">{h.eyebrow}</p>
						<h2 id={`${h.id}-heading`} className="commercial-highlight__title">
							{h.title}
						</h2>
						<p className="commercial-highlight__lead">{h.lead}</p>
					</div>

					<div className="commercial-highlight__stage" aria-hidden>
						<div className="commercial-highlight__tablet">
							<p className="commercial-highlight__place">{h.mock.place}</p>
							<div className="commercial-highlight__qr">
								<svg viewBox={`-1 -1 ${QR_SIZE + 2} ${QR_SIZE + 2}`} shapeRendering="crispEdges">
									<rect x={-1} y={-1} width={QR_SIZE + 2} height={QR_SIZE + 2} fill="#fff" />
									<path className="commercial-highlight__qr-a" d={QR_A} fill="#0b1f40" />
									<path className="commercial-highlight__qr-b" d={QR_B} fill="#0b1f40" />
									<Finder x={0} y={0} />
									<Finder x={QR_SIZE - 7} y={0} />
									<Finder x={0} y={QR_SIZE - 7} />
								</svg>
							</div>
							<div className="commercial-highlight__refresh">
								<svg className="commercial-highlight__ring" viewBox="0 0 20 20">
									<circle cx="10" cy="10" r="8" />
									<circle className="commercial-highlight__ring-progress" cx="10" cy="10" r="8" pathLength={100} />
								</svg>
								<p>{h.mock.refreshLabel}</p>
							</div>
						</div>
						<div className="commercial-highlight__sessions">
							<p className="commercial-highlight__sessions-label">{h.mock.badgesLabel}</p>
							<ul>
								{h.mock.badges.map((b) => (
									<li key={b.label} className={`commercial-highlight__chip commercial-highlight__chip--${b.tone}`}>
										{b.tone === 'ok' ? '✓' : '⚠'} {b.label}
									</li>
								))}
							</ul>
						</div>
					</div>
				</div>

				<ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mt-10 md:mt-12 list-none m-0 p-0">
					{h.items.map((item) => (
						<li key={item.title} className="commercial-highlight__card">
							<div className="commercial-highlight__icon">
								<Icon name={item.icon} />
							</div>
							<h3 className="commercial-highlight__card-title">{item.title}</h3>
							<p className="commercial-highlight__card-text">{item.text}</p>
						</li>
					))}
				</ul>

				<p className="commercial-highlight__note">{h.note}</p>
			</div>
		</section>
	)
}
