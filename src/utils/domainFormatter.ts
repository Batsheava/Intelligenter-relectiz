/**
 * ===============================================================
 *  Domain Formatter Utility (Final — handles DB & live data)
 * ===============================================================
 */
export interface SimplifiedDomainData {


    domain: string;
    vt_summary: {
        malicious: number;
        harmless: number;
        suspicious: number;
        undetected: number;
        reputation?: number;
        rank?: number | null;
        tld?: string;
        creation_date?: string;
        expiration_date?: string;
        last_analysis_date?: string;
    };
    whois_summary: {
        createdDate?: string;
        expiresDate?: string;
        registrar?: string;
        registrant_country?: string;
        organization?: string;
    };
}

export function simplifyAnalysis(raw: any): SimplifiedDomainData {
    if (!raw) throw new Error("Empty domain data");

    const clean = (val?: any): string | undefined => {
        if (
            val === undefined ||
            val === null ||
            val === "N/A" ||
            val === "Unknown" ||
            val === "null"
        )
            return undefined;
        return String(val);
    };

    const formatDate = (val?: number | string): string | undefined => {
        if (!val || val === "N/A") return undefined;
        const date = typeof val === "number" ? new Date(val * 1000) : new Date(val);
        return isNaN(date.getTime()) ? undefined : date.toISOString().split("T")[0];
    };

    if (raw.VTData?.error || raw.WhoisData?.error) {
        return {
            domain: raw.domain || "unknown",
            vt_summary: { malicious: 0, harmless: 0, suspicious: 0, undetected: 0 },
            whois_summary: {}
        };
    }

    const vt = raw.VTData?.data?.attributes || raw.VTData?.attributes || raw.VTData || {};
    const whois = raw.WhoisData?.WhoisRecord || raw.WhoisData || {};
    const whoisRegistry = whois.registryData || {};
    const whoisRegistrant = whois.registrant || {};

    const detections = vt.last_analysis_stats?.malicious ?? vt.numberOfDetection ?? 0;
    const scanners = vt.last_analysis_stats
        ? Object.values(vt.last_analysis_stats).reduce((a: number, b: any) => a + (b || 0), 0)
        : vt.numberOfScanners ?? 0;
    const harmless =
        vt.last_analysis_stats?.harmless ?? (scanners > 0 ? scanners - detections : 0);

    return {
        domain:
            clean(raw.domain) ||
            clean(raw.VTData?.data?.id) ||
            clean(whois.domainName) ||
            "unknown",

        vt_summary: {
            malicious: detections,
            harmless,
            suspicious: vt.last_analysis_stats?.suspicious ?? 0,
            undetected: vt.last_analysis_stats?.undetected ?? 0,
            reputation: vt.reputation,
            rank:
                vt.popularity_ranks
                    ? (Object.values(vt.popularity_ranks)[0] as { rank?: number })?.rank ?? null
                    : vt.rank ?? null,
            tld: vt.tld,
            creation_date: formatDate(vt.creation_date),
            expiration_date: formatDate(vt.expiration_date),
            last_analysis_date: formatDate(vt.last_analysis_date)
        },

        whois_summary: {
            createdDate:
                clean(whois.createdDate) ||
                clean(whois.dateCreated) ||
                clean(whoisRegistry.createdDate) ||
                clean(whois.createdDateNormalized),
            expiresDate:
                clean(whois.expiresDate) ||
                clean(whois.expiredOn) ||
                clean(whoisRegistry.expiresDate) ||
                clean(whois.expiresDateNormalized),
            registrar:
                clean(whois.registrarName) ||
                clean(whoisRegistry.registrarName) ||
                undefined,
            registrant_country:
                clean(whoisRegistrant.country) ||
                clean(whois.registryData?.registrant?.country),
            organization:
                clean(whoisRegistrant.organization) ||
                clean(whois.organization) ||
                clean(whois.ownerName) || // fallback here
                clean(whois.registryData?.registrant?.organization)
        }
    };
}
