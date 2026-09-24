/**
 * The card carousel shared by Lawyer Cards and Case Results.
 *
 * Cards are repeated in the DOM so the track can always scroll forward; the
 * copies render hidden and are revealed only when the real cards don't all
 * fit, so they never flash before this runs and the block degrades to a plain
 * row with no JS at all.
 *
 * Markup contract:
 *   [data-card-carousel]        root, with data-count = number of real cards
 *     [data-card-carousel-track]  the scroller, real cards then copies
 *     [data-card-carousel-dots]   empty container, filled here
 *
 * Add data-card-carousel-wrap to the root to let a two-up tablet row wrap into
 * a second row before it becomes a carousel.
 *
 * data-autoplay="true" plus data-interval (seconds) advances a page at a time
 * on its own.
 */

/** Guards against double-binding when more than one component imports this. */
const started = new WeakSet<HTMLElement>()

export function initCardCarousels(scope: ParentNode = document) {
  scope.querySelectorAll<HTMLElement>('[data-card-carousel]').forEach((root) => {
    if (started.has(root)) return
    started.add(root)

    const track = root.querySelector<HTMLElement>('[data-card-carousel-track]')
    const dotsBox = root.querySelector<HTMLElement>('[data-card-carousel-dots]')
    if (!track || !dotsBox) return

    const slides = Array.from(track.children) as HTMLElement[]
    // How many cards there really are; anything past this is a copy.
    const count = Number(root.dataset.count) || slides.length
    const canLoop = slides.length > count
    // Opt in to the two-row tablet layout; without it, tablet carousels.
    const wrapRows = root.hasAttribute('data-card-carousel-wrap')
    /**
     * Opt-in: on phones, show every card stacked instead of paging through
     * them. Keyed off the same 767px breakpoint global.css uses for one card
     * per view, rather than off the measured count — a one-column block at
     * desktop also measures one per view, and that should still carousel.
     */
    const stackMobileAttr = root.hasAttribute('data-card-carousel-stack-mobile')
    const phone = window.matchMedia('(max-width: 767px)')
    if (slides.length === 0) return

    const autoPlay = root.dataset.autoplay === 'true'
    const intervalMs = Math.max(2, Number(root.dataset.interval) || 5) * 1000
    // Someone who has asked the OS for less motion should not get a carousel
    // that moves on its own; the dots and swiping still work.
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let current = 0
    let pages = 1
    let perView = 1

    let timer: number | undefined
    let paused = false

    const offsetOf = (index: number) =>
      slides[Math.min(index, slides.length - 1)]!.offsetLeft - track.offsetLeft

    function stopAuto() {
      if (timer !== undefined) window.clearInterval(timer)
      timer = undefined
    }

    /**
     * Restarted from layout(), because whether there is anything to advance
     * through depends on the breakpoint: a block that carousels at 3-up may
     * fit on one page at 1-up, and then the timer would just fight the reader.
     */
    function startAuto() {
      stopAuto()
      if (!autoPlay || reduceMotion || paused || pages < 2) return
      timer = window.setInterval(() => goTo(current + perView), intervalMs)
    }

    /** Measured, not assumed: the width comes from CSS and changes per breakpoint. */
    function measurePerView() {
      const card = slides[0]!.getBoundingClientRect().width
      const gap = parseFloat(getComputedStyle(track!).columnGap || '0') || 0
      if (card <= 0) return 1
      return Math.max(1, Math.round((track!.clientWidth + gap) / (card + gap)))
    }

    function paint() {
      const active = Math.floor(current / perView) % pages
      Array.from(dotsBox!.children).forEach((dot, i) => {
        const on = i === active
        dot.classList.toggle('w-6', on)
        dot.classList.toggle('bg-primary', on)
        dot.classList.toggle('w-2', !on)
        dot.classList.toggle('bg-border', !on)
      })
    }

    /**
     * Recomputed whenever the visible card count can change. When every card
     * fits at once there is nothing to page through: the dots go away, the
     * copies are hidden and the track stops scrolling, so it behaves like a
     * plain row instead of a carousel that can be swiped off its only page.
     */
    function layout() {
      perView = measurePerView()

      /**
       * By default a block carousels as soon as the cards outgrow a single
       * row, at every width. With data-card-carousel-wrap, two-up (tablet)
       * instead takes a second row first, so four cards read as a 2x2 block
       * rather than a page with one card hidden off-screen.
       */
      const capacity = wrapRows && perView === 2 ? perView * 2 : perView
      const stackMobile = stackMobileAttr && phone.matches
      const fits = stackMobile || count <= capacity
      pages = fits ? 1 : Math.max(1, Math.ceil(count / perView))

      slides.slice(count).forEach((copy) => {
        copy.hidden = fits
      })
      /**
       * Wrapping is only ever wanted for the opt-in two-row tablet layout, so
       * it is tied to that and not to `fits`. Left on whenever everything fit,
       * it survived into the next breakpoint until the resize handler caught
       * up — which is what made a narrowing window flash a wrapped second row
       * before becoming a carousel.
       */
      // Stacked phones wrap too: at 100% wide, wrapping is what puts each
      // card on its own row.
      const wrapping = stackMobile || (wrapRows && fits && perView === 2)
      track!.style.flexWrap = wrapping ? 'wrap' : 'nowrap'
      track!.style.overflowX = wrapping ? 'hidden' : 'auto'
      if (fits) {
        current = 0
        track!.scrollTo({left: 0, behavior: 'instant'})
      }

      dotsBox!.replaceChildren()
      dotsBox!.hidden = fits
      if (fits) {
        startAuto()
        return
      }
      for (let i = 0; i < pages; i++) {
        const dot = document.createElement('button')
        dot.type = 'button'
        dot.className = 'h-2 w-2 rounded-full bg-border transition-all'
        dot.setAttribute('aria-label', `Go to slide ${i + 1}`)
        dot.addEventListener('click', () => goTo(i * perView))
        dotsBox!.append(dot)
      }
      paint()
      startAuto()
    }

    /**
     * Once a smooth scroll into the copies has settled, jump instantly to the
     * identical real card. It looks the same, so the seam is invisible — that
     * is what makes the loop endless. The jumps say 'instant', not 'auto':
     * 'auto' follows the track's CSS scroll-behavior, and if that is ever
     * smooth the jump becomes a visible scroll back to the start.
     */
    function settle(then: () => void) {
      if ('onscrollend' in window) track!.addEventListener('scrollend', then, {once: true})
      else setTimeout(then, 500)
    }

    function normalize(target: number) {
      current = ((target % count) + count) % count
      if (target !== current) track!.scrollTo({left: offsetOf(current), behavior: 'instant'})
      paint()
    }

    function goTo(index: number) {
      if (!canLoop) {
        current = Math.max(0, Math.min(index, count - perView))
        track!.scrollTo({left: offsetOf(current), behavior: 'smooth'})
        paint()
        return
      }

      if (index < 0) {
        // Nothing exists to the left of the first card, so hop to its copy a
        // full set ahead and animate left from there instead.
        const from = current + count
        track!.scrollTo({left: offsetOf(from), behavior: 'instant'})
        const target = from + (index - current)
        requestAnimationFrame(() => {
          track!.scrollTo({left: offsetOf(target), behavior: 'smooth'})
          settle(() => normalize(target))
        })
        current = ((index % count) + count) % count
        paint()
        return
      }

      track!.scrollTo({left: offsetOf(index), behavior: 'smooth'})
      current = index % count
      paint()
      settle(() => normalize(index))
    }

    // A swipe moves the track without going through goTo, so read the position
    // back and keep the dots — and the loop — in step.
    let scrollTimer: number | undefined
    track.addEventListener('scroll', () => {
      window.clearTimeout(scrollTimer)
      scrollTimer = window.setTimeout(() => {
        if (pages < 2) return
        const nearest = slides.reduce(
          (best, _, i) =>
            Math.abs(offsetOf(i) - track.scrollLeft) < Math.abs(offsetOf(best) - track.scrollLeft)
              ? i
              : best,
          0,
        )
        if (canLoop && nearest >= count) normalize(nearest)
        else {
          current = nearest
          paint()
        }
      }, 120)
    })

    if (autoPlay && !reduceMotion) {
      const pause = () => {
        paused = true
        stopAuto()
      }
      const resume = () => {
        paused = false
        startAuto()
      }
      // A background interval just fights the reader's scroll position, and
      // moving the cards out from under a pointer or a keyboard focus is worse
      // than not moving at all.
      root.addEventListener('mouseenter', pause)
      root.addEventListener('mouseleave', resume)
      root.addEventListener('focusin', pause)
      root.addEventListener('focusout', resume)
      document.addEventListener('visibilitychange', () =>
        document.hidden ? pause() : resume(),
      )
    }

    layout()

    /**
     * The number of visible cards changes with the breakpoint, so the number of
     * dots does too. Recomputed on the next frame rather than after a delay:
     * the card widths change the instant the media query flips, so anything
     * slower leaves the track laid out for the width it just left.
     */
    let queued = false
    const relayout = () => {
      if (queued) return
      queued = true
      requestAnimationFrame(() => {
        queued = false
        layout()
      })
    }
    window.addEventListener('resize', relayout)
  })
}
