/**
 * ===============================================================
 *  Scheduler — Intelligenter Project (Final Fixed Version)
 * ===============================================================
 */

import { getAllDomains, updateDomainAnalysis } from "./db";
import { analyzeDomain } from "./analyzer";

const DAY_MS = 24 * 60 * 60 * 1000; // 1 day
const DAYS_BETWEEN_CHECKS = 30;     // run full re-analysis once every 30 days
let dayCounter = 0;

/**
 * Starts the scheduler:
 * Runs once immediately, then performs a small daily check.
 * Only triggers a full re-scan every 30 days.
 */
export async function runScheduler() {
  console.log("Scheduler started. Running initial check...");
  await runCheck();

  console.log("Daily checks active — full analysis runs every 30 days.");
  setInterval(dailyCheck, DAY_MS);
}

/**
 * Called once a day — triggers full runCheck every 30 days.
 */
async function dailyCheck() {
  dayCounter++;
  if (dayCounter >= DAYS_BETWEEN_CHECKS) {
    console.log(`\n[Scheduler] 30 days reached — running full analysis...`);
    await runCheck();
    dayCounter = 0;
  }
}

/**
 * Performs a full scan cycle.
 * Re-analyzes domains that are missing or outdated.
 */
async function runCheck() {
  try {
    const domains = await getAllDomains();
    if (!domains.length) {
      console.log("[Scheduler] No domains in database. Skipping check.");
      return;
    }

    const now = Date.now();
    let updated = 0;

    for (const domain of domains) {
      const status = domain.status?.toLowerCase?.() || "unknown";
      const lastScan = new Date(domain.last_scan_date || 0).getTime();
      const age = now - lastScan;

      if (status === "pending" || status === "analyzing") continue;

      // Needs recheck if never scanned or older than 30 days
      if (!lastScan || age > DAYS_BETWEEN_CHECKS * DAY_MS) {
        console.log(`Re-analyzing ${domain.domain}...`);
        const result = await analyzeDomain(domain.domain);

        await updateDomainAnalysis(
          domain.domain,
          JSON.stringify(result.whois, null, 2),
          JSON.stringify(result.virustotal, null, 2)
        );

        console.log(`${domain.domain} re-analysis complete.`);
        updated++;
      }
    }

    if (updated === 0)
      console.log("[Scheduler] All domains are up-to-date.\n");
    else
      console.log(`[Scheduler] Completed ${updated} domain re-scans.\n`);
  } catch (err) {
    console.error("Scheduler error:", err);
  }
}
