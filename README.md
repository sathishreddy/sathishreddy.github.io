# sathishreddy.github.io

Personal website of **Sathish Reddy Indurthi**, Senior Research Scientist at Zoom AI.
Live at <https://sathishreddy.github.io/>.

A dependency-free static site: plain HTML, CSS and JavaScript, served directly by GitHub Pages
(`.nojekyll` disables the Jekyll build).

```
index.html                     all page content, SEO meta tags and JSON-LD
404.html                       not-found page
assets/css/main.css            styles, light and dark themes
assets/js/main.js              theme toggle, menu, animations, publication filters
assets/img/                    portrait, social-share image, touch icon
assets/Sathish_Reddy_Indurthi_CV.pdf
favicon.svg, robots.txt, sitemap.xml
```

## Preview locally

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

## Updating content

- **New paper:** copy an `<li class="pub">` block in `index.html` into the right year group.
  `data-tags` controls the filters: `selected`, `first`, `alignment`, `agents`, `multilingual`, `speech`, `qa`, `ml`.
- **Citation stats:** update the `data-to` values in the stats block (and the note under it).
- **CV:** replace `assets/Sathish_Reddy_Indurthi_CV.pdf`.
- After any meaningful update, bump `<lastmod>` in `sitemap.xml` and `dateModified` in the JSON-LD.
