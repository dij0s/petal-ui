import { useState, useRef, useCallback } from "react";
import type { Message } from "../types/Message";

interface UseStreamingChatOptions {
  userId: string;
  threadId: string;
  language: string;
}

interface StreamingState {
  isStreaming: boolean;
  messages: Message[];
  processingStatus: string;
  mapLayers: string[];
  mapFocusedMunicipality: number | null;
}

interface StreamingActions {
  sendPrompt: (prompt: string) => Promise<void>;
}

export const useStreamingChat = (
  options: UseStreamingChatOptions,
): [StreamingState, StreamingActions] => {
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [processingStatus, setProcessingStatus] = useState<string>("");
  const [mapLayers, setMapLayers] = useState<string[]>([]);
  const [mapFocusedMunicipality, setMapFocusedMunicipality] = useState<
    number | null
  >(null);

  const eventSourceRef = useRef<EventSource | null>(null);

  const tokenBufferRef = useRef<string>("");
  const displayedContentRef = useRef<string>("");
  const animationFrameRef = useRef<number | null>(null);
  const typewriterFrameRef = useRef<number | null>(null);
  const isFirstTokenRef = useRef<boolean>(true);

  const displayedWordsRef = useRef<number>(0);
  const targetWordsRef = useRef<string[]>([]);

  // typewriter speed in wps
  const typewriterSpeedRef = useRef<number>(8);
  const lastUpdateTimeRef = useRef<number>(0);

  // split text into words
  // while preserving spaces
  // for word-by-word animation
  const splitIntoWords = useCallback((text: string): string[] => {
    if (!text) return [];

    // split by spaces but keep
    // spaces with preceding words
    const words: string[] = [];
    const parts = text.split(/(\s+)/);

    for (let i = 0; i < parts.length; i++) {
      if (parts[i].trim() !== "") {
        const word = parts[i] + (parts[i + 1] || "");
        words.push(word);
        // skip whitespace part
        // since already included
        if (parts[i + 1]) i++;
      }
    }

    return words;
  }, []);

  const animateTypewriter = useCallback((timestamp: number) => {
    const targetWords = targetWordsRef.current;
    const currentWordCount = displayedWordsRef.current;

    if (currentWordCount < targetWords.length) {
      // elapsed time since last update
      const deltaTime = timestamp - lastUpdateTimeRef.current;
      const wordsToAdd = Math.max(
        1,
        Math.floor((typewriterSpeedRef.current * deltaTime) / 1000),
      );
      // update displayed word count
      const newWordCount = Math.min(
        currentWordCount + wordsToAdd,
        targetWords.length,
      );
      displayedWordsRef.current = newWordCount;
      lastUpdateTimeRef.current = timestamp;
      // reconstruct text from words
      const newContent = targetWords.slice(0, newWordCount).join("");
      displayedContentRef.current = newContent;

      // update messages
      setMessages((msgs) => {
        if (msgs[msgs.length - 1]?.role === "assistant") {
          return [
            ...msgs.slice(0, -1),
            { role: "assistant", content: newContent },
          ];
        } else {
          return [...msgs, { role: "assistant", content: newContent }];
        }
      });
      // continue animation if new words
      // buffered instead of requesting
      // new animation from the browser
      if (newWordCount < targetWords.length) {
        typewriterFrameRef.current = requestAnimationFrame(animateTypewriter);
      } else {
        typewriterFrameRef.current = null;
      }
    } else {
      typewriterFrameRef.current = null;
    }
  }, []);

  const startTypewriterAnimation = useCallback(() => {
    const newWords = splitIntoWords(tokenBufferRef.current);
    const currentWords = targetWordsRef.current;

    // only start animation
    // if new words to show
    if (newWords.length > currentWords.length) {
      targetWordsRef.current = newWords;

      if (typewriterFrameRef.current === null) {
        // update request time
        // to correctly cap wps
        lastUpdateTimeRef.current = performance.now();
        typewriterFrameRef.current = requestAnimationFrame(animateTypewriter);
      }
    }
  }, [animateTypewriter, splitIntoWords]);

  const flushTokenBuffer = useCallback(() => {
    startTypewriterAnimation();
    animationFrameRef.current = null;
  }, [startTypewriterAnimation]);

  const scheduleTokenUpdate = useCallback(() => {
    if (animationFrameRef.current === null) {
      animationFrameRef.current = requestAnimationFrame(flushTokenBuffer);
    }
  }, [flushTokenBuffer]);

  const sendPrompt = useCallback(
    async (prompt: string) => {
      setMessages((msgs) => [...msgs, { role: "user", content: prompt }]);

      // reset animation state
      tokenBufferRef.current = "";
      displayedContentRef.current = "";
      displayedWordsRef.current = 0;
      targetWordsRef.current = [];
      isFirstTokenRef.current = true;
      lastUpdateTimeRef.current = 0;

      // cancel pending animations
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (typewriterFrameRef.current) {
        cancelAnimationFrame(typewriterFrameRef.current);
        typewriterFrameRef.current = null;
      }

      const response = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: options.userId,
          thread_id: options.threadId,
          prompt: prompt,
          lang: options.language,
        }),
      });

      if (response.status !== 200) {
        return;
      }

      // start streaming
      if (eventSourceRef.current) eventSourceRef.current.close();
      const es = new EventSource(`/api/stream?user_id=${options.userId}`);

      setIsStreaming(true);

      // handle incoming tokens
      es.addEventListener("token", (e) => {
        if (isFirstTokenRef.current) {
          setProcessingStatus("");
          isFirstTokenRef.current = false;
        }
        // push tokens to buffer
        tokenBufferRef.current += e.data;
        // schedule animation update
        scheduleTokenUpdate();
      });

      // handle status updates
      es.addEventListener("info", (e) => {
        const data = JSON.parse(e.data);
        setProcessingStatus(data.content);
      });

      // handle focused geometry update
      es.addEventListener("sfso_number", (e) => {
        const data = JSON.parse(e.data);
        setMapFocusedMunicipality(Number(data.sfso_number));
      });

      // handle layers update
      es.addEventListener("layers", (e) => {
        const data = JSON.parse(e.data);
        setMapLayers(data.layers);
      });

      // handle end event
      es.addEventListener("end", () => {
        // cancel batching frame
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        // complete any animation
        if (typewriterFrameRef.current) {
          cancelAnimationFrame(typewriterFrameRef.current);
          typewriterFrameRef.current = null;
        }

        displayedContentRef.current = tokenBufferRef.current;
        displayedWordsRef.current = splitIntoWords(
          tokenBufferRef.current,
        ).length;
        targetWordsRef.current = splitIntoWords(tokenBufferRef.current);

        setMessages((msgs) => {
          if (msgs[msgs.length - 1]?.role === "assistant") {
            return [
              ...msgs.slice(0, -1),
              { role: "assistant", content: tokenBufferRef.current },
            ];
          } else {
            return [
              ...msgs,
              { role: "assistant", content: tokenBufferRef.current },
            ];
          }
        });

        es.close();
        setIsStreaming(false);
      });

      eventSourceRef.current = es;
    },
    [options, scheduleTokenUpdate, splitIntoWords],
  );

  return [
    {
      isStreaming,
      messages,
      processingStatus,
      mapLayers,
      mapFocusedMunicipality,
    },
    { sendPrompt },
  ];
};
