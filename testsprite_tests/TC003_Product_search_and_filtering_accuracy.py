import asyncio
from playwright import async_api
from playwright.async_api import expect

async def run_test():
    pw = None
    browser = None
    context = None
    
    try:
        # Start a Playwright session in asynchronous mode
        pw = await async_api.async_playwright().start()
        
        # Launch a Chromium browser in headless mode with custom arguments
        browser = await pw.chromium.launch(
            headless=True,
            args=[
                "--window-size=1280,720",         # Set the browser window size
                "--disable-dev-shm-usage",        # Avoid using /dev/shm which can cause issues in containers
                "--ipc=host",                     # Use host-level IPC for better stability
                "--single-process"                # Run the browser in a single process mode
            ],
        )
        
        # Create a new browser context (like an incognito window)
        context = await browser.new_context()
        context.set_default_timeout(5000)
        
        # Open a new page in the browser context
        page = await context.new_page()
        
        # Navigate to your target URL and wait until the network request is committed
        await page.goto("http://localhost:5173", wait_until="commit", timeout=10000)
        
        # Wait for the main page to reach DOMContentLoaded state (optional for stability)
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=3000)
        except async_api.Error:
            pass
        
        # Iterate through all iframes and wait for them to load as well
        for frame in page.frames:
            try:
                await frame.wait_for_load_state("domcontentloaded", timeout=3000)
            except async_api.Error:
                pass
        
        # Interact with the page elements to simulate user flow
        # -> Enter a search keyword for product names in the search input
        frame = context.pages[-1]
        # Enter the search keyword 'Baby' in the product search input
        elem = frame.locator('xpath=html/body/div/div/main/div/div/div/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('Baby')
        

        # -> Apply price filter with min and max values
        frame = context.pages[-1]
        # Click the 'Effacer la recherche' button to clear search for next steps
        elem = frame.locator('xpath=html/body/div/div/main/div/div/div/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Apply price filter with min and max values
        frame = context.pages[-1]
        # Click on 'Électronique' category to filter products by category
        elem = frame.locator('xpath=html/body/div/div/main/div/div/div[2]/div/div').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Apply price filter with min and max values instead of category filter
        frame = context.pages[-1]
        # Enter minimum price filter value
        elem = frame.locator('xpath=html/body/div/div/main/div/div/div/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('1000')
        

        # -> Enter maximum price filter value
        frame = context.pages[-1]
        # Enter maximum price filter value
        elem = frame.locator('xpath=html/body/div/div/main/div/div/div/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('30000')
        

        # -> Apply category filter selecting multiple categories
        frame = context.pages[-1]
        # Click on 'Électronique' category to filter products by category
        elem = frame.locator('xpath=html/body/div/div/main/div/div/div[2]/div/div').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        frame = context.pages[-1]
        # Click on 'Mode' category to add another category filter
        elem = frame.locator('xpath=html/body/div/div/main/div/div/div[2]/div/div[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        frame = context.pages[-1]
        # Click on 'Maison' category to add another category filter
        elem = frame.locator('xpath=html/body/div/div/main/div/div/div[2]/div/div[3]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Clear filters and search to reset product display
        frame = context.pages[-1]
        # Click 'Effacer la recherche' button to clear all filters and search input
        elem = frame.locator('xpath=html/body/div/div/main/div/div/div[3]/div/div').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # --> Assertions to verify final state
        frame = context.pages[-1]
        try:
            await expect(frame.locator('text=No Relevant Products Found').first).to_be_visible(timeout=1000)
        except AssertionError:
            raise AssertionError("Test plan execution failed: Product search and filter functionality did not behave as expected. The test case failed because the search results, price filters, and category filters did not return or display the correct products as per the test plan.")
        await asyncio.sleep(5)
    
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()
            
asyncio.run(run_test())
    