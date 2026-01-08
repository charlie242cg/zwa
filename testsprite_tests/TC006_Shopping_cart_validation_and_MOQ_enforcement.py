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
        # -> Click on 'Se connecter' to log in as buyer utilisateurtest@gmail.com
        frame = context.pages[-1]
        # Click on 'Se connecter' to open login form
        elem = frame.locator('xpath=html/body/div/div/nav/a[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Input email and password, then click 'Se connecter' to log in as buyer utilisateurtest@gmail.com
        frame = context.pages[-1]
        # Input buyer email
        elem = frame.locator('xpath=html/body/div/div/main/div/div/form/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('utilisateurtest@gmail.com')
        

        frame = context.pages[-1]
        # Input buyer password
        elem = frame.locator('xpath=html/body/div/div/main/div/div/form/div[2]/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('Sweetmoney')
        

        frame = context.pages[-1]
        # Click 'Se connecter' button to submit login form
        elem = frame.locator('xpath=html/body/div/div/main/div/div/form/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click on product 'Esculape trousse de secour pour 1 a 5 personnes' with MOQ 100 to test adding below MOQ
        frame = context.pages[-1]
        # Click on product with MOQ 100 to open product detail page
        elem = frame.locator('xpath=html/body/div/div/main/div/div/div[6]/a[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Set quantity to 50 (below MOQ) and click 'Acheter Maintenant' to test if adding below MOQ is blocked
        frame = context.pages[-1]
        # Click '-' button to reduce quantity from 100 to 50 (click 50 times)
        elem = frame.locator('xpath=html/body/div/div/main/div/div[3]/div[5]/div/div[2]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click 'Acheter Maintenant' to attempt adding product with quantity below MOQ and verify if blocked with notification
        frame = context.pages[-1]
        # Click 'Acheter Maintenant' button to attempt adding product to cart with quantity below MOQ
        elem = frame.locator('xpath=html/body/div/div/main/div/div[3]/div[5]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click 'Acheter Maintenant' to add product with quantity 100 (equal to MOQ) to cart and verify successful addition and cart update
        frame = context.pages[-1]
        # Click 'Acheter Maintenant' button to add product with quantity 100 to cart
        elem = frame.locator('xpath=html/body/div/div/main/div/div[3]/div[5]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # --> Assertions to verify final state
        frame = context.pages[-1]
        try:
            await expect(frame.locator('text=MOQ restriction overridden by negotiated offer').first).to_be_visible(timeout=1000)
        except AssertionError:
            raise AssertionError("Test case failed: Buyer cart does not respect product MOQ rules. Adding product below MOQ without a negotiated offer was not blocked, or the appropriate notification was not shown as expected.")
        await asyncio.sleep(5)
    
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()
            
asyncio.run(run_test())
    