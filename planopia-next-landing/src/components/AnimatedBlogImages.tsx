'use client'

import { useEffect, useRef, useState } from 'react'

const XL_MQ = '(min-width: 1280px)'

export type BlogHeroImage = {
	src: string
	alt: string
	width?: number
	height?: number
}

interface AnimatedBlogImagesProps {
	desktopImages: BlogHeroImage[]
	mobileImages: BlogHeroImage[]
	desktopClassName?: string
	mobileClassName?: string
	interval?: number
}

export default function AnimatedBlogImages({
	desktopImages,
	mobileImages,
	desktopClassName = 'rounded-xl w-full h-auto aspect-[4/2] shadow-lg',
	mobileClassName = 'rounded-xl shadow-xl ring-1 ring-black/5 mx-auto max-h-[600px] w-full h-auto',
	interval = 5000,
}: AnimatedBlogImagesProps) {
	const wrapRef = useRef<HTMLDivElement>(null)
	const [currentIndex, setCurrentIndex] = useState(0)
	const [isXl, setIsXl] = useState(false)
	const [inView, setInView] = useState(false)

	const activeSet = isXl ? desktopImages : mobileImages
	const current = activeSet[currentIndex % activeSet.length] ?? activeSet[0]
	const width = current.width ?? (isXl ? 1200 : 390)
	const height = current.height ?? (isXl ? 600 : 844)

	useEffect(() => {
		const mq = window.matchMedia(XL_MQ)
		const sync = () => {
			setIsXl(mq.matches)
			setCurrentIndex(0)
		}
		sync()
		mq.addEventListener('change', sync)
		return () => mq.removeEventListener('change', sync)
	}, [])

	useEffect(() => {
		const el = wrapRef.current
		if (!el) return
		const io = new IntersectionObserver(
			([entry]) => setInView(entry.isIntersecting),
			{ rootMargin: '100px 0px', threshold: 0.05 }
		)
		io.observe(el)
		return () => io.disconnect()
	}, [])

	useEffect(() => {
		if (!inView || activeSet.length <= 1) return
		const timer = setInterval(() => {
			setCurrentIndex(prev => (prev + 1) % activeSet.length)
		}, interval)
		return () => clearInterval(timer)
	}, [inView, activeSet.length, interval])

	useEffect(() => {
		if (!inView || activeSet.length <= 1) return
		const next = activeSet[(currentIndex + 1) % activeSet.length]
		const img = new Image()
		img.src = next.src
	}, [inView, currentIndex, activeSet])

	if (!current) return null

	return (
		<div ref={wrapRef}>
			<figure>
				<img
					key={`${isXl ? 'd' : 'm'}-${currentIndex}-${current.src}`}
					src={current.src}
					alt={current.alt}
					width={width}
					height={height}
					className={isXl ? desktopClassName : mobileClassName}
					loading={isXl ? 'eager' : 'lazy'}
					fetchPriority={isXl ? 'high' : 'auto'}
					decoding="async"
				/>
				<figcaption className="text-sm text-gray-600 mt-2 text-center">{current.alt}</figcaption>
			</figure>
		</div>
	)
}
