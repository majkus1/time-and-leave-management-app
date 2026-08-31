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

    // Commercial landing pages (transactional intent)
    {
      url: 'https://planopia.pl/program-do-urlopow',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: 'https://planopia.pl/en/leave-management-software',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.85,
    },
    {
      url: 'https://planopia.pl/program-do-ewidencji-czasu-pracy',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: 'https://planopia.pl/en/time-tracking-software',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.85,
    },

    // Industry landings
	{
	  url: 'https://planopia.pl/dla-gastronomii',
	  lastModified: new Date('2026-07-17'),
	  changeFrequency: 'monthly',
	  priority: 0.85,
	},
	{
	  url: 'https://planopia.pl/dla-firm-sprzatajacych',
	  lastModified: new Date('2026-07-17'),
	  changeFrequency: 'monthly',
	  priority: 0.85,
	},
    {
      url: 'https://planopia.pl/dla-branzy-budowlanej',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.85,
    },
    {
      url: 'https://planopia.pl/en/for-construction-industry',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.85,
    },

    // Grafiki pracy — modul platny (59 zl/mies), do tej pory bez wlasnej strony
    {
      url: 'https://planopia.pl/program-do-grafikow-pracy',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: 'https://planopia.pl/en/work-schedule-software',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.85,
    },

    // Rejestracja QR / lista obecnosci — modul platny (39 zl/mies)
    {
      url: 'https://planopia.pl/rejestracja-czasu-pracy-qr',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: 'https://planopia.pl/en/qr-time-clocking',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.85,
    },

    // Nadgodziny — czesc wpisu dziennego, dziala takze w planie bezplatnym
    {
      url: 'https://planopia.pl/ewidencja-nadgodzin',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: 'https://planopia.pl/en/overtime-tracking',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.85,
    },

    // Kalendarz swiat 2027 — rocznik, ktorego wczesniej nie bylo
    {
      url: 'https://planopia.pl/blog/dni-wolne-2027',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },

    // Klaster grafikow — do tej pory najslabiej pokryty temat na blogu
    {
      url: 'https://planopia.pl/blog/jak-ulozyc-grafik-pracy',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },

    // Strona autora — sygnal E-E-A-T dla tresci o prawie pracy
    {
      url: 'https://planopia.pl/o-autorze',
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },

    // Contact — druga sciezka konwersji obok samoobslugowej rejestracji
    {
      url: 'https://planopia.pl/kontakt',
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.7,
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
	  url: 'https://planopia.pl/blog/urlop-wypoczynkowy-ile-dni',
	  lastModified: new Date('2026-08-02'),
	  changeFrequency: 'monthly',
	  priority: 0.82,
	},
	{
	  url: 'https://planopia.pl/blog/l4-na-urlopie-wypoczynkowym',
	  lastModified: new Date('2026-08-03'),
	  changeFrequency: 'monthly',
	  priority: 0.82,
	},
	{
	  url: 'https://planopia.pl/blog/urlopy-i-dni-wolne-dla-pracownikow',
	  lastModified: new Date('2026-08-18'),
	  changeFrequency: 'monthly',
	  priority: 0.82,
	},
	{
	  url: 'https://planopia.pl/blog/plan-urlopow-2027-excel-pdf',
	  lastModified: new Date('2026-08-19'),
	  changeFrequency: 'weekly',
	  priority: 0.9,
	},
	{
	  url: 'https://planopia.pl/blog/ewidencja-czasu-pracy-excel-wzor',
	  lastModified: new Date('2026-08-19'),
	  changeFrequency: 'monthly',
	  priority: 0.88,
	},
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
      url: 'https://planopia.pl/blog/asystent-ai-planopia-ewidencja-urlopy-zadania-grafik',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.82,
    },
    {
      url: 'https://planopia.pl/en/blog/planopia-ai-assistant-time-tracking-leave-tasks-schedules',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.82,
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
    
    // Blog articles - High priority (PWA installation guide)
    {
      url: 'https://planopia.pl/blog/jak-zainstalowac-planopie-jako-pwa',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://planopia.pl/en/blog/how-to-install-planopia-as-pwa',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },

    // Blog — video tutorials / user guide
    {
      url: 'https://planopia.pl/jak-korzystac',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.85,
    },
    {
      url: 'https://planopia.pl/en/how-to-use',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.85,
    },

    // Blog — construction / budowlanka
	{
	  url: 'https://planopia.pl/blog/jak-ulozyc-grafik-pracy-w-restauracji',
	  lastModified: new Date('2026-07-17'),
	  changeFrequency: 'monthly',
	  priority: 0.82,
	},
	{
	  url: 'https://planopia.pl/blog/jak-zarzadzac-firma-sprzatajaca',
	  lastModified: new Date('2026-07-17'),
	  changeFrequency: 'monthly',
	  priority: 0.82,
	},
    {
      url: 'https://planopia.pl/blog/jak-prowadzic-ewidencje-czasu-pracy-na-budowie',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.82,
    },
    {
      url: 'https://planopia.pl/en/blog/time-tracking-on-construction-sites',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.82,
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

    // Blog — leave software for small business (supporting cluster article)
    {
      url: 'https://planopia.pl/blog/program-do-urlopow-dla-malej-firmy',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.75,
    },

    // Blog — annual leave Excel/PDF vs app (GSC pillar)
    {
      url: 'https://planopia.pl/blog/roczny-plan-urlopow-excel-pdf-aplikacja',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.77,
    },
    {
      url: 'https://planopia.pl/en/blog/annual-leave-plan-excel-pdf-app',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.77,
    },
    
    // Legal documents - Polish
    {
      url: 'https://planopia.pl/terms',
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: 'https://planopia.pl/privacy',
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: 'https://planopia.pl/dpa',
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: 'https://planopia.pl/reklamacje',
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.55,
    },
    
    // Legal documents - English
    {
      url: 'https://planopia.pl/en/terms',
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: 'https://planopia.pl/en/privacy',
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: 'https://planopia.pl/en/dpa',
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: 'https://planopia.pl/en/complaints',
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.55,
    },
  ]
}
