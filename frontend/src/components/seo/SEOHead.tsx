import React from 'react'
import { Helmet } from 'react-helmet-async'

export interface SEOHeadProps {
  title?: string
  description?: string
  canonicalUrl?: string
  keywords?: string
  ogImage?: string
  ogType?: 'website' | 'article'
  noIndex?: boolean
  structuredData?: object
}

const DEFAULT_TITLE = 'EduFox (Contributed by FoxFord LC) — IELTS Preparation & Mock Exam Platform'
const DEFAULT_DESCRIPTION =
  'Practice official Cambridge IELTS Reading, Listening, Writing, and Speaking mock tests online with real-time AI scoring, diagnostic feedback, and SRS vocabulary building.'
const DEFAULT_IMAGE = 'https://edufox.uz/edufox_mascot.png'
const BASE_URL = 'https://edufox.uz'

export const SEOHead: React.FC<SEOHeadProps> = ({
  title,
  description = DEFAULT_DESCRIPTION,
  canonicalUrl,
  keywords,
  ogImage = DEFAULT_IMAGE,
  ogType = 'website',
  noIndex = false,
  structuredData,
}) => {
  const fullTitle = title ? `${title} | EduFox IELTS` : DEFAULT_TITLE
  const fullCanonical = canonicalUrl
    ? canonicalUrl.startsWith('http')
      ? canonicalUrl
      : `${BASE_URL}${canonicalUrl.startsWith('/') ? '' : '/'}${canonicalUrl}`
    : typeof window !== 'undefined'
    ? window.location.href.split('?')[0]
    : BASE_URL

  return (
    <Helmet>
      {/* Primary Title & Description */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={fullCanonical} />

      {/* Robots control */}
      {noIndex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta
          name="robots"
          content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
        />
      )}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={fullCanonical} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content="EduFox IELTS" />

      {/* Twitter Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullCanonical} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* JSON-LD Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  )
}

export default SEOHead
