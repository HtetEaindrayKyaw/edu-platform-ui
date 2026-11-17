import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.route('https://fonts.googleapis.com/**', route => route.abort())
  await page.goto('/#/student')
})

const openTool = (page, name) => page.getByRole('navigation', { name: 'AI Suite' }).getByRole('button', { name, exact: true }).click()

test('tutor supports subjects, Markdown, starter prompts and keyboard composition', async ({ page }) => {
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await openTool(page, 'AI Tutor')
  const composer = page.getByRole('textbox', { name: 'Message your tutor' })
  await expect(page.getByRole('button', { name: 'Send message' })).toBeDisabled()
  await page.getByRole('button', { name: 'Explain this concept simply', exact: true }).click()
  await expect(page.getByRole('log').getByText('share a pair of electrons', { exact: true })).toBeVisible()
  await expect(page.getByRole('log').locator('li')).toHaveCount(6)
  await page.getByRole('combobox', { name: 'Subject', exact: true }).selectOption('IGCSE Mathematics')
  await expect(page.getByRole('log')).not.toContainText('covalent')
  await composer.fill('Explain equations')
  await composer.press('Shift+Enter')
  await expect(composer).toHaveValue('Explain equations\n')
  await composer.press('Enter')
  await expect(page.getByRole('log')).toContainText('So x = 4')
  await expect(composer).toHaveValue('')
  await page.getByRole('button', { name: 'New conversation' }).click()
  await expect(page.getByRole('log')).not.toContainText('So x = 4')
  expect(errors).toEqual([])
})

test('essay validates word count, shows a scorecard, and invalidates feedback on edits', async ({ page }) => {
  await openTool(page, 'Essay Checker')
  await expect(page.getByRole('button', { name: 'Grade My Essay' })).toBeDisabled()
  await page.getByRole('button', { name: 'Use sample essay' }).click()
  await expect(page.getByText('172 words', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Grade My Essay' }).click()
  await expect(page.getByText('Grade B', { exact: true })).toBeVisible()
  await expect(page.getByRole('progressbar')).toHaveCount(4)
  await expect(page.getByText('Suggested correction', { exact: true })).toBeVisible()
  await page.getByRole('combobox', { name: 'Exam type', exact: true }).selectOption('IELTS')
  await expect(page.getByText('Grade B', { exact: true })).not.toBeVisible()
  await page.getByRole('button', { name: 'Grade My Essay' }).click()
  await expect(page.getByText('Band 6.5', { exact: true })).toBeVisible()
  await page.getByRole('textbox', { name: 'Your essay', exact: true }).fill('A short new draft.')
  await expect(page.getByText('Band 6.5', { exact: true })).not.toBeVisible()
  await expect(page.getByRole('button', { name: 'Grade My Essay' })).toBeDisabled()
})

test('comprehension grades answers, retains per-mode drafts and plays bundled audio', async ({ page }) => {
  await openTool(page, 'Comprehension')
  await expect(page.getByRole('button', { name: 'Analyze Understanding' })).toBeDisabled()
  const answers = [
    'The plants provide shade, and evaporating water cools the air.',
    'The building must be able to support the extra weight.',
    'The room was three degrees cooler, but the study lasted only two weeks.',
  ]
  for (let i = 0; i < answers.length; i++) await page.locator('.ai-suite textarea').nth(i).fill(answers[i])
  await page.getByRole('button', { name: 'Analyze Understanding' }).click()
  await expect(page.getByText('100%', { exact: true })).toBeVisible()
  await page.getByRole('tab', { name: 'Listening Audio Mode' }).click()
  await expect(page.locator('.ai-suite textarea').first()).toHaveValue('')
  await expect(page.getByText('100%', { exact: true })).not.toBeVisible()
  await page.getByRole('button', { name: 'Show transcript' }).click()
  await expect(page.getByRole('heading', { name: 'Transcript', exact: true })).toBeVisible()
  const audio = page.locator('audio')
  await expect.poll(() => audio.evaluate(element => element.duration)).toBeGreaterThan(10)
  await page.getByRole('combobox', { name: 'Speed', exact: true }).selectOption('1.5')
  await expect.poll(() => audio.evaluate(element => element.playbackRate)).toBe(1.5)
  await page.getByRole('button', { name: 'Play audio', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Pause audio', exact: true })).toBeVisible()
  await expect.poll(() => audio.evaluate(element => element.currentTime)).toBeGreaterThan(0)
  await page.getByRole('button', { name: 'Pause audio', exact: true }).click()
  await page.getByRole('slider', { name: 'Audio progress' }).fill('10')
  await expect.poll(() => audio.evaluate(element => element.currentTime)).toBeCloseTo(10, 0)
  await page.getByRole('button', { name: 'Restart audio', exact: true }).click()
  await expect.poll(() => audio.evaluate(element => element.currentTime)).toBe(0)
  await page.getByRole('tab', { name: 'Reading Passage Mode' }).click()
  await expect(page.locator('.ai-suite textarea').first()).toHaveValue(answers[0])
  await page.getByRole('tab', { name: 'Reading Passage Mode' }).press('ArrowRight')
  await expect(page.getByRole('tab', { name: 'Listening Audio Mode' })).toBeFocused()
})

test('weakness analysis filters, checks daily tasks, regenerates and opens focused practice', async ({ page }) => {
  await openTool(page, 'Weakness Analysis')
  await expect(page.getByRole('heading', { name: 'Top 3 Strongest Topics' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Top 3 Weakest Topics' })).toBeVisible()
  await expect(page.getByRole('checkbox')).toHaveCount(7)
  const firstDay = page.getByRole('checkbox').first()
  await firstDay.check()
  await expect(page.getByRole('progressbar', { name: '1 of 7 days complete' })).toBeVisible()
  await page.getByRole('combobox', { name: 'Filter subject', exact: true }).selectOption('Biology')
  await expect(page.getByRole('heading', { name: 'Top 2 Weakest Topics' })).toBeVisible()
  await expect(page.getByRole('progressbar', { name: '0 of 7 days complete' })).toBeVisible()
  await page.getByRole('combobox', { name: 'Filter subject', exact: true }).selectOption('All subjects')
  await expect(firstDay).toBeChecked()
  await page.getByRole('button', { name: 'Regenerate plan' }).click()
  await expect(firstDay).not.toBeChecked()
  await page.getByRole('button', { name: 'Practice Weak Topics Now' }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('combobox', { name: 'Subject', exact: true })).toHaveValue('Mathematics')
  await expect(dialog.getByRole('combobox', { name: 'Topic', exact: true })).toHaveValue('Probability')
  await dialog.getByRole('button', { name: 'Start practice' }).click()
  await expect(page.getByText('Untimed', { exact: true })).toBeVisible()
})

test('all AI pages remain readable and fit desktop and mobile', async ({ page }) => {
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 })
    for (const name of ['AI Tutor', 'Essay Checker', 'Comprehension', 'Weakness Analysis']) {
      await openTool(page, name)
      await expect(page.locator('h1')).toHaveText(name)
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      const smallText = await page.locator('.ai-suite').evaluate(root => [...root.querySelectorAll('p, h2, h3, label, button, li, textarea, select')].filter(el => el.getClientRects().length && parseFloat(getComputedStyle(el).fontSize) < 14).map(el => el.textContent.slice(0, 50)))
      expect(smallText).toEqual([])
      await page.screenshot({ path: `outputs/ai-${name.toLowerCase().replaceAll(' ', '-')}-${width}.png`, fullPage: true })
    }
  }
  expect(errors).toEqual([])
})
