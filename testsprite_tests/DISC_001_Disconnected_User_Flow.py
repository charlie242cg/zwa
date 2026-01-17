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
        # -> Click on a product card to navigate to the product detail page.
        frame = context.pages[-1]
        # Click on the first product card in the 'Produits Populaires' section
        elem = frame.locator('xpath=html/body/div').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click on the second product card to try navigating to the product detail page.
        frame = context.pages[-1]
        # Click on the second product card in the 'Produits Populaires' section
        elem = frame.locator('xpath=html/body/div/div/main/div/div/div[6]/a[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Scroll to the reviews section and verify if reviews are displayed.
        await page.mouse.wheel(0, 500)
        

        # -> Click on the 'Voir la Boutique' button to navigate to the shop page.
        frame = context.pages[-1]
        # Click on the 'Voir la Boutique' button to navigate to the shop page
        elem = frame.locator('xpath=html/body/div/div/main/div/div[3]/div[2]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click on the 'Acheter Maintenant' button to verify redirection to the authentication page.
        frame = context.pages[-1]
        # Click on the 'Acheter Maintenant' (Buy Now) button to test authentication redirection
        elem = frame.locator('xpath=html/body/div/div/main/div/div[3]/div[5]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Try to find and click on a different product that is in stock to test the purchase and authentication flow.
        await page.mouse.wheel(0, await page.evaluate('() => window.innerHeight'))
        

        # -> Click on 'Accueil' link to navigate back to the home page.
        frame = context.pages[-1]
        # Click on 'Accueil' link to go back to home page
        elem = frame.locator('xpath=html/body/div/div/nav/a').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Try clicking the 'Se connecter' link or another navigation element to leave the product detail page and return to home or main page.
        frame = context.pages[-1]
        # Click on 'Se connecter' link to navigate away from product detail page
        elem = frame.locator('xpath=html/body/div/div/nav/a[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # --> Assertions to verify final state
        frame = context.pages[-1]
        await expect(frame.locator('text=Accueil').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Se connecter').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Email').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Mot de passe').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Se connecter').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Pas encore de compte ? S\'inscrire').first).to_be_visible(timeout=30000)
        await asyncio.sleep(5)
    
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()
            
asyncio.run(run_test())
    