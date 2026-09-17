import type { ReactNode } from 'react'
import { Fragment } from 'react'

/**
 * Modele często zwracają fragmenty w stylu Markdown (**pogrubienie**).
 * Czasem podwójnie „opakowują” (np. **\\*\\*Pro\\*\\***) — upraszczamy przed parsowaniem.
 */
export function normalizeAssistantMarkdown(raw: string): string {
	let s = raw.replace(/\\([*`_#])/g, '$1')
	for (let i = 0; i < 4; i++) {
		const next = s.replace(/\*\*(\*\*[^*]+?\*\*)\*\*/g, '$1')
		if (next === s) break
		s = next
	}
	/* np. ****Pro**** → **Pro** (model czasem „podwójnie” pogrubia) */
	for (let i = 0; i < 4; i++) {
		const next = s.replace(/\*{3,}([^*\n]+?)\*{3,}/g, '**$1**')
		if (next === s) break
		s = next
	}
	return s
}

function isSafeHttpUrl(value: string): boolean {
	try {
		const url = new URL(value)
		return url.protocol === 'http:' || url.protocol === 'https:'
	} catch {
		return false
	}
}

/** Jedna linia tekstu: linki markdown + **wyróżnienie** (bez HTML z modelu). */
export function formatAssistantLine(line: string, keyPrefix: string): ReactNode[] {
	const normalized = normalizeAssistantMarkdown(line)
	const out: ReactNode[] = []
	const linkRe = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g
	let cursor = 0
	let linkMatch: RegExpExecArray | null
	let nodeIndex = 0

	const pushWithBold = (chunk: string) => {
		if (!chunk) return
		const boldRe = /\*\*([^*]+)\*\*/g
		let boldCursor = 0
		let boldMatch: RegExpExecArray | null

		while ((boldMatch = boldRe.exec(chunk)) !== null) {
			if (boldMatch.index > boldCursor) {
				out.push(<span key={`${keyPrefix}-t-${nodeIndex++}`}>{chunk.slice(boldCursor, boldMatch.index)}</span>)
			}
			out.push(
				<strong key={`${keyPrefix}-b-${nodeIndex++}`} className="font-semibold text-gray-900">
					{boldMatch[1]}
				</strong>,
			)
			boldCursor = boldRe.lastIndex
		}

		if (boldCursor < chunk.length) {
			out.push(<span key={`${keyPrefix}-t-${nodeIndex++}`}>{chunk.slice(boldCursor)}</span>)
		}
	}

	while ((linkMatch = linkRe.exec(normalized)) !== null) {
		pushWithBold(normalized.slice(cursor, linkMatch.index))
		const label = linkMatch[1]
		const href = linkMatch[2]
		if (isSafeHttpUrl(href)) {
			out.push(
				<a
					key={`${keyPrefix}-a-${nodeIndex++}`}
					href={href}
					target="_blank"
					rel="noopener noreferrer"
					className="landing-chat-assistant-link underline decoration-emerald-400 underline-offset-2 font-medium"
				>
					{label}
				</a>,
			)
		} else {
			pushWithBold(linkMatch[0])
		}
		cursor = linkRe.lastIndex
	}

	pushWithBold(normalized.slice(cursor))
	return out.length ? out : [normalized]
}

type Block = { type: 'p'; lines: string[] } | { type: 'ul' | 'ol'; items: string[] }

/** Akapity oraz listy „- ” / „1. ” — model dostaje w prompcie zakaz nagłówków, więc to wystarcza. */
function toBlocks(text: string): Block[] {
	const blocks: Block[] = []
	for (const para of text.split(/\n{2,}/)) {
		const lines = para.split('\n').filter(l => l.trim() !== '')
		if (lines.length === 0) continue
		let current: Block | null = null
		for (const line of lines) {
			const ul = /^\s*[-•*]\s+(.*)$/.exec(line)
			const ol = /^\s*\d+[.)]\s+(.*)$/.exec(line)
			if (ul) {
				if (!current || current.type !== 'ul') blocks.push((current = { type: 'ul', items: [] }))
				current.items.push(ul[1])
			} else if (ol) {
				if (!current || current.type !== 'ol') blocks.push((current = { type: 'ol', items: [] }))
				current.items.push(ol[1])
			} else {
				if (!current || current.type !== 'p') blocks.push((current = { type: 'p', lines: [] }))
				current.lines.push(line)
			}
		}
	}
	return blocks
}

/** Treść bąbelka asystenta: akapity, listy i zwykłe łamanie linii. */
export function AssistantMessageContent({ text }: { text: string }) {
	const blocks = toBlocks(text)
	return (
		<div className="landing-chat-md break-words">
			{blocks.map((block, bi) => {
				if (block.type === 'p') {
					return (
						<p key={bi} className={bi > 0 ? 'mt-2' : ''}>
							{block.lines.map((line, li) => (
								<Fragment key={li}>
									{li > 0 ? <br /> : null}
									{formatAssistantLine(line, `${bi}-${li}`)}
								</Fragment>
							))}
						</p>
					)
				}
				const Tag = block.type
				return (
					<Tag key={bi} className={`landing-chat-md__list landing-chat-md__list--${block.type}${bi > 0 ? ' mt-2' : ''}`}>
						{block.items.map((item, ii) => (
							<li key={ii}>{formatAssistantLine(item, `${bi}-${ii}`)}</li>
						))}
					</Tag>
				)
			})}
		</div>
	)
}
