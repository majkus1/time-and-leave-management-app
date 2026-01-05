import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    // Main pages
    {
      url: 'https://planopia.pl',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      url: 'https://planopia.pl/en',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    
    // Blog main pages
    {
      url: 'https://planopia.pl/blog',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: 'https://planopia.pl/en/blog',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    
    // Blog articles - High priority (holidays 2026)
    {
      url: 'https://planopia.pl/blog/dni-wolne-2026',
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.8,
    },
    
    // Blog articles - High priority (new free app articles)
    {
      url: 'https://planopia.pl/blog/darmowa-aplikacja-do-ewidencji-czasu-pracy',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://planopia.pl/en/blog/free-time-tracking-app',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    
    // Blog articles - High priority (electronic time tracking)
    {
      url: 'https://planopia.pl/blog/elektroniczna-ewidencja-czasu-pracy',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://planopia.pl/en/blog/electronic-time-tracking',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    
    // Blog articles - High priority (leave management)
    {
      url: 'https://planopia.pl/blog/zarzadzanie-urlopami',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://planopia.pl/en/blog/leave-management',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    
    // Blog articles - High priority (comprehensive company management app)
    {
      url: 'https://planopia.pl/blog/kompleksowa-aplikacja-do-zarzadzania-firma',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://planopia.pl/en/blog/comprehensive-company-management-app',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    
    // Blog articles - Medium priority
    {
      url: 'https://planopia.pl/blog/ewidencja-czasu-pracy-online',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: 'https://planopia.pl/en/blog/time-tracking-online',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: 'https://planopia.pl/blog/planowanie-urlopow',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: 'https://planopia.pl/en/blog/leave-planning',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ]
}