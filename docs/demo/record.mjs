// Records the Trailmark demo against a locally running app (backend + frontend).
//
//   Backend (Docker, saved-results mode so the AI is not called and results are repeatable):
//     LLM_API_KEY empty -> the analysis step returns the saved real-AI run in backend/saved_results/
//   Frontend: cd frontend && npm run dev
//
//   DEMO_URL=http://localhost:3000 node record.mjs
//
// Output: trailmark-demo.webm and frames/NN.png (key frames used by make_gif.py).
// The journey is live: lead creates a handover and uploads the synthetic sources, the departing
// member answers a question, the lead resolves conflicts and approves, the incoming member
// confirms receipt. Only the AI analysis step itself shows the saved run.
import { chromium } from "playwright";
import { mkdirSync, rmSync, renameSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.env.DEMO_URL ?? "http://localhost:3000";
const W = 1280;
const H = 800;

rmSync(path.join(here, "frames"), { recursive: true, force: true });
rmSync(path.join(here, "video-tmp"), { recursive: true, force: true });
mkdirSync(path.join(here, "frames"), { recursive: true });

const browser = await chromium.launch({ channel: "chrome", headless: true });
const ctx = await browser.newContext({
  viewport: { width: W, height: H },
  recordVideo: { dir: path.join(here, "video-tmp"), size: { width: W, height: H } },
});
await ctx.addInitScript(() => {
  window.__cap = (text) => {
    let el = document.getElementById("__demo_cap");
    if (!el) {
      el = document.createElement("div");
      el.id = "__demo_cap";
      el.style.cssText =
        "position:fixed;left:0;right:0;bottom:0;z-index:99999;padding:14px 24px;" +
        "background:rgba(17,24,39,.92);color:#fff;font:600 22px system-ui,sans-serif;text-align:center;";
      document.documentElement.appendChild(el);
    }
    el.textContent = text;
    el.style.display = text ? "block" : "none";
  };
});
const page = await ctx.newPage();
page.on("dialog", (d) => d.accept());
let frameNo = 0;
const caption = async (text, holdMs = 2600) => {
  await page.evaluate((t) => window.__cap(t), text);
  await page.waitForTimeout(holdMs);
  frameNo += 1;
  await page.screenshot({ path: path.join(here, "frames", String(frameNo).padStart(2, "0") + ".png") });
  // Clear the caption as soon as its hold is over, so it can never sit on top of the next page
  // while the app is navigating or switching persona.
  await page.evaluate(() => window.__cap(""));
};
const enter = async (re) => {
  await page.getByRole("button", { name: re }).click();
  await page.waitForTimeout(3000);
};

// ---- Scene 1: roles ----
await page.goto(BASE);
await page.getByRole("button", { name: /Enter as Team Lead/ }).waitFor();
await caption("Trailmark: when someone leaves a project, their knowledge shouldn't leave with them");
await enter(/Enter as Team Lead/);

// ---- Scene 2: lead creates a handover and imports sources ----
await page.getByRole("button", { name: "New Handover" }).first().click();
await page.locator("#f1-field-1").fill("Campus Events App");
await page.locator("#f1-field-2").fill("Asha is leaving - backend handover");
await caption("Team lead creates a handover for the leaving developer");
await page.locator("button[type=submit]", { hasText: "Create Handover" }).click();
await page.waitForTimeout(2500);
await page.getByRole("button", { name: /Upload Synthetic Manifest/ }).click();
await page.getByText("Team Chat Archive").first().waitFor({ timeout: 30000 });
await page.waitForTimeout(1500);
// The synthetic set includes one deliberately empty file, which the importer reports as a
// failure. Dismiss that banner so the frame shows the imported sources, not a red alert.
await page.getByRole("button", { name: "Dismiss" }).click().catch(() => {});
await page.waitForTimeout(400);
await caption("Sources imported: repo, chat, tasks and docs, each with an access level");

// ---- Scene 3: analysis ----
await page.getByRole("button", { name: /Run AI Analysis Pipeline/ }).click();
await page.getByText(/AI Analysis completed/).waitFor({ timeout: 180000 });
await page.waitForTimeout(800);
await caption("Analysis: 54 verified, 3 conflicting, 9 questions for the leaver (saved AI run)", 3200);

// ---- Scene 4: departing member answers ----
await page.getByRole("button", { name: "Switch Persona" }).click();
await page.waitForTimeout(1500);
await enter(/Enter as Departing/);
await page.getByRole("button", { name: /Start Handover Interview/ }).click();
await page.waitForTimeout(2500);
await page.locator('textarea[aria-label="Your answer"]').fill(
  "Nobody owns the S3 backup task. I set it up as a nightly cron on Render; the credentials live in the Render dashboard and the bucket policy was never finished.",
);
await caption("The leaver gets a specific question, with the evidence that raised it");
await page.getByRole("button", { name: /Save Answer/ }).first().click();
await page.waitForTimeout(1500);
await caption("Answer saved. Unanswered questions would stay visible as open gaps");
await page.getByRole("button", { name: /Save & Exit/ }).first().click();
await page.waitForTimeout(800);
await page.getByRole("button", { name: /Save & Exit/ }).last().click();
await page.waitForTimeout(2500);

// ---- Scene 5: lead reviews, resolves conflicts, approves ----
await enter(/Enter as Team Lead/);
await page.getByRole("button", { name: /Review & Verification/ }).first().click();
await page.waitForTimeout(2500);
await caption("Lead review: every statement links to a quote in its source", 3200);
await page.getByRole("button", { name: /^Conflicts \(/ }).click();
await page.waitForTimeout(1500);
await caption("Three conflicts between sources. Approval is blocked until each is resolved", 3200);
let resolved = 0;
while (await page.getByRole("button", { name: /Resolve Conflict/ }).count()) {
  await page.getByRole("button", { name: /Resolve Conflict/ }).first().click();
  await page.locator('input[name="chosen_piece"]').first().check();
  await page.locator("#f3-field-1").fill("Newer chat discussion supersedes the earlier design doc.");
  if (resolved === 0) await caption("Resolving needs a chosen source and a written reason");
  await page.getByRole("button", { name: /Resolve & Mark Verified/ }).click();
  await page.waitForTimeout(1500);
  resolved += 1;
  if (resolved > 6) throw new Error("conflicts not clearing");
}
await page.getByRole("button", { name: /Approve Handover/ }).waitFor();
await page.getByRole("button", { name: /Approve Handover/ }).click();
await page.getByText(/Approved & Published/).waitFor({ timeout: 15000 });
await caption("Lead approves. Nothing is shared with the successor before this", 3000);

// ---- Scene 6: incoming member ----
await page.getByRole("button", { name: "Switch Persona" }).click();
await page.waitForTimeout(1500);
await enter(/Enter as Incoming/);
await caption("The successor sees only the approved, permission-filtered handover", 3200);
await page.getByRole("button", { name: /Confirm Receipt/ }).click();
await page.getByText(/Receipt Confirmed/).waitFor({ timeout: 15000 });
// Only claim the restriction in the caption if the page really does not show those sources.
const successorText = await page.locator("body").innerText();
if (/HR Private|Lead 1-on-1/i.test(successorText)) throw new Error("restricted source visible to the successor");
await caption("Receipt confirmed. Lead-only sources (private chat, HR notes) do not appear", 3500);

await ctx.close();
await browser.close();

const vids = readdirSync(path.join(here, "video-tmp")).filter((f) => f.endsWith(".webm"));
renameSync(path.join(here, "video-tmp", vids[0]), path.join(here, "trailmark-demo.webm"));
rmSync(path.join(here, "video-tmp"), { recursive: true, force: true });
console.log("saved trailmark-demo.webm and", frameNo, "frames");
