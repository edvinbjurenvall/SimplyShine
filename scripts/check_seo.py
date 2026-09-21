"""Validate published-page metadata, schema, assets and internal destinations."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, urljoin
import json
import re
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1] / 'simplyshine-site'
BASE = 'https://simplyshine.se'
class Page(HTMLParser):
    def __init__(self, source):
        super().__init__()
        self.tags = []
        self.feed(source)
    def handle_starttag(self, tag, attrs):
        self.tags.append((tag, dict(attrs)))

routes = {'/': ROOT / 'index.html'}
for line in (ROOT / '_redirects').read_text().splitlines():
    fields = line.split()
    if len(fields) == 3 and fields[2] == '200':
        routes[fields[0]] = ROOT / fields[1].lstrip('/')
urls = [el.text for el in ET.parse(ROOT / 'sitemap.xml').iter('{http://www.sitemaps.org/schemas/sitemap/0.9}loc')]
assert len(urls) == len(set(urls)), 'Duplicate sitemap URL'
titles, descriptions = set(), set()
links = 0
for url in urls:
    file = routes[urlsplit(url).path]
    source = file.read_text()
    page = Page(source)
    assert 'noindex' not in source, file
    assert len(re.findall(r'<h1\b', source)) == 1, file
    for kind, attr, value in [('link', 'rel', 'canonical'), ('meta', 'name', 'description')]:
        matches = [a for t, a in page.tags if t == kind and a.get(attr) == value]
        assert len(matches) == 1, (file, value)
        if value == 'canonical': assert matches[0]['href'] == url, file
        else:
            description = matches[0]['content']
            assert description and description not in descriptions, file
            descriptions.add(description)
    title = re.search(r'<title>(.*?)</title>', source).group(1)
    assert title not in titles, file
    titles.add(title)
    for block in re.findall(r'<script type="application/ld\+json">(.*?)</script>', source, re.S):
        data = json.loads(block)
        if data.get('@type') == 'Article':
            assert data['dateModified'] in source and 'class="guide-byline"' in source, file
            assert 'google-add-preferred-source-btn' in source, file
    assert 'https://www.google.com/preferences/source?q=simplyshine.se' in source, file
    for tag, attrs in page.tags:
        if tag not in ('a', 'link', 'img', 'script', 'source'): continue
        for key in ('href', 'src'):
            if key not in attrs: continue
            parsed = urlsplit(urljoin(url, attrs[key]))
            if parsed.netloc != 'simplyshine.se': continue
            target = routes.get(parsed.path, ROOT / parsed.path.lstrip('/'))
            assert target.is_file(), (file, attrs[key])
            if parsed.fragment and target.suffix == '.html':
                ids = {a['id'] for _, a in Page(target.read_text()).tags if 'id' in a}
                assert parsed.fragment in ids, (file, attrs[key])
            links += 1
        if tag == 'img': assert 'alt' in attrs, file
for name in ('hovas', 'saro', 'hovas-boka', 'saro-boka'):
    assert 'noindex' in (ROOT / (name + '.html')).read_text(), name
    assert BASE + '/' + name not in urls, name
print(f'PASS: {len(urls)} sitemap pages; unique titles/descriptions; H1s; canonicals; JSON-LD; {links} internal asset/link destinations; campaign exclusions.')
