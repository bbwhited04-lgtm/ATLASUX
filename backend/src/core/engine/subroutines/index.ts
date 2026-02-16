import type { IntentRecord, Packet } from "../types.js";
import { binkyPacket } from "./binky.js";
import { treasurerPacket } from "./treasurer.js";
import { secretaryPacket } from "./secretary.js";
import { jennyPacket } from "./jenny.js";
import { bennyPacket } from "./benny.js";

export async function runSubroutines(intent: IntentRecord): Promise<Packet[]> {
  // These do NOT execute anything. They only produce advisory packets.
  return [
    await binkyPacket(intent),
    await treasurerPacket(intent),
    await secretaryPacket(intent),
    await jennyPacket(intent),
    await bennyPacket(intent),
  ];
}

