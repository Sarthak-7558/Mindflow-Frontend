import { useState, useCallback } from "react";
import * as LiveKit from "livekit-client";
import {
  createVoiceSession,
  addTranscriptToSession,
  endVoiceSession,
  getVoiceSession,
  getUserVoiceSessions,
  getPreviousSessionsContext,
  type VoiceSession,
  type VoiceTranscript,
  type SessionSummary,
} from "@/lib/api/voiceSession";

export function useVoiceSession() {
  const [currentSession, setCurrentSession] = useState<Partial<VoiceSession> | null>(null);
  const [sessionContext, setSessionContext] = useState<string>("");
  const [sessions, setSessions] = useState<VoiceSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [room, setRoom] = useState<LiveKit.Room | null>(null);

  const startSession = useCallback(async (data: {
    sessionId: string;
    therapistId: string;
    therapistName: string;
    roomName: string;
    metadata?: any;
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await createVoiceSession(data);

      setCurrentSession(result.session);
      setSessionContext(result.context);

      // ✅ FIX: url and token are inside result.session
      const url = result.session?.url;
      const token = result.session?.token;

      if (!url || !token) {
        throw new Error("Backend did not return LiveKit connection details");
      }

      const newRoom = new LiveKit.Room();
      await newRoom.connect(url, token);
      setRoom(newRoom);

      console.log("[LiveKit] Connected successfully");

      // ✅ Return url and token at top level so page.tsx can also access them
      return {
        ...result,
        url,
        token,
      };

    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to start session";
      setError(errorMessage);
      console.error("[useVoiceSession] Error:", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addTranscript = useCallback(async (transcript: Omit<VoiceTranscript, "timestamp">) => {
    if (!currentSession?.sessionId) throw new Error("No active session");
    await addTranscriptToSession(currentSession.sessionId, transcript);
  }, [currentSession]);

  const endSession = useCallback(async (summary?: SessionSummary) => {
    if (!currentSession?.sessionId) throw new Error("No active session");

    const result = await endVoiceSession(currentSession.sessionId, summary);

    if (room) {
      await room.disconnect();
      setRoom(null);
    }

    setCurrentSession(null);
    setSessionContext("");

    return result;
  }, [currentSession, room]);

  return {
    currentSession,
    sessionContext,
    sessions,
    isLoading,
    error,
    room,
    startSession,
    addTranscript,
    endSession,
  };
}