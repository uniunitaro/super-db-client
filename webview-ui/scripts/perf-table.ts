import { type ChildProcessByStdio, spawn } from 'node:child_process'
import { once } from 'node:events'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import process from 'node:process'
import type { Readable } from 'node:stream'
import { setTimeout as delay } from 'node:timers/promises'
import { type Browser, type Page, chromium } from 'playwright'

type PerfArgs = {
  port: number
  rows: number
  columns: number
  limit: number
  iterations: number
  pageTransitions: number
}

type IterationResult = {
  initialRenderMs: number
  sortToDescMs: number
  pageTransitionMs: number[]
  pageTransitionFirstMs: number | null
  pageTransitionLastMs: number | null
  pageTransitionDeltaMs: number | null
  scrollExerciseMs: number
  longTaskCountDuringScroll: number
  longTaskTotalMsDuringScroll: number
  usedJsHeapMb: number | null
}

type BrowserWindow = Window & {
  __perfLongTasks?: number[]
}

type PerformanceWithMemory = Performance & {
  memory?: {
    usedJSHeapSize: number
  }
}

type PreviewProcess = ChildProcessByStdio<null, Readable, Readable>

const arg = (name: string, fallback: number): number => {
  const prefix = `--${name}=`
  const value = process.argv.find((item) => item.startsWith(prefix))
  if (!value) {
    return fallback
  }

  const parsed = Number.parseInt(value.slice(prefix.length), 10)
  return Number.isFinite(parsed) ? parsed : fallback
}

const args: PerfArgs = {
  port: arg('port', 4173),
  rows: arg('rows', 100_000),
  columns: arg('columns', 20),
  limit: arg('limit', 5_000),
  iterations: arg('iterations', 5),
  pageTransitions: arg('pageTransitions', 10),
}

const nowIso = new Date().toISOString()
const webviewDir = resolve(process.cwd())
const resultPath = resolve(
  webviewDir,
  'perf-results',
  `table-${nowIso.replace(/[:.]/g, '-')}.json`,
)

const baseUrl = `http://127.0.0.1:${args.port}`
const perfUrl = `${baseUrl}/?route=/table&rows=${args.rows}&columns=${args.columns}&limit=${args.limit}`

const median = (values: number[]): number | null => {
  const sorted = [...values].sort((a, b) => a - b)
  if (sorted.length === 0) {
    return null
  }

  const middle = Math.floor(sorted.length / 2)
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2
  }

  return sorted[middle]
}

const p95 = (values: number[]): number | null => {
  const sorted = [...values].sort((a, b) => a - b)
  if (sorted.length === 0) {
    return null
  }

  const index = Math.ceil(sorted.length * 0.95) - 1
  return sorted[Math.max(0, Math.min(index, sorted.length - 1))]
}

const waitForServer = async (
  url: string,
  timeoutMs: number,
  previewProcess: PreviewProcess,
): Promise<void> => {
  const start = Date.now()

  while (Date.now() - start < timeoutMs) {
    if (previewProcess.exitCode !== null) {
      throw new Error('Preview process exited before server became ready')
    }

    try {
      const response = await fetch(url)
      if (response.ok) {
        return
      }
    } catch {
      // Server is not ready yet.
    }

    await delay(300)
  }

  throw new Error(`Preview server did not start within ${timeoutMs}ms: ${url}`)
}

const startPreview = (): PreviewProcess => {
  const viteBin = resolve(webviewDir, 'node_modules', 'vite', 'bin', 'vite.js')
  const child = spawn(
    process.execPath,
    [
      viteBin,
      'preview',
      '--host',
      '127.0.0.1',
      '--port',
      String(args.port),
      '--strictPort',
    ],
    {
      cwd: webviewDir,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: process.env,
    },
  )

  child.stdout.on('data', (chunk) => {
    process.stdout.write(`[preview] ${chunk}`)
  })

  child.stderr.on('data', (chunk) => {
    process.stderr.write(`[preview] ${chunk}`)
  })

  return child
}

const stopPreview = async (child: PreviewProcess): Promise<void> => {
  if (child.exitCode !== null) {
    return
  }

  child.kill('SIGTERM')

  await Promise.race([
    once(child, 'close'),
    delay(2_000).then(() => {
      if (child.exitCode === null) {
        child.kill('SIGKILL')
      }
    }),
  ])
}

const getFirstDataRowText = async (page: Page): Promise<string> =>
  page.evaluate(
    () => document.querySelectorAll('[role="row"]')[1]?.textContent ?? '',
  )

const measurePageTransitions = async (
  page: Page,
  transitionCount: number,
): Promise<number[]> => {
  const durations: number[] = []
  if (transitionCount <= 0) {
    return durations
  }

  const nextPageButton = page.getByLabel('Next page')

  for (let index = 0; index < transitionCount; index++) {
    const beforeText = await getFirstDataRowText(page)
    const transitionStart = performance.now()

    await nextPageButton.click()

    await page.waitForFunction((previousText) => {
      const nextText = document.querySelectorAll('[role="row"]')[1]?.textContent
      return nextText !== undefined && nextText !== previousText
    }, beforeText)

    durations.push(performance.now() - transitionStart)
  }

  return durations
}

const runIteration = async (browser: Browser): Promise<IterationResult> => {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  })

  const page = await context.newPage()

  await page.addInitScript(
    ({ limit }) => {
      const browserWindow = window as BrowserWindow

      localStorage.clear()
      localStorage.setItem(
        'vscodeState',
        JSON.stringify({
          tablePanel: {
            limit,
            offset: 0,
            scrollX: 0,
            scrollY: 0,
          },
        }),
      )

      browserWindow.__perfLongTasks = []
      if (typeof PerformanceObserver !== 'function') {
        return
      }

      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            browserWindow.__perfLongTasks?.push(entry.duration)
          }
        })
        observer.observe({ entryTypes: ['longtask'] })
      } catch {
        // ignore
      }
    },
    { limit: args.limit },
  )

  const renderStart = performance.now()
  await page.goto(perfUrl, { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: 'id' }).waitFor()
  await page.getByText(/\(estimated\) rows/).waitFor()
  await page.waitForFunction(
    () => document.querySelectorAll('[role="row"]').length > 1,
  )
  const initialRenderMs = performance.now() - renderStart

  const firstRowText = await getFirstDataRowText(page)

  await page.getByRole('button', { name: 'id' }).click()

  const sortStart = performance.now()
  await page.getByRole('button', { name: 'id' }).click()
  await page.waitForFunction((beforeText) => {
    const firstDataRow = document.querySelectorAll('[role="row"]')[1]
    return !!firstDataRow && firstDataRow.textContent !== beforeText
  }, firstRowText)
  const sortToDescMs = performance.now() - sortStart

  const maxPageTransitions = Math.max(0, Math.ceil(args.rows / args.limit) - 1)
  const transitionCount = Math.min(args.pageTransitions, maxPageTransitions)
  const pageTransitionMs = await measurePageTransitions(page, transitionCount)
  const pageTransitionFirstMs = pageTransitionMs[0] ?? null
  const pageTransitionLastMs = pageTransitionMs.at(-1) ?? null
  const pageTransitionDeltaMs =
    pageTransitionFirstMs === null || pageTransitionLastMs === null
      ? null
      : pageTransitionLastMs - pageTransitionFirstMs

  const longTaskBaseCount = await page.evaluate(() => {
    const browserWindow = window as BrowserWindow
    return Array.isArray(browserWindow.__perfLongTasks)
      ? browserWindow.__perfLongTasks.length
      : 0
  })

  const scrollStart = performance.now()
  await page.evaluate(async () => {
    const container = document.querySelector('[data-resizing]')
    if (!(container instanceof HTMLElement)) {
      throw new Error('Scroll container not found')
    }

    const maxScroll = container.scrollHeight - container.clientHeight
    const durationMs = 1500
    const start = performance.now()

    while (performance.now() - start < durationMs) {
      const elapsed = performance.now() - start
      container.scrollTop = maxScroll * (elapsed / durationMs)
      await new Promise(requestAnimationFrame)
    }
  })
  const scrollExerciseMs = performance.now() - scrollStart

  const longTaskDurations = await page.evaluate((baseCount) => {
    const browserWindow = window as BrowserWindow
    if (!Array.isArray(browserWindow.__perfLongTasks)) {
      return []
    }

    return browserWindow.__perfLongTasks.slice(baseCount)
  }, longTaskBaseCount)

  const usedJsHeapMb = await page.evaluate(() => {
    const performanceWithMemory = performance as PerformanceWithMemory
    if (!performanceWithMemory.memory) {
      return null
    }

    return performanceWithMemory.memory.usedJSHeapSize / 1024 / 1024
  })

  await context.close()

  const longTaskTotalMs = longTaskDurations.reduce(
    (sum, value) => sum + value,
    0,
  )

  return {
    initialRenderMs,
    sortToDescMs,
    pageTransitionMs,
    pageTransitionFirstMs,
    pageTransitionLastMs,
    pageTransitionDeltaMs,
    scrollExerciseMs,
    longTaskCountDuringScroll: longTaskDurations.length,
    longTaskTotalMsDuringScroll: longTaskTotalMs,
    usedJsHeapMb,
  }
}

const main = async (): Promise<void> => {
  const preview = startPreview()

  try {
    await waitForServer(baseUrl, 20_000, preview)

    const browser = await chromium.launch({ headless: true })
    const results: IterationResult[] = []

    try {
      for (let index = 0; index < args.iterations; index++) {
        const result = await runIteration(browser)
        results.push(result)
        console.log(`iteration ${index + 1}/${args.iterations}`, result)
      }
    } finally {
      await browser.close()
    }

    const summary = {
      initialRenderMs: {
        median: median(results.map((item) => item.initialRenderMs)),
        p95: p95(results.map((item) => item.initialRenderMs)),
      },
      sortToDescMs: {
        median: median(results.map((item) => item.sortToDescMs)),
        p95: p95(results.map((item) => item.sortToDescMs)),
      },
      pageTransitionMs: {
        median: median(results.flatMap((item) => item.pageTransitionMs)),
        p95: p95(results.flatMap((item) => item.pageTransitionMs)),
      },
      pageTransitionFirstMs: {
        median: median(
          results
            .map((item) => item.pageTransitionFirstMs)
            .filter((value) => value !== null),
        ),
        p95: p95(
          results
            .map((item) => item.pageTransitionFirstMs)
            .filter((value) => value !== null),
        ),
      },
      pageTransitionLastMs: {
        median: median(
          results
            .map((item) => item.pageTransitionLastMs)
            .filter((value) => value !== null),
        ),
        p95: p95(
          results
            .map((item) => item.pageTransitionLastMs)
            .filter((value) => value !== null),
        ),
      },
      pageTransitionDeltaMs: {
        median: median(
          results
            .map((item) => item.pageTransitionDeltaMs)
            .filter((value) => value !== null),
        ),
        p95: p95(
          results
            .map((item) => item.pageTransitionDeltaMs)
            .filter((value) => value !== null),
        ),
      },
      scrollExerciseMs: {
        median: median(results.map((item) => item.scrollExerciseMs)),
        p95: p95(results.map((item) => item.scrollExerciseMs)),
      },
      longTaskCountDuringScroll: {
        median: median(results.map((item) => item.longTaskCountDuringScroll)),
        p95: p95(results.map((item) => item.longTaskCountDuringScroll)),
      },
      longTaskTotalMsDuringScroll: {
        median: median(results.map((item) => item.longTaskTotalMsDuringScroll)),
        p95: p95(results.map((item) => item.longTaskTotalMsDuringScroll)),
      },
      usedJsHeapMb: {
        median: median(
          results
            .map((item) => item.usedJsHeapMb)
            .filter((value) => value !== null),
        ),
        p95: p95(
          results
            .map((item) => item.usedJsHeapMb)
            .filter((value) => value !== null),
        ),
      },
    }

    const output = {
      measuredAt: nowIso,
      url: perfUrl,
      config: args,
      iterations: results,
      summary,
    }

    await mkdir(dirname(resultPath), { recursive: true })
    await writeFile(resultPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8')

    console.log(`\nSaved perf result: ${resultPath}`)
    console.log('Summary:', JSON.stringify(summary, null, 2))
  } finally {
    await stopPreview(preview)
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
