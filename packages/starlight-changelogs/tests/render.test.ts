import type { LoaderContext } from 'astro/loaders'
import { expect, test, vi } from 'vitest'

import { renderVersion } from '../loader/utils'

test('supports body starting with a horizontal rule', async () => {
  const renderMarkdown = vi.fn<LoaderContext['renderMarkdown']>((content) => Promise.resolve({ html: content }))

  await renderVersion(renderMarkdown, '---\n\nText\n\n---', '1-0-0')

  expect(renderMarkdown).toHaveBeenCalledWith('---\n---\n---\n\nText\n\n---')
})

test('prefixes footnote IDs with the version slug', async () => {
  const html = `<p>Note<sup><a href="#user-content-fn-1" id="user-content-fnref-1" data-footnote-ref="" aria-describedby="footnote-label">1</a></sup></p>
<section data-footnotes="" class="footnotes"><div class="sl-heading-wrapper level-h2"><h2 class="sr-only" id="footnote-label">Footnotes</h2><a class="sl-anchor-link" href="#footnote-label"><span aria-hidden="true" class="sl-anchor-icon"><svg width="16" height="16" viewBox="0 0 24 24"><path fill="currentcolor" d="m12.11 15.39-3.88 3.88a2.52 2.52 0 0 1-3.5 0 2.47 2.47 0 0 1 0-3.5l3.88-3.88a1 1 0 0 0-1.42-1.42l-3.88 3.89a4.48 4.48 0 0 0 6.33 6.33l3.89-3.88a1 1 0 1 0-1.42-1.42Zm8.58-12.08a4.49 4.49 0 0 0-6.33 0l-3.89 3.88a1 1 0 0 0 1.42 1.42l3.88-3.88a2.52 2.52 0 0 1 3.5 0 2.47 2.47 0 0 1 0 3.5l-3.88 3.88a1 1 0 1 0 1.42 1.42l3.88-3.89a4.49 4.49 0 0 0 0-6.33ZM8.83 15.17a1 1 0 0 0 1.1.22 1 1 0 0 0 .32-.22l4.92-4.92a1 1 0 0 0-1.42-1.42l-4.92 4.92a1 1 0 0 0 0 1.42Z"></path></svg></span><span class="sr-only" data-pagefind-ignore="">Section titled “Footnotes”</span></a></div>
<ol>
<li id="user-content-fn-1">
<p>Footnote <a href="#user-content-fnref-1" data-footnote-backref="" aria-label="Back to reference 1" class="data-footnote-backref">↩</a></p>
</li>
</ol>
</section>`

  const rendered = await renderVersion(() => Promise.resolve({ html }), '', '1-0-0')

  expect(rendered.html).toMatchInlineSnapshot(`
    "<p>Note<sup><a href="#user-content-1-0-0-fn-1" id="user-content-1-0-0-fnref-1" data-footnote-ref="" aria-describedby="footnote-label">1</a></sup></p>
    <section data-footnotes="" class="footnotes"><div class="sl-heading-wrapper level-h2"><h2 class="sr-only" id="footnote-label">Footnotes</h2><a class="sl-anchor-link" href="#footnote-label"><span aria-hidden="true" class="sl-anchor-icon"><svg width="16" height="16" viewBox="0 0 24 24"><path fill="currentcolor" d="m12.11 15.39-3.88 3.88a2.52 2.52 0 0 1-3.5 0 2.47 2.47 0 0 1 0-3.5l3.88-3.88a1 1 0 0 0-1.42-1.42l-3.88 3.89a4.48 4.48 0 0 0 6.33 6.33l3.89-3.88a1 1 0 1 0-1.42-1.42Zm8.58-12.08a4.49 4.49 0 0 0-6.33 0l-3.89 3.88a1 1 0 0 0 1.42 1.42l3.88-3.88a2.52 2.52 0 0 1 3.5 0 2.47 2.47 0 0 1 0 3.5l-3.88 3.88a1 1 0 1 0 1.42 1.42l3.88-3.89a4.49 4.49 0 0 0 0-6.33ZM8.83 15.17a1 1 0 0 0 1.1.22 1 1 0 0 0 .32-.22l4.92-4.92a1 1 0 0 0-1.42-1.42l-4.92 4.92a1 1 0 0 0 0 1.42Z"></path></svg></span><span class="sr-only" data-pagefind-ignore="">Section titled “Footnotes”</span></a></div>
    <ol>
    <li id="user-content-1-0-0-fn-1">
    <p>Footnote <a href="#user-content-1-0-0-fnref-1" data-footnote-backref="" aria-label="Back to reference 1" class="data-footnote-backref">↩</a></p>
    </li>
    </ol>
    </section>"
  `)
})
