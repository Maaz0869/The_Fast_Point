import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../context/StoreContext.jsx'

export default function HeroSlider() {
  const { slides } = useStore()
  const [current, setCurrent] = useState(0)
  const timer = useRef(null)

  const count = slides.length
  const goto = useCallback((i) => setCurrent(((i % count) + count) % count), [count])
  const next = useCallback(() => setCurrent((c) => (c + 1) % count), [count])

  // Auto-play — skipped for users who prefer reduced motion.
  useEffect(() => {
    if (count <= 1) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    timer.current = setInterval(next, 5000)
    return () => clearInterval(timer.current)
  }, [next, count])

  const pause = () => clearInterval(timer.current)
  const resume = () => {
    clearInterval(timer.current)
    if (count > 1) timer.current = setInterval(next, 5000)
  }

  if (!count) return null

  return (
    <section
      className="relative h-[70vh] min-h-[460px] w-full overflow-hidden"
      onMouseEnter={pause}
      onMouseLeave={resume}
    >
      {slides.map((slide, i) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-700 ${
            i === current ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
        >
          <img
            src={slide.image}
            alt={slide.heading}
            className="h-full w-full object-cover"
            loading={i === 0 ? 'eager' : 'lazy'}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
          <div className="section absolute inset-0 flex flex-col justify-center">
            <div
              className={`max-w-xl text-white ${i === current ? 'animate-slide-up' : ''}`}
              key={`${slide.id}-${current}`}
            >
              <span className="chip mb-4 bg-brand-500/90 text-white">Featured</span>
              <h1 className="font-display text-4xl font-extrabold leading-tight drop-shadow-lg sm:text-5xl lg:text-6xl">
                {slide.heading}
              </h1>
              <p className="mt-4 max-w-md text-base text-white/85 sm:text-lg">{slide.text}</p>
              <Link to={slide.buttonLink || '/menu'} className="btn-primary mt-7 text-base">
                {slide.buttonText || 'Order Now'} →
              </Link>
            </div>
          </div>
        </div>
      ))}

      {/* Dots */}
      <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-2">
        {slides.map((s, i) => (
          <button
            key={s.id}
            onClick={() => goto(i)}
            className={`h-2.5 rounded-full transition-all ${
              i === current ? 'w-8 bg-brand-500' : 'w-2.5 bg-white/60 hover:bg-white'
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>

      {/* Arrows */}
      {count > 1 && (
        <>
          <button
            onClick={() => goto(current - 1)}
            className="absolute left-4 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur transition hover:bg-white/40 sm:flex"
            aria-label="Previous slide"
          >
            ‹
          </button>
          <button
            onClick={() => goto(current + 1)}
            className="absolute right-4 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur transition hover:bg-white/40 sm:flex"
            aria-label="Next slide"
          >
            ›
          </button>
        </>
      )}
    </section>
  )
}
