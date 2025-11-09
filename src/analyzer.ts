/**
 * ===============================================================
 *  Analyzer Module — Intelligenter Project (Debug + Full Data Log)
 * ===============================================================
 */

import axios from "axios";
import dotenv from "dotenv";
import https from "https";
import { updateDomainAnalysis, markDomainError } from "./db";

dotenv.config();

/* ---------------- MOCK HELPERS ---------------- */
function mockVirusTotal(domain: string) {
    return {
        data: {
            id: domain,
            attributes: {
                last_analysis_stats: { malicious: 0, harmless: 75, suspicious: 1, undetected: 4 },
                reputation: 100,
                popularity_ranks: { "Cisco Umbrella": { rank: 1 } },
                tld: "com",
                creation_date: 915148800,
                expiration_date: 1893456000,
                last_analysis_results: {
                    "Mock Engine": { engine_name: "Mock Engine", category: "harmless", result: "clean" }
                }
            }
        }
    };
}

function mockWhois(domain: string) {
    return {
        WhoisRecord: {
            domainName: domain,
            createdDate: "1997-09-15",
            expiresDate: "2028-09-13",
            registrarName: "MockRegistrar",
            registrant: { organization: "Mock Organization", country: "US" }
        }
    };
}

/* ---------------- VIRUSTOTAL ---------------- */
async function fetchVirusTotalRaw(domain: string) {
    if (process.env.USE_MOCK_API === "true") {
        console.log(`Mock VirusTotal data for ${domain}`);
        return mockVirusTotal(domain);
    }

    const apiKey = process.env.VIRUSTOTAL_API_KEY;
    if (!apiKey) throw new Error("VIRUSTOTAL_API_KEY missing");

    const url = `https://www.virustotal.com/api/v3/domains/${domain}`;
    console.log(`[VirusTotal] Fetching: ${url}`);

    const { data } = await axios.get(url, { headers: { "x-apikey": apiKey }, timeout: 15000 });
    console.log("[VirusTotal] Full raw response:");
    console.dir(data, { depth: null });
    return data;
}

function summarizeVirusTotal(raw: any) {
    const attrs = raw.data?.attributes || {};
    const s = attrs.last_analysis_stats || {};
    const total =
        (s.malicious || 0) + (s.suspicious || 0) + (s.harmless || 0) + (s.undetected || 0);

    const results =
        (attrs.last_analysis_results
            ? (Object.values(attrs.last_analysis_results) as {
                engine_name?: string;
                category?: string;
                result?: string;
            }[])
            : []) || [];

    const detected = results.find(r => r.engine_name)?.engine_name;

    return {
        numberOfDetection: s.malicious || 0,
        numberOfScanners: total,
        detectedEngines: detected || "CLEAN MX",
        reputation: attrs.reputation || null,
        rank: attrs.popularity_ranks
            ? (Object.values(attrs.popularity_ranks)[0] as { rank?: number })?.rank ?? null
            : null,
    };
}

/* ---------------- WHOIS ---------------- */
async function fetchWhoisRaw(domain: string) {
    if (process.env.USE_MOCK_API === "true") {
        console.log(`Mock Whois data for ${domain}`);
        return mockWhois(domain);
    }

    const apiKey = process.env.WHOIS_API_KEY;
    if (!apiKey) throw new Error("WHOIS_API_KEY missing");

    const url = "https://www.whoisxmlapi.com/whoisserver/WhoisService";
    const agent = new https.Agent({ rejectUnauthorized: false });
    console.log(`[WHOIS] Fetching: ${url}?domainName=${domain}`);

    try {
        const { data } = await axios.get(url, {
            params: { apiKey, domainName: domain, outputFormat: "JSON" },
            httpsAgent: agent,
            timeout: 15000
        });
        console.log("[WHOIS] Full raw response:");
        console.dir(data, { depth: null });
        return data;
    } catch (err: any) {
        console.error("[WHOIS] Error response:");
        console.dir(err.response?.data || err.message, { depth: null });
        throw err;
    }
}

function summarizeWhois(raw: any) {
    const r = raw.WhoisRecord || {};
    return {
        dateCreated: r.createdDate || "Unknown",
        ownerName: r.registrant?.organization || r.registrarName || "Unknown",
        expiredOn: r.expiresDate || "Unknown"
    };
}

/* ---------------- MAIN ---------------- */
export async function analyzeDomain(domain: string) {
    try {
        console.log(`\n[Analyzer] Starting analysis for: ${domain}`);

        const [vtRaw, whoisRaw] = await Promise.all([
            fetchVirusTotalRaw(domain),
            fetchWhoisRaw(domain)
        ]);

        const vtCompact = summarizeVirusTotal(vtRaw);
        const whoisCompact = summarizeWhois(whoisRaw);

        console.log("\n[Analyzer] Summary results:");
        console.dir({ vtCompact, whoisCompact }, { depth: null });

        await updateDomainAnalysis(domain, JSON.stringify(whoisCompact), JSON.stringify(vtCompact));

        console.log(`${domain} analysis complete.`);
        return { virustotal: vtCompact, whois: whoisCompact };
    } catch (err: any) {
        console.error("Analyze error:", err.message);
        await markDomainError(domain, { error: err.message || String(err) });
        return {
            virustotal: { numberOfDetection: 0, numberOfScanners: 0, detectedEngines: "Unknown" },
            whois: { dateCreated: "Unknown", ownerName: "Unknown", expiredOn: "Unknown" }
        };
    }
}
