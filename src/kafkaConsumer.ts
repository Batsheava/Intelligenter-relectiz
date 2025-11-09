/**
 * ===============================================================
 *  Kafka Consumer — Intelligenter Project
 * ===============================================================
 *  Listens for domain analysis jobs and processes them asynchronously.
 * ===============================================================
 */

import { kafkaConsumer } from "./kafka";
import { analyzeDomain } from "./analyzer";

export async function initKafkaConsumer() {
    const topic = process.env.KAFKA_TOPIC!;
    const groupId = process.env.KAFKA_GROUP_ID!;
    console.log(`[Kafka] Initializing consumer (group: ${groupId}, topic: ${topic})...`);

    // Retry loop in case Redpanda isn't ready immediately
    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            await kafkaConsumer.connect();
            await kafkaConsumer.subscribe({ topic, fromBeginning: false });
            console.log(`[Kafka]  Consumer subscribed to topic: ${topic} (attempt ${attempt})`);
            break;
        } catch (err) {
            console.error(`[Kafka]  Attempt ${attempt} to connect failed:`, err);
            if (attempt === 3) throw err;
            await new Promise((r) => setTimeout(r, 3000)); // wait 3s before retry
        }
    }

    await kafkaConsumer.run({
        eachMessage: async ({ topic, message }: { topic: string; message: any }) => {
            const domain = message.value?.toString();
            if (!domain) return;

            console.log(`[Kafka] Received new analysis task: ${domain}`);

            try {
                await analyzeDomain(domain);
                console.log(`[Kafka] Completed analysis for ${domain}`);
            } catch (err) {
                console.error(`[Kafka] Analysis failed for ${domain}:`, err);
            }
        },
    });
}
