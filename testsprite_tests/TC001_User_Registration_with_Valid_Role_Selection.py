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
        await page.goto("http://localhost:5173/register", wait_until="commit", timeout=10000)
        
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
        # -> Locate the role selection dropdown to select 'Vendeur' (Seller) role.
        await page.mouse.wheel(0, await page.evaluate('() => window.innerHeight'))
        

        # -> Try to reload the page or navigate back and then to /auth to ensure the registration form loads properly.
        await page.goto('http://localhost:5173/auth', timeout=10000)
        await asyncio.sleep(3)
        

        # -> Click the toggle link 'Pas encore de compte ? S'inscrire' to switch to registration mode.
        frame = context.pages[-1]
        # Click the toggle link to switch to registration mode
        elem = frame.locator('xpath=html/body/div/div/main/div/div/p').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Select 'Vendeur' from the role dropdown, fill in Full Name, Email, Password, then submit the form.
        frame = context.pages[-1]
        # Fill in Full Name
        elem = frame.locator('xpath=html/body/div/div/main/div/div/form/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('Utilisateur Test Vendeur')
        

        frame = context.pages[-1]
        # Fill in Email
        elem = frame.locator('xpath=html/body/div/div/main/div/div/form/div[2]/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('utilisateurtestvendeur@gmail.com')
        

        frame = context.pages[-1]
        # Fill in Password
        elem = frame.locator('xpath=html/body/div/div/main/div/div/form/div[3]/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('Sweetmoney')
        

        frame = context.pages[-1]
        # Click the 'S'inscrire' button to submit the registration form
        elem = frame.locator('xpath=html/body/div/div/main/div/div/form/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Click 'Se connecter' button to log in with the registered user and verify successful login and landing page.
        frame = context.pages[-1]
        # Click 'Se connecter' button to log in with registered user
        elem = frame.locator('xpath=html/body/div/div/main/div/div/form/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # --> Assertions to verify final state
        frame = context.pages[-1]
        try:
            await expect(frame.locator('text=Registration Complete! Welcome, Seller')).to_be_visible(timeout=1000)
        except AssertionError:
            raise AssertionError("Test case failed: User registration for role 'Seller' did not complete successfully or the user was not redirected to the appropriate landing page as expected.")
        await asyncio.sleep(5)
    
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()
            
asyncio.run(run_test())
    