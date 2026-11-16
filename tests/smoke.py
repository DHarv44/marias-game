"""Loads the built game in headless Chromium, checks a fresh save starts locked, then opens the first leaf. Fails on any page error.
Needs: pip install playwright && playwright install chromium"""
import asyncio, pathlib, sys
from playwright.async_api import async_playwright

PAGE = (pathlib.Path(__file__).resolve().parent.parent / 'dist' / 'index.html').as_uri()

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={'width': 390, 'height': 844})
        errors = []
        page.on('pageerror', lambda e: errors.append(str(e)))
        await page.goto(PAGE)
        await page.wait_for_timeout(500)
        locked = await page.evaluate("show('map');document.querySelectorAll('.leaf.locked').length")
        if locked < 70:
            errors.append(f'expected a fresh save to show locked leaves, saw {locked}')
        await page.evaluate("save.seenHelp=true;startLevel(1);0")
        await page.wait_for_timeout(800)
        state = await page.evaluate("[G.level.num, G.cells.filter(Boolean).length]")
        await browser.close()
    if errors:
        sys.exit('page errors: ' + '; '.join(errors))
    print('ok: level', state[0], 'pieces', state[1], 'locked leaves', locked)

asyncio.run(main())
