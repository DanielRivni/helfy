import { Kafka, logLevel } from 'kafkajs';

const broker = process.env.KAFKA_BROKER || 'localhost:9092';
const kafka = new Kafka({
  clientId: 'auth-api',
  brokers: broker.split(','),
  logLevel: logLevel.NOTHING
});

let producer;
let ensured = false;
const topic = 'user-events';

async function ensureTopic() {
  const admin = kafka.admin();
  try {
    await admin.connect();
    if (!ensured) {
      await admin.createTopics({
        topics: [{ topic }],
        waitForLeaders: true
      });
      ensured = true;
    }
  } catch (e) {
    console.warn('[kafka] ensureTopic failed:', e.message);
  } finally {
    await admin.disconnect().catch(() => {});
  }
}

export async function getProducer() {
  if (!producer) {
    producer = kafka.producer();
    try {
      await producer.connect();
      await ensureTopic();
    } catch (e) {
      console.warn('[kafka] connect failed:', e.message);
    }
  }
  return producer;
}

export async function sendUserEvent(type, payload) {
  try {
    const p = await getProducer();
    if (!p) return;
    await p.send({
      topic,
      messages: [
        {
          key: type,
          value: JSON.stringify({ type, ts: new Date().toISOString(), ...payload })
        }
      ]
    });
  } catch (e) {
    console.warn('[kafka] send failed:', e.message);
  }
}
