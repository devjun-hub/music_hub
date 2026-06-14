import { Mp3Encoder } from "@breezystack/lamejs";
import type { Mp3DoneMessage, Mp3EncodeRequest, Mp3ProgressMessage } from "./mp3Encoder.types";

const ctx = self as unknown as Worker;

/** lamejs 권장 인코딩 단위 (MPEG 1 프레임당 샘플 수) */
const SAMPLES_PER_FRAME = 1152;

function floatTo16BitPCM(input: Float32Array): Int16Array {
  const output = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const sample = Math.max(-1, Math.min(1, input[i]));
    output[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
  }
  return output;
}

ctx.onmessage = (event: MessageEvent<Mp3EncodeRequest>) => {
  const { channelData, sampleRate, kbps } = event.data;
  const numChannels = channelData.length;
  const encoder = new Mp3Encoder(numChannels, sampleRate, kbps);

  const left = floatTo16BitPCM(channelData[0]);
  const right = numChannels > 1 ? floatTo16BitPCM(channelData[1]) : undefined;
  const totalSamples = left.length;

  const chunks: Uint8Array[] = [];

  for (let i = 0; i < totalSamples; i += SAMPLES_PER_FRAME) {
    const leftChunk = left.subarray(i, i + SAMPLES_PER_FRAME);
    const encoded = right
      ? encoder.encodeBuffer(leftChunk, right.subarray(i, i + SAMPLES_PER_FRAME))
      : encoder.encodeBuffer(leftChunk);
    if (encoded.length > 0) chunks.push(encoded);

    const progress: Mp3ProgressMessage = {
      type: "progress",
      ratio: Math.min(1, (i + SAMPLES_PER_FRAME) / totalSamples),
    };
    ctx.postMessage(progress);
  }

  const flushed = encoder.flush();
  if (flushed.length > 0) chunks.push(flushed);

  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  const done: Mp3DoneMessage = { type: "done", buffer: result.buffer as ArrayBuffer };
  ctx.postMessage(done, [done.buffer]);
};
