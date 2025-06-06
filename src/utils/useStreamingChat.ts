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
  thinkingContent: string;
  isThinking: boolean;
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
  const [thinkingContent, setThinkingContent] = useState<string>("");
  const [isThinking, setIsThinking] = useState<boolean>(false);

  const eventSourceRef = useRef<EventSource | null>(null);

  // word-by-word animation refs
  const tokenBufferRef = useRef<string>("");
  const displayedContentRef = useRef<string>("");
  const animationFrameRef = useRef<number | null>(null);
  const typewriterFrameRef = useRef<number | null>(null);
  const isFirstTokenRef = useRef<boolean>(true);

  // thinking state tracking
  const thinkingBufferRef = useRef<string>("");
  const responseBufferRef = useRef<string>("");
  const hasSeenThinkingEndRef = useRef<boolean>(false);

  // word animation state
  const displayedWordsRef = useRef<number>(0);
  const targetWordsRef = useRef<string[]>([]);

  // animation settings
  // words per second
  const typewriterSpeedRef = useRef<number>(8);
  const lastUpdateTimeRef = useRef<number>(0);

  // split text into words
  // while preserving spaces
  const splitIntoWords = useCallback((text: string): string[] => {
    if (!text) return [];

    // split by spaces but keep
    // spaces with preceding words
    const words: string[] = [];
    const parts = text.split(/(\s+)/);

    for (let i = 0; i < parts.length; i++) {
      if (parts[i].trim() !== "") {
        // add word with any
        // following whitespace
        const word = parts[i] + (parts[i + 1] || "");
        words.push(word);
        // skip whitespace part
        // since included
        if (parts[i + 1]) i++;
      }
    }

    return words;
  }, []);

  // parse thinking blocks
  // and response content
  const parseContent = useCallback((rawContent: string) => {
    // check if we have a
    // complete thinking block
    const thinkingMatch = rawContent.match(/<think>([\s\S]*?)<\/think>/);

    if (thinkingMatch) {
      const thinkingText = thinkingMatch[1].trim();
      const responseText = rawContent
        .replace(/<think>[\s\S]*?<\/think>/, "")
        .trim();
      return {
        thinking: thinkingText,
        response: responseText,
        hasCompleteThinking: true,
      };
    }

    // check if we are in the
    // middle of a thinking block
    const thinkingStartMatch = rawContent.match(/<think>([\s\S]*)$/);
    if (thinkingStartMatch) {
      return {
        thinking: thinkingStartMatch[1],
        response: "",
        hasCompleteThinking: false,
      };
    }

    // no thinking tags
    // treat as response
    return {
      thinking: "",
      response: rawContent,
      hasCompleteThinking: true,
    };
  }, []);

  const animateTypewriter = useCallback((timestamp: number) => {
    const targetWords = targetWordsRef.current;
    const currentWordCount = displayedWordsRef.current;

    if (currentWordCount < targetWords.length) {
      // elapsed time since
      // last animated frame
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

      // update react state
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

      // continue animation if
      // more words to show
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
    const newWords = splitIntoWords(responseBufferRef.current);
    const currentWords = targetWordsRef.current;

    // only start animation
    // if new words to show
    if (newWords.length > currentWords.length) {
      targetWordsRef.current = newWords;

      if (typewriterFrameRef.current === null) {
        lastUpdateTimeRef.current = performance.now();
        typewriterFrameRef.current = requestAnimationFrame(animateTypewriter);
      }
    }
  }, [animateTypewriter, splitIntoWords]);

  const flushTokenBuffer = useCallback(() => {
    const { thinking, response, hasCompleteThinking } = parseContent(
      tokenBufferRef.current,
    );

    if (thinking && thinking !== thinkingBufferRef.current) {
      // update thinking content
      // if we have thinking text
      thinkingBufferRef.current = thinking;
      setThinkingContent(thinking);

      if (!isThinking) {
        setIsThinking(true);
        setProcessingStatus("Thinking..");
      }
    }

    // if thinking block is complete
    // and we have response content
    if (hasCompleteThinking && response && !hasSeenThinkingEndRef.current) {
      hasSeenThinkingEndRef.current = true;
      setIsThinking(false);
      setProcessingStatus("");
    }

    // update response content if we
    // are past thinking mode or if
    // there is no thinking block
    if (
      (hasSeenThinkingEndRef.current || !thinking) &&
      response !== responseBufferRef.current
    ) {
      responseBufferRef.current = response;
      startTypewriterAnimation();
    }

    animationFrameRef.current = null;
  }, [parseContent, startTypewriterAnimation, isThinking]);

  const scheduleTokenUpdate = useCallback(() => {
    if (animationFrameRef.current === null) {
      animationFrameRef.current = requestAnimationFrame(flushTokenBuffer);
    }
  }, [flushTokenBuffer]);

  const sendPrompt = useCallback(
    async (prompt: string) => {
      setMessages((msgs) => [...msgs, { role: "user", content: prompt }]);

      // reset all state for new prompt
      tokenBufferRef.current = "";
      displayedContentRef.current = "";
      displayedWordsRef.current = 0;
      targetWordsRef.current = [];
      isFirstTokenRef.current = true;
      lastUpdateTimeRef.current = 0;
      thinkingBufferRef.current = "";
      responseBufferRef.current = "";
      hasSeenThinkingEndRef.current = false;

      // reset ui state
      setThinkingContent("");
      setIsThinking(false);
      setProcessingStatus("");

      // cancel all pending animations
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (typewriterFrameRef.current) {
        cancelAnimationFrame(typewriterFrameRef.current);
        typewriterFrameRef.current = null;
      }

      // send prompt to backend
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
          isFirstTokenRef.current = false;
        }
        // accumulate tokens in buffer
        tokenBufferRef.current += e.data;
        // schedule parsing and animation update
        scheduleTokenUpdate();
      });

      // handle status updates
      es.addEventListener("info", (e) => {
        const data = JSON.parse(e.data);
        // only update status if
        // not in thinking mode
        if (!isThinking) {
          setProcessingStatus(data.content);
        }
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

        // complete animation
        // when stream ends
        if (typewriterFrameRef.current) {
          cancelAnimationFrame(typewriterFrameRef.current);
          typewriterFrameRef.current = null;
        }

        // final parse and display
        const { response } = parseContent(tokenBufferRef.current);
        displayedContentRef.current = response;
        responseBufferRef.current = response;
        displayedWordsRef.current = splitIntoWords(response).length;
        targetWordsRef.current = splitIntoWords(response);

        // clear thinking state
        setIsThinking(false);
        setThinkingContent("");
        setProcessingStatus("");

        setMessages((msgs) => {
          if (msgs[msgs.length - 1]?.role === "assistant") {
            return [
              ...msgs.slice(0, -1),
              { role: "assistant", content: response },
            ];
          } else {
            return [...msgs, { role: "assistant", content: response }];
          }
        });

        es.close();
        setIsStreaming(false);
      });

      eventSourceRef.current = es;
    },
    [options, scheduleTokenUpdate, splitIntoWords, parseContent, isThinking],
  );

  return [
    {
      isStreaming,
      messages,
      processingStatus,
      mapLayers,
      mapFocusedMunicipality,
      thinkingContent,
      isThinking,
    },
    {
      sendPrompt,
    },
  ];
};
