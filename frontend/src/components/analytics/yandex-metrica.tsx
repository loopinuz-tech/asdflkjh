import { useEffect, Suspense } from 'react'
import { useLocation } from 'react-router-dom'

const METRICA_ID = import.meta.env.VITE_YANDEX_METRICA_ID

function trackPageView(url: string) {
  if (typeof window !== 'undefined' && (window as any).ym && METRICA_ID) {
    (window as any).ym(METRICA_ID, 'hit', url)
  }
}

function YandexMetricaContent() {
  const { pathname, search } = useLocation()

  useEffect(() => {
    if (pathname && METRICA_ID) {
      const url = search ? `${pathname}${search}` : pathname
      trackPageView(url)
    }
  }, [pathname, search])

  useEffect(() => {
    if (!METRICA_ID) return

    // Inject Yandex Metrica script
    const script = document.createElement('script')
    script.innerHTML = `
      (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
      m[i].l=1*new Date();
      for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
      k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
      (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
      ym('${METRICA_ID}', "init", {
        defer: true,
        clickmap: true,
        trackLinks: true,
        accurateTrackBounce: true,
        webvisor: true
      });
    `
    document.head.appendChild(script)
  }, [])

  if (!METRICA_ID) return null
  return null
}

export default function YandexMetrica() {
  return (
    <Suspense fallback={null}>
      <YandexMetricaContent />
    </Suspense>
  )
}
