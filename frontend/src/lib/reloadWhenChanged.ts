/**
 * Reloads the page once its server-rendered HTML actually differs from what is
 * showing. Change notifications (Presentation edits, Live Content API events)
 * can arrive before the new content is readable from the API or the CDN;
 * reloading straight away would render the old content and never retry.
 * Browser-only.
 */
const POLL_INTERVAL_MS = 400
const POLL_ATTEMPTS = 12

const currentUrl = () => location.pathname + location.search
const fetchPage = async () =>
  (await fetch(currentUrl(), {cache: 'no-store', credentials: 'same-origin'})).text()

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
