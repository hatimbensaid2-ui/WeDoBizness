#!/usr/bin/env python3
"""
Cache-busting for WeDoBizness static assets.

Adds ?v=<content hash> to every /assets/*.js and /assets/*.css reference in the HTML
(and in assets/fx.js for the lazy-loaded files), so browsers can cache them for a year
(.htaccess) yet always pick up a changed file. Also makes sure local scripts load with `defer`.

Run from the repo root after editing any CSS/JS:   python3 src/stamp_assets.py
"""
import glob
import hashlib
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REF = re.compile(r'(/assets/[\w./-]+\.(?:js|css))(\?v=[0-9a-f]+)?')


def digest(rel):
    with open(os.path.join(ROOT, rel.lstrip('/')), 'rb') as f:
        return hashlib.md5(f.read()).hexdigest()[:8]


def stamp(text):
    def sub(m):
        path = m.group(1)
        if not os.path.exists(os.path.join(ROOT, path.lstrip('/'))):
            return m.group(0)
        return f'{path}?v={digest(path)}'
    return REF.sub(sub, text)


def write_if_changed(path, new):
    with open(path, encoding='utf-8') as f:
        old = f.read()
    if new != old:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(new)
        print('stamped', os.path.relpath(path, ROOT))


# 1. JS files that lazy-load other assets (must be stamped before the HTML that loads them)
for js in ['assets/fx.js']:
    p = os.path.join(ROOT, js)
    with open(p, encoding='utf-8') as f:
        write_if_changed(p, stamp(f.read()))

# 2. HTML pages
with open(os.path.join(ROOT, 'assets/motion.css'), encoding='utf-8') as f:
    motion_css = re.sub(r'/\*.*?\*/', '', f.read(), flags=re.S)  # strip comments
    motion_css = re.sub(r'\s*\n\s*', '', motion_css).strip()
motion_inline = f'<style data-src="/assets/motion.css">{motion_css}</style>'

pages = glob.glob(os.path.join(ROOT, '*.html')) + glob.glob(os.path.join(ROOT, 'blog', '*.html'))
for p in sorted(pages):
    with open(p, encoding='utf-8') as f:
        s = f.read()
    # local scripts never block parsing
    s = re.sub(r'<script src="(/assets/[^"]+)"></script>', r'<script defer src="\1"></script>', s)
    # motion.css is tiny and needed before first paint: inline it (no render-blocking request)
    s = re.sub(r'<link rel="stylesheet" href="/assets/motion\.css(\?v=[0-9a-f]+)?">', lambda m: motion_inline, s)
    s = re.sub(r'<style data-src="/assets/motion\.css(?:\?v=[0-9a-f]+)?">.*?</style>', lambda m: motion_inline, s, flags=re.S)
    # fx.css is cosmetic (hero glow, floating CTA): load it without blocking render
    s = re.sub(r'(?<!<noscript>)<link rel="stylesheet" href="(/assets/fx\.css)(\?v=[0-9a-f]+)?">',
               '<link rel="stylesheet" href="\\1" media="print" onload="this.media=\'all\'"><noscript><link rel="stylesheet" href="\\1"></noscript>', s)
    write_if_changed(p, stamp(s))
