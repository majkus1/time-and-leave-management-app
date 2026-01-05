'use client'

import { useState, useEffect } from 'react'

interface AnimatedBlogImagesProps {
	desktopImages: {
		src: string
		alt: string
	}[]
	mobileImages: {
		src: string
		alt: string
	}[]
	desktopClassName?: string
	mobileClassName?: string
	interval?: number
}

export default function AnimatedBlogImages({
	desktopImages,
	mobileImages,
	desktopClassName = 'rounded-xl w-full h-auto aspect-[4/2] shadow-lg mockup-blog-desktop',
	mobileClassName = 'rounded-xl shadow-xl ring-1 ring-black/5 mx-auto mockup-blog-mobile',
	interval = 5000
}: AnimatedBlogImagesProps) {
	const [currentIndex, setCurrentIndex] = useState(0)

	useEffect(() => {
		// Preload all images for smooth transitions
		const preloadImages = [...desktopImages, ...mobileImages].map(img => {
			const image = new Image()
			image.src = img.src
			return image
		})

		const timer = setInterval(() => {
			setCurrentIndex(prev => (prev + 1) % desktopImages.length)
		}, interval)

		return () => clearInterval(timer)
	}, [desktopImages, mobileImages, interval])

	const currentDesktop = desktopImages[currentIndex]
	const currentMobile = mobileImages[currentIndex]

	return (
		<>
			<figure>
				<img
					key={`desktop-${currentIndex}`}
					src={currentDesktop.src}
					alt={currentDesktop.alt}
					className={`${desktopClassName} animated-blog-image`}
					loading="eager"
					fetchPriority="high"
				/>
				<figcaption className="text-sm text-gray-600 mt-2 text-center figcaption-desktop">
					{currentDesktop.alt}
				</figcaption>
			</figure>
			<figure>
				<img
					key={`mobile-${currentIndex}`}
					src={currentMobile.src}
					alt={currentMobile.alt}
					className={`${mobileClassName} animated-blog-image`}
					loading="eager"
					fetchPriority="high"
				/>
				<figcaption className="text-sm text-gray-600 mt-2 text-center figcaption-mobile">
					{currentMobile.alt}
				</figcaption>
			</figure>
		</>
	)
}
