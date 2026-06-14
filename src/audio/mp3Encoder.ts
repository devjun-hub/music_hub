import { MP3_BITRATE_KBPS } from "@/lib/constants";
import type { Mp3EncodeRequest, Mp3WorkerMessage } from "./workers/mp3Encoder.types";

/**
 * AudioBuffer를 Web Worker(lamejs)에서 MP3로 인코딩한다.
 * 메인 스레드를 막지 않으며, onProgress로 진행률(0~1)을 전달한다.
 */
export function encodeAudioBufferToMp3(
  buffer: AudioBuffer,
  onProgress?: (ratio: number) => void,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("./workers/mp3Encoder.worker.ts", import.meta.url), {
      type: "module",
    });

    const numChannels = Math.min(buffer.numberOfChannels, 2);
    const channelData: Float32Array[] = [];
    for (let channel = 0; channel < numChannels; channel++) {
      channelData.push(buffer.getChannelData(channel).slice());
    }

    worker.onmessage = (event: MessageEvent<Mp3WorkerMessage>) => {
      const message = event.data;
      if (message.type === "progress") {
        onProgress?.(message.ratio);
        return;
      }
      resolve(new Blob([message.buffer], { type: "audio/mpeg" }));
      worker.terminate();
    };

    worker.onerror = (event) => {
      reject(new Error(event.message || "MP3 인코딩 중 오류가 발생했습니다."));
      worker.terminate();
    };

    const request: Mp3EncodeRequest = {
      type: "encode",
      channelData,
      sampleRate: buffer.sampleRate,
      kbps: MP3_BITRATE_KBPS,
    };

    const transfer = channelData.map((data) => data.buffer as ArrayBuffer);
    worker.postMessage(request, transfer);
  });
}
