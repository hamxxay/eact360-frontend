/* Palette switcher for the E-ACT 360 design options.
   Each page loads this with data-design="<folder>". The choice is remembered per design,
   so the dashboard and invoices pages of one design stay in the same colours.
   Add ?palette=<id> to a URL to open a page in a specific palette. */
(function () {
  var PALETTES = {
    'closing-rates': [
      { id: 'masthead-blue', name: 'Masthead Blue', vars: { mast: '#0B4A8B', 'mast-2': '#0E5AA7' } },
      { id: 'treasury-green', name: 'Treasury Green', vars: { mast: '#0B5D46', 'mast-2': '#0E7357' } },
      { id: 'royal-indigo', name: 'Royal Indigo', vars: { mast: '#33298A', 'mast-2': '#4337A8' } },
      { id: 'oxblood', name: 'Oxblood', vars: { mast: '#7A1B2E', 'mast-2': '#93243A' } }
    ],
    'dense-mosaic': [
      { id: 'signal-red', name: 'Signal Red', vars: { red: '#D7000F' } },
      { id: 'cobalt', name: 'Cobalt', vars: { red: '#0047CC' } },
      { id: 'emerald', name: 'Emerald', vars: { red: '#00804F' } },
      { id: 'ultraviolet', name: 'Ultraviolet', vars: { red: '#6A1FD1' } }
    ],
    'intaglio': [
      { id: 'banknote-navy', name: 'Banknote Navy', vars: { navy: '#1C2D5A', 'navy-2': '#26397055', serial: '#C1272D', gold: '#B8A16A' } },
      { id: 'bottle-green', name: 'Bottle Green', vars: { navy: '#163F33', 'navy-2': '#1F4F4155', serial: '#B3261E', gold: '#C2A15A' } },
      { id: 'burgundy', name: 'Burgundy & Gold', vars: { navy: '#4E1828', 'navy-2': '#63213555', serial: '#B3261E', gold: '#C9A45C' } },
      { id: 'slate-teal', name: 'Slate & Teal', vars: { navy: '#1F2A33', 'navy-2': '#2B384455', serial: '#C1272D', gold: '#2BA59A' } }
    ],
    'lal-khata': [
      { id: 'red-cloth', name: 'Red Cloth', vars: { cloth: '#7A1F1F', 'cloth-2': '#8E2A28', thread: '#C9A13B' } },
      { id: 'indigo-ledger', name: 'Indigo Ledger', vars: { cloth: '#1E2C66', 'cloth-2': '#283A7E', thread: '#D0A84A' } },
      { id: 'forest-ledger', name: 'Forest Ledger', vars: { cloth: '#17483A', 'cloth-2': '#1F5A49', thread: '#C9A13B' } },
      { id: 'plum', name: 'Plum & Brass', vars: { cloth: '#4B1F4A', 'cloth-2': '#5E2A5C', thread: '#D8B26A' } }
    ],
    'next-gate': [
      { id: 'wayfinding-yellow', name: 'Wayfinding Yellow', vars: { sign: '#FFD100', rail: '#1E1E1E' } },
      { id: 'amber-navy', name: 'Amber & Navy', vars: { sign: '#FFB21A', rail: '#0F1D3A' } },
      { id: 'cyan-graphite', name: 'Cyan & Graphite', vars: { sign: '#3CCBF4', rail: '#1B2128' } },
      { id: 'lime-forest', name: 'Lime & Forest', vars: { sign: '#C4EE4B', rail: '#0F2B24' } }
    ],
    'platform-board': [
      { id: 'teal-coral', name: 'Teal & Coral', vars: { rail: '#0F4C5C', 'rail-2': '#17606F', board: '#0B3945', signal: '#FF7A59' } },
      { id: 'navy-amber', name: 'Navy & Amber', vars: { rail: '#16325C', 'rail-2': '#1F4171', board: '#0F2546', signal: '#FFB020' } },
      { id: 'forest-gold', name: 'Forest & Gold', vars: { rail: '#1B4B3A', 'rail-2': '#245D49', board: '#123629', signal: '#F4B740' } },
      { id: 'aubergine-mint', name: 'Aubergine & Mint', vars: { rail: '#3B1F4F', 'rail-2': '#4B2A63', board: '#2A1539', signal: '#3DDC97' } }
    ],
    'proof-sheet': [
      { id: 'periwinkle', name: 'Periwinkle Seal', vars: { seal: '#5B5FC7', 'seal-bg': '#DCDDF3' } },
      { id: 'teal', name: 'Teal Seal', vars: { seal: '#0F7C83', 'seal-bg': '#CFEAEB' } },
      { id: 'magenta', name: 'Magenta Seal', vars: { seal: '#B8327A', 'seal-bg': '#F3D8E6' } },
      { id: 'emerald', name: 'Emerald Seal', vars: { seal: '#1D7F55', 'seal-bg': '#D3EDDF' } }
    ],
    'standard': [
      { id: 'blue', name: 'SaaS Blue', vars: { blue: '#2563EB', 'blue-bg': '#EFF6FF' } },
      { id: 'violet', name: 'Violet', vars: { blue: '#7C3AED', 'blue-bg': '#F5F3FF' } },
      { id: 'teal', name: 'Teal', vars: { blue: '#0D9488', 'blue-bg': '#F0FDFA' } },
      { id: 'slate', name: 'Executive Slate', vars: { blue: '#1E293B', 'blue-bg': '#F1F5F9' } }
    ]
  };

  var script = document.currentScript;
  var design = script && script.getAttribute('data-design');
  var list = PALETTES[design];
  if (!list) return;
  var KEY = 'eact-palette:' + design;
  var root = document.documentElement;

  function store(id) { try { localStorage.setItem(KEY, id); } catch (e) {} }
  function stored() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function find(id) { for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; return null; }

  var fromUrl = new URLSearchParams(location.search).get('palette');
  var current = find(fromUrl) || find(stored()) || list[0];

  function apply(p) {
    current = p;
    for (var k in p.vars) root.style.setProperty('--' + k, p.vars[k]);
    root.setAttribute('data-palette', p.id);
    if (ui) render();
  }
  var ui = null;
  apply(current); // before first paint: no flash of the default palette

  function swatchBg(p) {
    var v = Object.keys(p.vars).map(function (k) { return p.vars[k]; })
      .filter(function (c) { return c.length === 7; });
    var a = v[0], b = v[v.length > 2 ? v.length - 1 : 1] || a;
    return 'linear-gradient(135deg,' + a + ' 0 50%,' + b + ' 50% 100%)';
  }

  function render() {
    ui.querySelector('.ps-name').textContent = current.name;
    ui.querySelectorAll('button').forEach(function (b) {
      b.setAttribute('aria-pressed', b.dataset.id === current.id ? 'true' : 'false');
    });
  }

  function build() {
    var css = document.createElement('style');
    css.textContent =
      '.ps{position:fixed;right:16px;bottom:16px;z-index:2147483000;display:flex;align-items:center;gap:10px;' +
      'padding:8px 10px 8px 14px;background:#fff;color:#16181A;border:1px solid rgba(0,0,0,.12);border-radius:999px;' +
      'box-shadow:0 6px 24px rgba(0,0,0,.14),0 1px 3px rgba(0,0,0,.08);font:500 12px/1.2 system-ui,-apple-system,"Segoe UI",sans-serif}' +
      '.ps-label{display:flex;flex-direction:column;min-width:112px}' +
      '.ps-label small{font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:#6B6E73}' +
      '.ps-name{font-weight:600;font-size:13px}' +
      '.ps-sw{display:flex;gap:6px}' +
      '.ps button{width:26px;height:26px;border-radius:50%;border:2px solid #fff;padding:0;cursor:pointer;' +
      'box-shadow:0 0 0 1px rgba(0,0,0,.18);transition:transform .15s ease,box-shadow .15s ease}' +
      '.ps button:hover{transform:scale(1.1)}' +
      '.ps button[aria-pressed=true]{box-shadow:0 0 0 2px #16181A}' +
      '.ps button:focus-visible{outline:2px solid #16181A;outline-offset:3px}' +
      '.ps-div{width:1px;align-self:stretch;background:rgba(0,0,0,.12);margin:0 2px}' +
      '.ps .ps-nt{width:auto;height:30px;border-radius:999px;border:0;box-shadow:none;background:#16181A;color:#fff;' +
      'display:flex;align-items:center;gap:6px;padding:0 12px 0 10px;font:600 12px system-ui,-apple-system,"Segoe UI",sans-serif}' +
      '.ps .ps-nt:hover{transform:none;background:#33363B}' +
      '.ps-nt svg{width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}' +
      '@media print{.ps{display:none}}' +
      '@media (prefers-reduced-motion:reduce){.ps button{transition:none}}';
    document.head.appendChild(css);

    ui = document.createElement('div');
    ui.className = 'ps';
    ui.setAttribute('role', 'group');
    ui.setAttribute('aria-label', 'Colour scheme');
    ui.innerHTML = '<div class="ps-label"><small>Colour scheme</small><span class="ps-name"></span></div><div class="ps-sw"></div>';
    var sw = ui.querySelector('.ps-sw');
    list.forEach(function (p, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.dataset.id = p.id;
      b.title = p.name + ' (' + (i + 1) + ')';
      b.setAttribute('aria-label', p.name);
      b.style.background = swatchBg(p);
      b.addEventListener('click', function () { store(p.id); apply(p); });
      b.addEventListener('mouseenter', function () { ui.querySelector('.ps-name').textContent = p.name; });
      b.addEventListener('mouseleave', render);
      sw.appendChild(b);
    });

    // notification demo: each click shows the next type
    var nIdx = 0;
    var div = document.createElement('span');
    div.className = 'ps-div';
    var nb = document.createElement('button');
    nb.type = 'button';
    nb.className = 'ps-nt';
    nb.title = 'Show a sample notification (N)';
    function nLabel() {
      nb.innerHTML = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 11V7a4 4 0 018 0v4l1.5 1.5h-11L4 11zM6.5 14h3"/></svg>' +
        'Notify: ' + MESSAGES[nIdx].label;
    }
    function fire() { notify(MESSAGES[nIdx]); nIdx = (nIdx + 1) % MESSAGES.length; nLabel(); }
    nLabel();
    nb.addEventListener('click', fire);
    ui.appendChild(div);
    ui.appendChild(nb);
    // hide inside the overview page's preview iframes
    if (window.self !== window.top) ui.style.display = 'none';
    document.body.appendChild(ui);
    render();

    // ?notify=all shows every notification type at once (for review / screenshots)
    if (new URLSearchParams(location.search).get('notify') === 'all') {
      MESSAGES.slice(0, 3).forEach(function (m) { notify(m); });
      stack.querySelectorAll('.nt').forEach(function (el) { el.dispatchEvent(new Event('mouseenter')); });
    }

    // keys 1-4 switch palettes
    document.addEventListener('keydown', function (e) {
      if (e.ctrlKey || e.metaKey || e.altKey || /input|textarea|select/i.test(e.target.tagName)) return;
      if (e.key === 'n' || e.key === 'N') { fire(); return; }
      var n = parseInt(e.key, 10);
      if (n >= 1 && n <= list.length) { store(list[n - 1].id); apply(list[n - 1]); }
    });
  }

  /* ---------- Notifications / snackbars ---------- */
  // status colour token per design: ok / wait / bad / info
  var STATUS = {
    'closing-rates': ['up', 'wait', 'down', 'mast-2'],
    'dense-mosaic': ['ok', 'wait', 'neg', 'ink'],
    'intaglio': ['green', 'wait', 'serial', 'gold'],
    'lal-khata': ['ok', 'wait', 'red', 'cloth'],
    'next-gate': ['ok', 'wait', 'bad', 'rail'],
    'platform-board': ['ok', 'wait', 'bad', 'rail-2'],
    'proof-sheet': ['seal', 'wait', 'bad', 'ink-2'],
    'standard': ['ok', 'wait', 'bad', 'blue']
  }[design];

  var ICONS = {
    ok: '<path d="M4 10.5l3.5 3.5L16 6"/>',
    bad: '<path d="M10 5.5v6M10 14.5v.01"/><circle cx="10" cy="10" r="8"/>',
    wait: '<circle cx="10" cy="10" r="7.5"/><path d="M10 6v4.5l3 2"/>',
    info: '<path d="M5 8h7.5a3.5 3.5 0 010 7H9"/><path d="M8 5L5 8l3 3"/>'
  };
  var MESSAGES = [
    { type: 'ok', label: 'Posted', title: 'INV-2026-0439 posted to FBR', sub: 'FBR invoice no. 7000123-261117-0439', action: 'View' },
    { type: 'bad', label: 'Rejected', title: 'FBR rejected INV-2026-0441', sub: 'Buyer NTN 4271093-6 is not active. Fix and repost.', action: 'Fix' },
    { type: 'wait', label: 'Queued', title: '14 invoices queued for the 11:00 run', sub: 'PKR 5,186,200 · posts automatically', action: 'Post now' },
    { type: 'info', label: 'Undo', title: 'Draft INV-2026-0442 deleted', sub: '', action: 'Undo' }
  ];

  var BASE_CSS =
    '.nt-stack{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:2147482000;display:flex;flex-direction:column-reverse;gap:10px;width:min(500px,calc(100vw - 32px));pointer-events:none}' +
    '.nt{pointer-events:auto;display:flex;align-items:center;gap:12px;padding:12px 12px 12px 14px;animation:nt-in .22s cubic-bezier(.2,.8,.2,1)}' +
    '.nt.out{animation:nt-out .18s ease-in forwards}' +
    '.nt-ic{flex:none;width:30px;height:30px;display:grid;place-items:center;border-radius:50%;background:var(--nt-c);color:#fff}' +
    '.nt-ic svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}' +
    '.nt-tx{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}' +
    '.nt-tx b{font-weight:700}.nt-tx span{opacity:.85;font-size:.92em}.nt-tx span:empty{display:none}' +
    '.nt-time{display:none}' +
    '.nt button{font:inherit;cursor:pointer;background:none;border:0;color:inherit}' +
    '.nt-act{flex:none;padding:6px 12px;font-weight:600!important}' +
    '.nt-x{flex:none;width:28px;height:28px;display:grid;place-items:center;opacity:.7;border-radius:4px}.nt-x:hover{opacity:1}' +
    '.nt-x svg{width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round}' +
    '.nt button:focus-visible{outline:2px solid currentColor;outline-offset:2px}' +
    '@keyframes nt-in{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}' +
    '@keyframes nt-out{to{opacity:0;transform:translateY(8px)}}' +
    '@media (prefers-reduced-motion:reduce){.nt,.nt.out{animation-duration:.01s}}' +
    '@media print{.nt-stack{display:none}}';

  var DESIGN_CSS = {
    'closing-rates':
      '.nt{background:var(--mast);color:#fff;font:400 14px/1.35 "Source Sans 3",sans-serif;border-radius:6px;box-shadow:0 12px 32px rgba(0,0,0,.22)}' +
      '.nt-tx b{font:700 14px/1.3 "Libre Franklin",sans-serif}.nt-tx span{color:color-mix(in srgb,var(--mast-2) 16%,#fff);opacity:1}' +
      '.nt-ic{border-radius:4px;box-shadow:0 0 0 2px rgba(255,255,255,.9)}' +
      '.nt-act{border:1px solid rgba(255,255,255,.45)!important;border-radius:6px}.nt-act:hover{background:rgba(255,255,255,.12)!important}',
    'dense-mosaic':
      '.nt{background:#fff;color:var(--ink);font:400 13px/1.4 "Noto Sans",sans-serif;border:1px solid var(--ink);border-top:4px solid var(--nt-c);border-radius:0;box-shadow:4px 4px 0 rgba(0,0,0,.12);padding:10px 10px 10px 12px}' +
      '.nt-ic{border-radius:0;width:26px;height:26px}.nt-tx span{color:var(--ink-2);opacity:1}' +
      '.nt-act{background:var(--red)!important;color:#fff!important;font-weight:700!important;padding:6px 12px}',
    'intaglio':
      '.nt{background:var(--navy);color:#fff;font:400 14px/1.4 "Work Sans",sans-serif;border-radius:4px;padding:14px 12px 14px 16px;' +
      'box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--gold) 60%,transparent),inset 0 0 0 4px var(--navy),inset 0 0 0 5px color-mix(in srgb,var(--gold) 30%,transparent),0 14px 34px rgba(0,0,0,.25)}' +
      '.nt-tx b{font:700 14px/1.3 "Libre Baskerville",serif;letter-spacing:.01em}' +
      '.nt-ic{box-shadow:0 0 0 1px var(--gold)}' +
      '.nt-act{color:var(--gold)!important;text-transform:uppercase;letter-spacing:.1em;font-size:12px!important}',
    'lal-khata':
      '.nt{background:var(--sheet);color:var(--ink);font:400 14px/1.4 "Public Sans",sans-serif;border:1px solid var(--rule);border-left:5px solid var(--cloth);border-bottom:3px double var(--ink);border-radius:2px;box-shadow:0 12px 30px rgba(30,27,24,.16)}' +
      '.nt-tx b{font:600 16px/1.3 "Source Serif 4",serif}.nt-tx span{color:var(--ink-2);opacity:1}' +
      '.nt-ic{background:none;color:var(--nt-c);border:1.5px solid var(--nt-c)}' +
      '.nt-act{color:var(--cloth)!important;text-decoration:underline;text-underline-offset:3px}',
    'next-gate':
      '.nt{background:var(--rail);color:#fff;font:500 15px/1.35 "Mukta",sans-serif;border-radius:6px;box-shadow:0 14px 32px rgba(0,0,0,.28);padding:10px 10px 10px 10px}' +
      '.nt-ic{width:40px;height:40px;border-radius:4px;background:var(--sign);color:var(--ink)}.nt-ic svg{width:22px;height:22px;stroke-width:2.6}' +
      '.nt-bad .nt-ic{background:var(--bad);color:#fff}' +
      '.nt-tx b{font-weight:800;font-size:16px}' +
      '.nt-act{background:var(--sign)!important;color:var(--ink)!important;border-radius:4px;font-weight:800!important}',
    'platform-board':
      '.nt{background:var(--board);color:#fff;font:400 14px/1.35 "Barlow",sans-serif;border-radius:6px;box-shadow:0 14px 32px rgba(0,0,0,.28);border-left:4px solid var(--nt-c)}' +
      '.nt-time{display:block;flex:none;font:700 20px/1 "Barlow Condensed",sans-serif;color:var(--signal);padding-right:12px;border-right:1px solid rgba(255,255,255,.18)}' +
      '.nt-ic{display:none}' +
      '.nt-tx b{font:700 16px/1.2 "Barlow Condensed",sans-serif;text-transform:uppercase;letter-spacing:.04em}' +
      '.nt-act{background:var(--signal)!important;color:var(--ink)!important;border-radius:4px;font:700 13px "Barlow Condensed",sans-serif!important;text-transform:uppercase;letter-spacing:.06em}',
    'proof-sheet':
      '.nt{background:var(--ground);color:var(--ink);font:400 14px/1.4 "Hanken Grotesk",sans-serif;border:1px solid var(--ink);border-radius:0;box-shadow:6px 6px 0 var(--hair-2)}' +
      '.nt-ic{width:36px;height:36px;background:none;color:var(--nt-c);border:2px solid var(--nt-c);box-shadow:inset 0 0 0 2px var(--ground),inset 0 0 0 3px var(--nt-c);transform:rotate(-8deg)}' +
      '.nt-time{display:block;flex:none;order:5;font:500 11px "JetBrains Mono",monospace;color:var(--ink-2)}' +
      '.nt-tx span{font:400 12px/1.4 "JetBrains Mono",monospace;color:var(--ink-2);opacity:1}' +
      '.nt-act{font:500 12px "JetBrains Mono",monospace!important;text-transform:uppercase;letter-spacing:.06em;text-decoration:underline;text-underline-offset:3px}',
    'standard':
      '.nt{background:var(--card);color:var(--ink);font:400 14px/1.4 "Inter",sans-serif;border:1px solid var(--line);border-radius:10px;box-shadow:0 12px 32px rgba(15,23,42,.12),0 2px 6px rgba(15,23,42,.06)}' +
      '.nt-ic{background:color-mix(in srgb,var(--nt-c) 12%,#fff);color:var(--nt-c);width:34px;height:34px}' +
      '.nt-tx b{font-weight:600}.nt-tx span{color:var(--ink-2);opacity:1}' +
      '.nt-act{color:var(--blue)!important;border-radius:6px}.nt-act:hover{background:var(--blue-bg)!important}'
  }[design];

  var stack = null;
  function esc(s) { return s.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function notify(m) {
    if (!stack) {
      var s = document.createElement('style');
      s.textContent = BASE_CSS + DESIGN_CSS;
      document.head.appendChild(s);
      stack = document.createElement('div');
      stack.className = 'nt-stack';
      document.body.appendChild(stack);
    }
    var idx = { ok: 0, wait: 1, bad: 2, info: 3 }[m.type];
    var el = document.createElement('div');
    el.className = 'nt nt-' + m.type;
    el.setAttribute('role', m.type === 'bad' ? 'alert' : 'status');
    el.style.setProperty('--nt-c', 'var(--' + STATUS[idx] + ')');
    var now = new Date();
    var time = ('0' + now.getHours()).slice(-2) + ':' + ('0' + now.getMinutes()).slice(-2);
    el.innerHTML =
      '<span class="nt-time">' + time + '</span>' +
      '<span class="nt-ic" aria-hidden="true"><svg viewBox="0 0 20 20">' + ICONS[m.type] + '</svg></span>' +
      '<div class="nt-tx"><b>' + esc(m.title) + '</b><span>' + esc(m.sub) + '</span></div>' +
      '<button type="button" class="nt-act">' + esc(m.action) + '</button>' +
      '<button type="button" class="nt-x" aria-label="Dismiss"><svg viewBox="0 0 14 14"><path d="M2 2l10 10M12 2L2 12"/></svg></button>';
    var timer;
    function close() {
      clearTimeout(timer);
      el.classList.add('out');
      setTimeout(function () { el.remove(); }, 200);
    }
    function arm() { timer = setTimeout(close, m.type === 'bad' ? 9000 : 5000); }
    el.querySelector('.nt-x').addEventListener('click', close);
    el.querySelector('.nt-act').addEventListener('click', close);
    el.addEventListener('mouseenter', function () { clearTimeout(timer); });
    el.addEventListener('mouseleave', arm);
    stack.appendChild(el);
    while (stack.children.length > 3) stack.firstChild.remove();
    arm();
  }

  // keep the other page of this design (e.g. an open tab) in sync
  window.addEventListener('storage', function (e) {
    if (e.key === KEY) { var p = find(e.newValue); if (p) apply(p); }
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();
