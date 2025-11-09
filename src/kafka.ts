/**
 * ===============================================================
 *  Kafka Connection — Intelligenter Project
 * ===============================================================
 *  Shared Kafka (Redpanda) connector for producer + consumer.
 * ===============================================================
 */

import { Kafka } from "kafkajs";
import dotenv from "dotenv";

dotenv.config();

const kafka = new Kafka({
    clientId: "intelligenter-app",
    brokers: [process.env.KAFKA_BROKER!],
    ssl: true,
    sasl: {
        mechanism: process.env.KAFKA_MECHANISM as "scram-sha-256",
        username: process.env.KAFKA_USERNAME!,
        password: process.env.KAFKA_PASSWORD!,
    },
});


// Create reusable producer and consumer instances
export const kafkaProducer = kafka.producer();
export const kafkaConsumer = kafka.consumer({
    groupId: process.env.KAFKA_GROUP_ID!,
});
export default kafka;