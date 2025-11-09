/**
 * ===============================================================
 *  Domain Validator — RFC-Compliant + Diagnostic Feedback
 * ===============================================================
 */

const RESERVED = [
    "localhost",
    "localdomain",
    "example",
    "invalid",
    "test",
    "internal",
    "lan",
    "home",
    "docker",
    "docker-test",
];

// Regex for labels (no leading/trailing hyphen, 1–63 chars)
const DOMAIN_REGEX =
    /^(?!-)[A-Za-z0-9-]{1,63}(?<!-)(?:\.(?!-)[A-Za-z0-9-]{1,63}(?<!-))*$/;

/**
 * Checks if a string is a syntactically valid public domain name.
 * Returns an object { valid: boolean, reason?: string }
 */
export function validateDomain(domain: string): { valid: boolean; reason?: string } {
    if (typeof domain !== "string") {
        return { valid: false, reason: "Input is not a string" };
    }

    const d = domain.trim().toLowerCase();

    if (!d) return { valid: false, reason: "Empty string" };
    if (d.length > 253) return { valid: false, reason: "Domain exceeds 253 characters" };
    if (d.startsWith(".") || d.endsWith(".")) return { valid: false, reason: "Cannot start or end with a dot" };
    if (d.includes("..")) return { valid: false, reason: "Consecutive dots are not allowed" };

    const parts = d.split(".");
    if (parts.length < 2) return { valid: false, reason: "Missing top-level domain" };

    if (RESERVED.includes(d) || RESERVED.includes(parts[0])) {
        return { valid: false, reason: `Reserved or internal domain (${parts[0]})` };
    }

    // IP address check
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(d)) {
        return { valid: false, reason: "IP address provided instead of domain" };
    }

    // Syntax pattern match
    if (!DOMAIN_REGEX.test(d)) {
        return { valid: false, reason: "Invalid domain structure or illegal characters" };
    }

    // Label length checks
    if (parts.some((p) => p.length > 63)) {
        return { valid: false, reason: "A label exceeds 63 characters" };
    }

    // TLD checks
    const tld = parts[parts.length - 1];
    if (!/^[a-z]{2,63}$/.test(tld)) {
        return { valid: false, reason: "Invalid top-level domain (must be letters only, 2–63 chars)" };
    }

    // Reject duplicate TLDs (e.g. google.com.com)
    if (parts.length >= 3 && tld === parts[parts.length - 2]) {
        return { valid: false, reason: "Duplicated TLD (e.g. google.com.com)" };
    }

    // Passed all tests
    return { valid: true };
}