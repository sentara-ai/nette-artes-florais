/* ================================================================
   Nette Artes Florais — Main Script
   Pure vanilla JS · No dependencies · ES2020+
   ================================================================ */

;(function () {
  'use strict'

  /* ---------- constants ---------- */
  var WA = '5511993238938'
  var STORAGE_KEY = 'nette_favorites'
  var SCROLL_THRESHOLD = 60

  /* ---------- helpers ---------- */
  var qs = function (s, p) { return (p || document).querySelector(s) }
  var qsa = function (s, p) { return [].slice.call((p || document).querySelectorAll(s)) }
  var on = function (el, ev, fn, o) { if (el) el.addEventListener(ev, fn, o) }

  function addClass(el, c) { if (el) el.classList.add(c) }
  function removeClass(el, c) { if (el) el.classList.remove(c) }
  function toggleClass(el, c, f) { if (el) el.classList.toggle(c, f) }
  function hasClass(el, c) { return el && el.classList.contains(c) }

  /* ---------- throttle ---------- */
  function throttle(fn, ms) {
    var last = 0
    return function () {
      var now = Date.now()
      if (now - last >= ms) { last = now; fn.apply(this, arguments) }
    }
  }

  /* =================================================================
     NAV — scroll state + hamburger menu
     ================================================================= */
  function initNav() {
    var nav = qs('.nav')
    var burger = qs('.hamburger')
    var overlay = qs('.mobile-overlay')
    var mobileMenu = qs('.mobile-menu')
    if (!nav) return

    /* scroll state */
    var onScroll = throttle(function () {
      toggleClass(nav, 'scrolled', window.scrollY > SCROLL_THRESHOLD)
    }, 100)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()

    /* hamburger */
    function openMenu() {
      addClass(mobileMenu, 'open')
      addClass(overlay, 'visible')
      addClass(document.body, 'body-locked')
      addClass(burger, 'open')
      if (burger) burger.setAttribute('aria-expanded', 'true')
      var first = qs('a', mobileMenu)
      if (first) first.focus()
    }

    function closeMenu() {
      removeClass(mobileMenu, 'open')
      removeClass(overlay, 'visible')
      removeClass(document.body, 'body-locked')
      removeClass(burger, 'open')
      if (burger) burger.setAttribute('aria-expanded', 'false')
    }

    on(burger, 'click', function () {
      hasClass(mobileMenu, 'open') ? closeMenu() : openMenu()
    })
    on(overlay, 'click', closeMenu)

    on(document, 'keydown', function (e) {
      if (e.key === 'Escape' && hasClass(mobileMenu, 'open')) closeMenu()
    })

    qsa('.mobile-menu a').forEach(function (a) {
      on(a, 'click', closeMenu)
    })
  }

  /* =================================================================
     LAZY LOADING — IntersectionObserver
     ================================================================= */
  function initLazyLoad() {
    var images = qsa('img[data-src]')
    if (!images.length) return

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var img = entry.target
            img.src = img.dataset.src
            img.removeAttribute('data-src')
            on(img, 'load', function () {
              addClass(img, 'loaded')
              addClass(img.closest('.gallery-item') || img.parentElement, 'img-loaded')
            })
            io.unobserve(img)
          }
        })
      }, { rootMargin: '200px 0px', threshold: 0.01 })
      images.forEach(function (img) { io.observe(img) })
    } else {
      images.forEach(function (img) {
        img.src = img.dataset.src
        img.removeAttribute('data-src')
        addClass(img, 'loaded')
      })
    }
  }

  /* =================================================================
     SCROLL REVEAL — CSS class: .reveal → .visible
     ================================================================= */
  function initScrollReveal() {
    var els = qsa('.reveal')
    if (!els.length) return

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            addClass(entry.target, 'visible')
            io.unobserve(entry.target)
          }
        })
      }, { rootMargin: '-60px 0px', threshold: 0.1 })
      els.forEach(function (el) { io.observe(el) })
    } else {
      els.forEach(function (el) { addClass(el, 'visible') })
    }
  }

  /* =================================================================
     FAVORITES — localStorage
     ================================================================= */
  function getFavorites() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [] }
    catch (e) { return [] }
  }

  function saveFavorites(favs) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(favs)) } catch (e) {}
  }

  function toggleFavorite(imageId) {
    var favs = getFavorites()
    var idx = favs.indexOf(imageId)
    if (idx >= 0) {
      favs.splice(idx, 1)
      showToast('Removido dos favoritos')
    } else {
      favs.push(imageId)
      showToast('Adicionado aos favoritos ♥')
    }
    saveFavorites(favs)
    updateAllHearts()
    return favs.includes(imageId)
  }

  function updateAllHearts() {
    var favs = getFavorites()
    qsa('[data-fav-id]').forEach(function (btn) {
      var id = btn.getAttribute('data-fav-id')
      toggleClass(btn, 'favorited', favs.includes(id))
      btn.setAttribute('aria-label', favs.includes(id) ? 'Remover dos favoritos' : 'Adicionar aos favoritos')
    })
  }

  /* =================================================================
     LIGHTBOX — matches .lightbox CSS classes
     ================================================================= */
  var lightboxData = []
  var lightboxIndex = 0
  var touchStartX = 0
  var touchStartY = 0

  function initLightbox() {
    var lb = qs('.lightbox')
    if (!lb) return

    var img = qs('.lightbox-image', lb)
    var counter = qs('.lightbox-counter', lb)
    var closeBtn = qs('.lightbox-close', lb)
    var prevBtn = qs('.lightbox-prev', lb)
    var nextBtn = qs('.lightbox-next', lb)
    var favBtn = qs('.lightbox-btn-fav', lb)
    var shareBtn = qs('.lightbox-btn-share', lb)
    var waBtn = qs('.lightbox-btn-whatsapp', lb)

    function buildData() {
      lightboxData = []
      qsa('.gallery-item').forEach(function (item) {
        var imgEl = qs('img', item)
        if (!imgEl) return
        lightboxData.push({
          src: imgEl.dataset.src || imgEl.src,
          alt: imgEl.alt || '',
          id: item.getAttribute('data-image-id') || imgEl.dataset.src || imgEl.src
        })
      })
    }

    function open(idx) {
      if (!lightboxData.length) buildData()
      lightboxIndex = idx
      update()
      addClass(lb, 'active')
      addClass(document.body, 'body-locked')
      lb.setAttribute('aria-hidden', 'false')
      if (closeBtn) closeBtn.focus()
    }

    function close() {
      removeClass(lb, 'active')
      removeClass(document.body, 'body-locked')
      lb.setAttribute('aria-hidden', 'true')
    }

    function update() {
      var data = lightboxData[lightboxIndex]
      if (!data) return

      var preload = new Image()
      preload.onload = function () {
        img.src = data.src
        img.alt = data.alt
      }
      preload.src = data.src

      if (counter) counter.textContent = (lightboxIndex + 1) + ' / ' + lightboxData.length

      if (favBtn) {
        favBtn.setAttribute('data-fav-id', data.id)
        toggleClass(favBtn, 'favorited', getFavorites().includes(data.id))
      }

      if (prevBtn) prevBtn.style.display = lightboxIndex === 0 ? 'none' : ''
      if (nextBtn) nextBtn.style.display = lightboxIndex === lightboxData.length - 1 ? 'none' : ''

      // preload adjacent
      ;[-1, 1].forEach(function (d) {
        var item = lightboxData[lightboxIndex + d]
        if (item) { new Image().src = item.src }
      })
    }

    function prev() { if (lightboxIndex > 0) { lightboxIndex--; update() } }
    function next() { if (lightboxIndex < lightboxData.length - 1) { lightboxIndex++; update() } }

    /* --- event bindings --- */
    on(document, 'click', function (e) {
      var item = e.target.closest('.gallery-item')
      if (!item) return
      if (e.target.closest('.btn-icon')) return
      e.preventDefault()
      buildData()
      var id = item.getAttribute('data-image-id') || (qs('img', item) ? (qs('img', item).dataset.src || qs('img', item).src) : '')
      var idx = -1
      for (var i = 0; i < lightboxData.length; i++) {
        if (lightboxData[i].id === id) { idx = i; break }
      }
      open(idx >= 0 ? idx : 0)
    })

    on(closeBtn, 'click', close)
    on(prevBtn, 'click', prev)
    on(nextBtn, 'click', next)

    on(lb, 'click', function (e) {
      if (e.target === lb) close()
    })

    on(document, 'keydown', function (e) {
      if (!hasClass(lb, 'active')) return
      if (e.key === 'Escape') close()
      else if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'ArrowRight') next()
    })

    on(lb, 'touchstart', function (e) {
      touchStartX = e.changedTouches[0].clientX
      touchStartY = e.changedTouches[0].clientY
    }, { passive: true })

    on(lb, 'touchend', function (e) {
      var dx = e.changedTouches[0].clientX - touchStartX
      var dy = e.changedTouches[0].clientY - touchStartY
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
        dx > 0 ? prev() : next()
      }
    }, { passive: true })

    on(favBtn, 'click', function () {
      var id = this.getAttribute('data-fav-id')
      if (id) toggleFavorite(id)
    })

    on(shareBtn, 'click', function () {
      shareItem(lightboxData[lightboxIndex])
    })

    on(waBtn, 'click', function () {
      var data = lightboxData[lightboxIndex]
      var msg = encodeURIComponent(
        'Olá, Nette! Gostei deste arranjo e gostaria de saber mais: ' +
        window.location.href
      )
      window.open('https://wa.me/' + WA + '?text=' + msg, '_blank')
    })
  }

  /* =================================================================
     SHARE — Web Share API + clipboard fallback
     ================================================================= */
  function shareItem(data) {
    var url = window.location.href.split('#')[0]
    var shareData = {
      title: 'Nette Artes Florais',
      text: 'Veja este lindo arranjo floral da Nette! 🌸',
      url: url
    }

    if (navigator.share) {
      navigator.share(shareData).catch(function () {})
    } else if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(function () {
        showToast('Link copiado! 📋')
      }).catch(function () { fallbackCopy(url) })
    } else {
      fallbackCopy(url)
    }
  }

  function fallbackCopy(text) {
    var ta = document.createElement('textarea')
    ta.value = text
    ta.style.cssText = 'position:fixed;opacity:0'
    document.body.appendChild(ta)
    ta.select()
    try { document.execCommand('copy'); showToast('Link copiado! 📋') }
    catch (e) { showToast('Não foi possível copiar') }
    document.body.removeChild(ta)
  }

  /* =================================================================
     GALLERY ICON BUTTONS (fav + share on hover overlay)
     ================================================================= */
  function initGalleryButtons() {
    on(document, 'click', function (e) {
      var favBtn = e.target.closest('.btn-icon[data-fav-id]')
      if (favBtn) {
        e.stopPropagation()
        e.preventDefault()
        toggleFavorite(favBtn.getAttribute('data-fav-id'))
        return
      }

      var shareBtn = e.target.closest('.btn-icon.share-btn')
      if (shareBtn) {
        e.stopPropagation()
        e.preventDefault()
        shareItem({ alt: 'Arranjo floral' })
      }
    })
    updateAllHearts()
  }

  /* =================================================================
     TOAST — CSS class: .toast → .visible
     ================================================================= */
  var toastTimeout
  function showToast(message) {
    var toast = qs('.toast')
    if (!toast) {
      toast = document.createElement('div')
      toast.className = 'toast'
      toast.setAttribute('role', 'status')
      toast.setAttribute('aria-live', 'polite')
      document.body.appendChild(toast)
    }
    clearTimeout(toastTimeout)
    toast.textContent = message
    addClass(toast, 'visible')
    toastTimeout = setTimeout(function () {
      removeClass(toast, 'visible')
    }, 2500)
  }

  /* =================================================================
     BACK TO TOP
     ================================================================= */
  function initBackToTop() {
    var btn = qs('.back-to-top')
    if (!btn) return

    window.addEventListener('scroll', throttle(function () {
      toggleClass(btn, 'visible', window.scrollY > 400)
    }, 150), { passive: true })

    on(btn, 'click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    })
  }

  /* =================================================================
     SMOOTH SCROLL
     ================================================================= */
  function initSmoothScroll() {
    qsa('a[href^="#"]').forEach(function (a) {
      on(a, 'click', function (e) {
        var id = this.getAttribute('href')
        if (id === '#' || id.length < 2) return
        var target = qs(id)
        if (!target) return
        e.preventDefault()
        var top = target.getBoundingClientRect().top + window.scrollY - 80
        window.scrollTo({ top: top, behavior: 'smooth' })
      })
    })
  }

  /* =================================================================
     ACTIVE NAV LINK
     ================================================================= */
  function initActiveNav() {
    var path = window.location.pathname
    var filename = path.split('/').pop() || 'index.html'
    if (filename === '') filename = 'index.html'

    qsa('.nav-links a, .mobile-menu a').forEach(function (a) {
      var href = a.getAttribute('href')
      if (!href) return
      var linkFile = href.split('/').pop().split('#')[0] || 'index.html'
      if (linkFile === filename) addClass(a, 'active')
    })
  }

  /* =================================================================
     HERO PARALLAX (subtle)
     ================================================================= */
  function initParallax() {
    var hero = qs('.hero')
    if (!hero) return
    window.addEventListener('scroll', throttle(function () {
      if (window.scrollY < window.innerHeight) {
        hero.style.setProperty('--parallax-y', (window.scrollY * 0.3) + 'px')
      }
    }, 16), { passive: true })
  }

  /* =================================================================
     COUNTER ANIMATION
     ================================================================= */
  function initCounters() {
    var counters = qsa('[data-count-to]')
    if (!counters.length) return

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return
          var el = entry.target
          var to = parseInt(el.getAttribute('data-count-to'), 10)
          animateCount(el, 0, to, 1500)
          io.unobserve(el)
        })
      }, { threshold: 0.5 })
      counters.forEach(function (c) { io.observe(c) })
    }
  }

  function animateCount(el, from, to, duration) {
    var start = performance.now()
    function tick(now) {
      var p = Math.min((now - start) / duration, 1)
      var eased = 1 - Math.pow(1 - p, 3)
      el.textContent = Math.round(from + (to - from) * eased) + '+'
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }

  /* =================================================================
     IMAGE ERROR HANDLING
     ================================================================= */
  function initImageErrors() {
    qsa('.gallery-item img, .category-card img').forEach(function (img) {
      on(img, 'error', function () {
        this.style.opacity = '0.3'
        addClass(this.closest('.gallery-item') || this.parentElement, 'img-error')
      })
    })
  }

  /* =================================================================
     PRINT
     ================================================================= */
  function initPrint() {
    if (!window.matchMedia) return
    window.matchMedia('print').addEventListener('change', function (e) {
      if (e.matches) {
        qsa('img[data-src]').forEach(function (img) { img.src = img.dataset.src })
      }
    })
  }

  /* =================================================================
     PREFETCH pages on link hover
     ================================================================= */
  function initPrefetch() {
    var done = {}
    qsa('a[href$=".html"]').forEach(function (link) {
      on(link, 'mouseenter', function () {
        var h = this.getAttribute('href')
        if (done[h]) return
        done[h] = true
        var el = document.createElement('link')
        el.rel = 'prefetch'
        el.href = h
        document.head.appendChild(el)
      }, { once: true })
    })
  }

  /* =================================================================
     FOCUS VISIBLE
     ================================================================= */
  function initFocusVisible() {
    on(document, 'keydown', function (e) {
      if (e.key === 'Tab') addClass(document.body, 'keyboard-nav')
    })
    on(document, 'mousedown', function () {
      removeClass(document.body, 'keyboard-nav')
    })
  }

  /* =================================================================
     INIT
     ================================================================= */
  function init() {
    initNav()
    initLazyLoad()
    initScrollReveal()
    initLightbox()
    initGalleryButtons()
    initBackToTop()
    initSmoothScroll()
    initActiveNav()
    initParallax()
    initCounters()
    initImageErrors()
    initPrint()
    initPrefetch()
    initFocusVisible()
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})()
