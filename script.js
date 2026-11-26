const root = document.documentElement;
try {
  const saved = localStorage.getItem('theme');
  if (saved) root.dataset.theme = saved;
  else if (matchMedia('(prefers-color-scheme: dark)').matches) root.dataset.theme = 'dark';
} catch (e) {}

document.querySelector('.theme-btn').addEventListener('click', () => {
  const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
  root.dataset.theme = next;
  try { localStorage.setItem('theme', next); } catch (e) {}
});

const menu = document.getElementById('menu');
const menuBtn = document.querySelector('.menu-btn');
menuBtn.addEventListener('click', () => {
  const open = menu.classList.toggle('open');
  menuBtn.setAttribute('aria-expanded', open);
});

const io = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

document.querySelectorAll('.year').forEach(el => el.textContent = new Date().getFullYear());

// Work page filters
const fbtns = document.querySelectorAll('.filters button');
if (fbtns.length) {
  const tiles = document.querySelectorAll('.tile');
  const empty = document.querySelector('.empty');
  fbtns.forEach(b => b.addEventListener('click', () => {
    fbtns.forEach(x => x.classList.toggle('on', x === b));
    const f = b.dataset.f;
    let shown = 0;
    tiles.forEach(t => {
      const ok = f === 'all' || t.dataset.cat.split(' ').includes(f);
      t.hidden = !ok;
      if (ok) shown++;
    });
    // first visible tile becomes the wide feature tile
    tiles.forEach(t => t.classList.remove('feature'));
    const first = [...tiles].find(t => !t.hidden);
    if (first && f === 'all') first.classList.add('feature');
    empty.hidden = shown > 0;
    tiles.forEach(t => { if (!t.hidden) { t.classList.remove('in'); void t.offsetWidth; t.classList.add('in'); } });
  }));
}

// Click a project with a real image -> open the full image in a lightbox
(() => {
  const links = document.querySelectorAll('.tile[data-full]');
  if (!links.length) return;
  const box = document.createElement('div');
  box.className = 'lightbox';
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  box.innerHTML = '<button class="lb-close" aria-label="Close">×</button><p class="lb-title"></p><img alt="">';
  document.body.appendChild(box);
  const img = box.querySelector('img'), title = box.querySelector('.lb-title'), closeBtn = box.querySelector('.lb-close');
  let last = null;
  const open = a => {
    last = a;
    img.src = a.dataset.full;
    img.alt = a.dataset.title || 'Project image';
    img.style.maxHeight = a.dataset.fit ? 'calc(100vh - 150px)' : '';
    title.textContent = a.dataset.title || '';
    box.scrollTop = 0;
    box.classList.add('open');
    document.body.classList.add('lb-lock');
    closeBtn.focus();
  };
  const close = () => {
    box.classList.remove('open');
    document.body.classList.remove('lb-lock');
    if (last) last.focus();
  };
  links.forEach(a => a.addEventListener('click', e => { e.preventDefault(); open(a); }));
  box.addEventListener('click', e => { if (e.target !== img) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && box.classList.contains('open')) close(); });
})();

// ===================== Animations =====================
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const nav = document.querySelector('.nav');
  const menu = document.getElementById('menu');

  // Scroll progress bar + header that hides while scrolling down
  const bar = document.createElement('div');
  bar.className = 'progress';
  document.body.appendChild(bar);
  let lastY = window.scrollY, ticking = false;
  const onScroll = () => {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(y / max, 1) : 0) + ')';
    if (nav) {
      nav.classList.toggle('scrolled', y > 8);
      const menuOpen = menu && menu.classList.contains('open');
      if (!reduce && !menuOpen && y > lastY + 4 && y > 160) nav.classList.add('hide');
      else if (y < lastY - 4 || y < 160) nav.classList.remove('hide');
    }
    lastY = y;
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  // Split headings into words (keeps <em> styling)
  const split = el => {
    let i = 0;
    el.setAttribute('aria-label', el.textContent.trim());
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span'); w.className = 'w'; w.setAttribute('aria-hidden', 'true');
            const inner = document.createElement('span'); inner.className = 'wi';
            inner.style.setProperty('--i', i++);
            inner.textContent = part;
            w.appendChild(inner); frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    walk(el);
    // keep trailing punctuation (e.g. the "." after <em>word</em>) on the same line
    el.querySelectorAll('.w').forEach(w => {
      const prev = w.previousSibling;
      if (prev && prev.nodeType === 1 && !prev.classList.contains('w') && /^[.,!?;:…]+$/.test(w.textContent)) {
        const keep = document.createElement('span');
        keep.style.whiteSpace = 'nowrap';
        prev.replaceWith(keep);
        keep.append(prev, w);
      }
    });
    el.classList.add('split');
  };

  const splitEls = [...document.querySelectorAll('h1, h2, .f-big')];
  const photos = [...document.querySelectorAll('.photo')];
  const sel = '.eyebrow,.kicker,.lead,.cta,.label,.cols > div,.row,.tile,.about-text > *,.page-head p,.social,.mail-line,.f-sub,.f-btn,.f-top > .f-col,.f-bottom,.marquee';
  const revEls = [...document.querySelectorAll(sel)];

  if (reduce) {
    [...splitEls, ...photos, ...revEls].forEach(e => e.classList.add('in'));
    return;
  }

  splitEls.forEach(split);

  // staggered delays: siblings one after another; hero / page headers wait for the headline
  const counts = new Map();
  revEls.forEach(el => {
    el.classList.add('rv');
    const p = el.parentElement;
    const n = counts.get(p) || 0;
    counts.set(p, n + 1);
    const intro = el.closest('.hero, .page-head');
    const d = intro ? 0.45 + n * 0.12 : Math.min(n * 0.09, 0.45);
    el.style.setProperty('--d', d + 's');
  });

  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  const start = () => [...splitEls, ...photos, ...revEls].forEach(t => io.observe(t));
  const fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  const html = document.documentElement;
  const introDelay = html.classList.contains('intro') ? 1900 : (html.classList.contains('pt-in') ? 650 : 0);
  Promise.race([fontsReady, new Promise(r => setTimeout(r, 1200))]).then(() => setTimeout(start, introDelay));

  // Smooth fade between pages
  window.addEventListener('pageshow', e => { if (e.persisted) { document.body.classList.remove('leaving'); document.documentElement.classList.remove('pt-out'); } });
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (a.target === '_blank' || a.hasAttribute('data-full') || a.hasAttribute('download')) return;
    if (a.origin !== location.origin) return;
    if (!/(\.html|\/)$/.test(a.pathname)) return;
    if (a.pathname === location.pathname && a.hash) return;
    e.preventDefault();
    try { sessionStorage.setItem('pt', '1'); } catch (err) {}
    document.documentElement.classList.add('pt-out');
    setTimeout(() => { location.href = a.href; }, 560);
  });
})();

// ===================== Animations v2 =====================
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;

  // section divider lines draw in when scrolled to
  const lineIO = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); lineIO.unobserve(e.target); }
  }), { threshold: 0.05 });
  document.querySelectorAll('.section').forEach(s => lineIO.observe(s));

  // marquee skews with scroll speed
  const marq = document.querySelector('.marquee');
  if (marq) {
    let last = window.scrollY, skew = 0;
    const tick = () => {
      const y = window.scrollY;
      const target = Math.max(-7, Math.min(7, (y - last) * -0.35));
      last = y;
      skew += (target - skew) * 0.12;
      marq.style.transform = Math.abs(skew) < 0.02 ? '' : 'skewX(' + skew.toFixed(2) + 'deg)';
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  if (!fine) return;

  // custom cursor
  const cur = document.createElement('div');
  cur.className = 'cursor';
  cur.innerHTML = '<span></span>';
  document.body.appendChild(cur);
  const label = cur.firstChild;
  let mx = innerWidth / 2, my = innerHeight / 2, cx = mx, cy = my;
  window.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; cur.classList.add('on'); }, { passive: true });
  document.addEventListener('mouseleave', () => cur.classList.remove('on'));
  const loop = () => {
    cx += (mx - cx) * 0.2; cy += (my - cy) * 0.2;
    cur.style.transform = 'translate(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px)';
    requestAnimationFrame(loop);
  };
  loop();
  document.addEventListener('mouseover', e => {
    const view = e.target.closest('.tile[data-full]');
    const hot = e.target.closest('a, button, input, textarea, label');
    cur.classList.toggle('view', !!view);
    cur.classList.toggle('hover', !!hot && !view);
    label.textContent = view ? 'View' : '';
  });

  // magnetic buttons
  document.querySelectorAll('.btn, .f-btn').forEach(b => {
    b.addEventListener('mousemove', e => {
      const r = b.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) * 0.3;
      const dy = (e.clientY - (r.top + r.height / 2)) * 0.4;
      b.style.transform = 'translate(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px)';
    });
    b.addEventListener('mouseleave', () => { b.style.transform = ''; });
  });

  // photo: 3D tilt, blue block moves the opposite way for depth
  document.querySelectorAll('.photo').forEach(p => {
    p.addEventListener('mousemove', e => {
      const r = p.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      p.style.transform = 'perspective(900px) rotateY(' + (px * 10).toFixed(2) + 'deg) rotateX(' + (-py * 10).toFixed(2) + 'deg)';
      p.style.setProperty('--px', (-px * 22).toFixed(1));
      p.style.setProperty('--py', (-py * 22).toFixed(1));
    });
    p.addEventListener('mouseleave', () => {
      p.style.transform = '';
      p.style.setProperty('--px', 0);
      p.style.setProperty('--py', 0);
    });
  });
})();

// ===================== Footer wordmark =====================
(() => {
  const mark = document.querySelector('.f-mark');
  if (!mark) return;
  const inner = mark.querySelector('span');
  // split into letters for the rise animation
  const text = inner.textContent;
  inner.textContent = '';
  [...text].forEach((ch, i) => {
    const s = document.createElement('span');
    s.className = 'ch';
    s.style.setProperty('--i', i);
    s.textContent = ch;
    inner.appendChild(s);
  });
  // scale the name so it fills the footer width exactly
  const fit = () => {
    mark.style.fontSize = '100px';
    const w = inner.getBoundingClientRect().width;
    if (w > 0) mark.style.fontSize = Math.floor(100 * (mark.clientWidth / w) * 0.99) + 'px';
  };
  fit();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  let t;
  window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(fit, 120); });
  // reveal when scrolled into view
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { mark.classList.add('in'); return; }
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { mark.classList.add('in'); io.disconnect(); }
  }), { threshold: 0.3 });
  io.observe(mark);
})();
