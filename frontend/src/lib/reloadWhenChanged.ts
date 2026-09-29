/**
 * Reloads the page once its server-rendered HTML actually differs from what is
 * showing. Change notifications (Presentation edits, Live Content API events)
 * can arrive before the new content is readable from the API or the CDN;
 * reloading straight away would render the old content and never retry.
 * Browser-only.
 */
// Checked often but for as long as before (~5s): a change usually shows on
// the first or second fetch, and every interval here is added delay.
const POLL_INTERVAL_MS = 150
const POLL_ATTEMPTS = 32

const currentUrl = () => location.pathname + location.search

/**
 * The `<sanity-live>` element carries the Live Content API's sync tags, and the
 * server emits them in a different order on every request — the same page
 * fetched twice is not byte-identical. Comparing raw HTML therefore reported a
 * change when nothing had changed, and reloaded the page for no reason. The
 * tags say which documents to watch, never what the page shows, so they are
 * dropped before comparing.
 */
const comparable = (html: string) => html.replace(/<sanity-live\b[^>]*>/g, '')

const fetchPage = async () =>
  comparable(await (await fetch(currentUrl(), {cache: 'no-store', credentials: 'same-origin'})).text())

// The page as rendered now, fetched once so later fetches can be compared.
let baseline: Promise<string | undefined> | undefined
function getBaseline() {
  baseline ??= fetchPage().catch(() => undefined)
  return baseline
}

let generation = 0

export function primeReloadBaseline() {
  void getBaseline()
}

export async function reloadWhenChanged() {
  const mine = ++generation
  const before = await getBaseline()
  for (let attempt = 0; attempt < POLL_ATTEMPTS; attempt++) {
    // A newer change started its own poll; let that one decide.
    if (mine !== generation) return
    try {
      const html = await fetchPage()
      if (before === undefined || html !== before) {
        location.reload()
        return
      }
    } catch {
      // Network hiccup: try again on the next tick.
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS))
  }
  // Still identical: the change didn't affect what this page shows.
}
