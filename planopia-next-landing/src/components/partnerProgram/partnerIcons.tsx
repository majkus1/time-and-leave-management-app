// Ikony liniowe podstrony programu partnerskiego — inline, bez zależności i bez emoji.
type IconProps = { size?: number; className?: string }

function Svg({ size = 20, className, children }: IconProps & { children: React.ReactNode }) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth={2}
			strokeLinecap="round"
			strokeLinejoin="round"
			className={className}
			aria-hidden="true"
			focusable="false"
		>
			{children}
		</svg>
	)
}

export function IconArrow(props: IconProps) {
	return (
		<Svg {...props}>
			<path d="M5 12h14M13 6l6 6-6 6" />
		</Svg>
	)
}

export function IconCheck(props: IconProps) {
	return (
		<Svg {...props}>
			<path d="M5 12.5l4.2 4.2L19 7" />
		</Svg>
	)
}

export function IconCheckCircle(props: IconProps) {
	return (
		<Svg {...props}>
			<circle cx="12" cy="12" r="9" />
			<path d="M8 12.3l2.7 2.7L16 9.6" />
		</Svg>
	)
}

export function IconClock(props: IconProps) {
	return (
		<Svg {...props}>
			<circle cx="12" cy="12" r="9" />
			<path d="M12 7v5l3 2" />
		</Svg>
	)
}

export function IconPlus(props: IconProps) {
	return (
		<Svg {...props}>
			<path d="M12 5v14M5 12h14" />
		</Svg>
	)
}

export function IconCopy(props: IconProps) {
	return (
		<Svg {...props}>
			<rect x="9" y="9" width="11" height="11" rx="2" />
			<path d="M5 15V6a2 2 0 0 1 2-2h9" />
		</Svg>
	)
}

export function IconMail(props: IconProps) {
	return (
		<Svg {...props}>
			<rect x="3" y="5" width="18" height="14" rx="2" />
			<path d="M3.5 6.5L12 13l8.5-6.5" />
		</Svg>
	)
}

export function IconPhone(props: IconProps) {
	return (
		<Svg {...props}>
			<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />
		</Svg>
	)
}

export function IconDownload(props: IconProps) {
	return (
		<Svg {...props}>
			<path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
		</Svg>
	)
}

export function IconChevron(props: IconProps) {
	return (
		<Svg {...props}>
			<path d="M7 10l5 5 5-5" />
		</Svg>
	)
}

export function IconQuote({ className }: { className?: string }) {
	return (
		<svg viewBox="0 0 44 34" className={className} aria-hidden="true" focusable="false">
			<path
				fill="currentColor"
				d="M0 34V20.4C0 8.9 5.6 2.1 16.8 0l2.3 4.6C13 6.4 10 10 9.6 15.5H18V34H0zm26 0V20.4C26 8.9 31.6 2.1 42.8 0l2.3 4.6C39 6.4 36 10 35.6 15.5H44V34H26z"
			/>
		</svg>
	)
}
