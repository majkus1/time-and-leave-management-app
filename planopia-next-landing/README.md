# Planopia Next.js Landing Pages

A modern, SEO-optimized landing page application built with Next.js 15 for Planopia - a free time tracking and leave management application.

## 🎯 Purpose

This Next.js application serves as the main landing pages for Planopia, providing:

- **Marketing pages** for both Polish and English markets
- **SEO-optimized content** for better search engine visibility
- **Blog articles** about time tracking and leave management
- **Contact forms** with email integration
- **Multi-language support** (Polish/English)

## 🚀 Technologies Used

### **Frontend Framework**
- **Next.js 15** - Latest version with App Router
- **React 19** - Latest React with improved performance
- **TypeScript** - Type-safe development

### **Styling & UI**
- **Tailwind CSS v4** - Modern utility-first CSS framework
- **Custom CSS** - Additional styling for specific components
- **Responsive Design** - Mobile-first approach

### **SEO & Performance**
- **Next.js Metadata API** - Built-in SEO optimization
- **Automatic Sitemap** - Generated sitemap.xml
- **Robots.txt** - Search engine directives
- **PWA Support** - Progressive Web App capabilities
- **Image Optimization** - Next.js automatic image optimization

### **Analytics & Tracking**
- **Google Tag Manager** - Advanced tracking and analytics
- **Google Analytics** - User behavior tracking
- **Schema.org** - Structured data for search engines

### **Backend Integration**
- **Next.js API Routes** - Serverless functions for forms
- **Nodemailer** - Email sending functionality
- **Axios** - HTTP client for API calls

### **Development Tools**
- **ESLint** - Code linting and quality
- **Turbopack** - Fast build system
- **TypeScript** - Static type checking

## ✨ Key Features

### **SEO Optimization**
- Comprehensive meta tags and Open Graph
- Structured data (Schema.org)
- Automatic sitemap generation
- Multi-language hreflang support
- Google Search Console integration

### **Performance**
- Static site generation (SSG)
- Image optimization and WebP/AVIF support
- Code splitting and lazy loading
- Compression and caching headers

### **User Experience**
- Responsive design for all devices
- Fast loading times
- Smooth animations and transitions
- Accessible navigation

### **Content Management**
- Blog system with multiple articles
- Multi-language content support
- Contact forms with email notifications
- Dynamic routing for blog posts

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout with SEO
│   ├── page.tsx           # Homepage (Polish)
│   ├── en/                # English version
│   ├── blog/              # Blog articles (Polish)
│   ├── en/blog/           # Blog articles (English)
│   └── api/               # API routes
├── components/            # React components
│   ├── ProductPromotion.tsx    # Main landing page (PL)
│   ├── ENProductPromotion.tsx  # Main landing page (EN)
│   ├── Blog*.tsx          # Blog components
│   └── GoogleAnalytics.tsx    # Analytics integration
└── config.js              # Configuration
```

## 🌐 Deployment

- **Platform:** Vercel (recommended)
- **Domain:** planopia.pl
- **SSL:** Automatic HTTPS
- **CDN:** Global edge network
- **Performance:** Optimized for Core Web Vitals

## 📊 SEO Benefits

- **Faster indexing** by search engines
- **Better rankings** for time tracking keywords
- **Multi-language SEO** for international reach
- **Rich snippets** in search results
- **Mobile-first indexing** ready

## 🔧 Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## 📈 Performance

- **Lighthouse Score:** 95+ across all metrics
- **Core Web Vitals:** All green
- **Loading Speed:** < 2 seconds
- **SEO Score:** 100/100

## 🌍 Multi-language Support

- **Polish (pl):** Primary language
- **English (en):** Secondary language
- **Automatic detection** based on URL
- **SEO-optimized** for both languages

---

Built with ❤️ for Planopia - Making time tracking simple and free.