/**
 * ===============================================================
 *  Controller Layer — Intelligenter Project (Kafka integrated)
 * ===============================================================
 */

import { Request, Response } from "express";
import { insertDomain, getDomainByName, getAllDomains } from "../db";
import { kafkaProducer } from "../kafka";
import { validateDomain } from "../utils/domainValidator";
import { simplifyAnalysis } from "../utils/domainFormatter";

/* ------------------ GET /domains?domain= ------------------ */
export async function handleGetDomain(req: Request, res: Response) {
    try {
        const domain = req.query.domain as string;
        const result = validateDomain(domain);

        if (!result.valid) {
            return res.status(400).json({ error: result.reason || "Invalid or missing domain parameter." });
        }

        const record = await getDomainByName(domain);

        if (record && record.status === "completed") {
            try {
                const VTData = JSON.parse(record.virustotal_data || "{}");
                const WhoisData = JSON.parse(record.whois_data || "{}");

                // FIX: pass domain for fallback
                const simplified = simplifyAnalysis({ VTData, WhoisData, domain });

                return res.json({
                    domain,
                    status: "completed",
                    analysis: simplified
                });
            } catch {
                return res.status(500).json({ error: "Failed to parse stored data." });
            }
        }

        if (record && record.status === "analyzing") {
            return res.json({ domain, status: "onAnalysis" });
        }

        await insertDomain(domain);
        await kafkaProducer.connect();
        await kafkaProducer.send({
            topic: process.env.KAFKA_TOPIC!,
            messages: [{ value: domain }]
        });
        await kafkaProducer.disconnect();

        console.log(`Enqueued analysis for ${domain}`);
        res.json({ domain, status: "onAnalysis" });
    } catch (error) {
        console.error("GET /domains error:", error);
        res.status(500).json({ error: "Internal server error." });
    }
}

/* ------------------ POST /domains ------------------ */
export async function handlePostDomain(req: Request, res: Response) {
    try {
        const { domain } = req.body;
        const result = validateDomain(domain);

        if (!result.valid) {
            return res.status(400).json({ error: result.reason || "Invalid or missing domain name." });
        }

        const record = await getDomainByName(domain);

        if (record && record.status === "completed") {
            try {
                const VTData = JSON.parse(record.virustotal_data || "{}");
                const WhoisData = JSON.parse(record.whois_data || "{}");

                // FIX: pass domain for fallback
                const simplified = simplifyAnalysis({ VTData, WhoisData, domain });

                return res.json({
                    message: "Domain already analyzed. Returning cached result.",
                    analysis: simplified
                });
            } catch {
                return res.status(500).json({ error: "Failed to parse stored data." });
            }
        }

        await insertDomain(domain);
        await kafkaProducer.connect();
        await kafkaProducer.send({
            topic: process.env.KAFKA_TOPIC!,
            messages: [{ value: domain }]
        });
        await kafkaProducer.disconnect();

        console.log(`Domain submitted for analysis: ${domain}`);
        res.status(202).json({ message: "Domain submitted for analysis", domain });
    } catch (error) {
        console.error("POST /domains error:", error);
        res.status(500).json({ error: "Internal server error." });
    }
}

/* ------------------ GET /domains ------------------ */
export async function handleGetAllDomains(_req: Request, res: Response) {
    try {
        const domains = await getAllDomains();
        res.json(domains);
    } catch (error) {
        console.error("GET /domains error:", error);
        res.status(500).json({ error: "Internal server error." });
    }
}
