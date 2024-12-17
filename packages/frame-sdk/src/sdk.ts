import { EventEmitter } from "eventemitter3";
import { FrameSDK, Emitter, EventMap } from "./types";
import { frameHost } from "./frameHost";
import { provider } from "./provider";
import { SignIn } from "@farcaster/frame-core";

export function createEmitter(): Emitter {
  const emitter = new EventEmitter<EventMap>();

  return {
    get eventNames() {
      return emitter.eventNames.bind(emitter);
    },
    get listenerCount() {
      return emitter.listenerCount.bind(emitter);
    },
    get listeners() {
      return emitter.listeners.bind(emitter);
    },
    addListener: emitter.addListener.bind(emitter),
    emit: emitter.emit.bind(emitter),
    off: emitter.off.bind(emitter),
    on: emitter.on.bind(emitter),
    once: emitter.once.bind(emitter),
    removeAllListeners: emitter.removeAllListeners.bind(emitter),
    removeListener: emitter.removeListener.bind(emitter),
  };
}

const emitter = createEmitter();

export const sdk: FrameSDK = {
  ...emitter,
  context: frameHost.context,
  actions: {
    setPrimaryButton: frameHost.setPrimaryButton.bind(frameHost),
    ready: frameHost.ready.bind(frameHost),
    close: frameHost.close.bind(frameHost),
    signIn: async (options) => {
      const response = await frameHost.signIn(options);
      console.log(response);
      if (response.result) {
        return response.result
      }

      if (response.error.type === 'rejected_by_user') {
        throw new SignIn.RejectedByUser();
      }

      throw new Error("Unreachable");
    },
    openUrl: (url: string) => {
      return frameHost.openUrl(url.trim());
    },
    addFrame: frameHost.addFrame.bind(frameHost),
  },
  wallet: {
    ethProvider: provider,
  },
};

// Required to pass SSR
if (typeof document !== "undefined") {
  // react native webview events
  document.addEventListener("FarcasterFrameEvent", (event) => {
    if (event instanceof MessageEvent) {
      if (event.data.type === "primaryButtonClicked") {
        emitter.emit("primaryButtonClicked");
      }
    }
  });
}

// Required to pass SSR
if (typeof window !== "undefined") {
  // web events
  window.addEventListener("message", (event) => {
    if (event instanceof MessageEvent) {
      if (event.data.type === "frameEvent") {
        if (event.data.event === "primaryButtonClicked") {
          emitter.emit("primaryButtonClicked");
        }
      }
    }
  });
}
