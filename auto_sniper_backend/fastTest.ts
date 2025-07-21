import { setupBrowser } from "./src/utils/puppeteer";
import { scrapeOtomotoDescription } from "./src/deep-search/otomoto";
import { sendEmail } from "./src/email/email";

const emailHtml = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2>Your Search is Complete! 🚗</h2>
  <p>Your search for <strong>BMW 320d</strong> found 10 results.</p>
  <p>You can access your results here: 
    <a href="https://auto-sniper-mocha.vercel.app//results/123" style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
      View Results
    </a>
  </p>
</div>
`;

(async () => {
  await sendEmail("kisiel3141@gmail.com", "Search Complete: BMW 320d (10 results)", emailHtml);
})();
