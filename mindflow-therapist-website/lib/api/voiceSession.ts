const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export interface VoiceTranscript {
  speaker: "user" | "agent";
  text: string;
  timestamp: Date;
  duration?: number;
  sentiment?: {
    score: number;
    label: "positive" | "neutral" | "negative";
  };
  keywords?: string[];
}

export interface SessionSummary {
  mainTopics: string[];
  emotionalState: string;
  keyInsights: string[];
  actionItems?: string[];
  riskLevel: number;
  progressNotes: string;
}

export interface VoiceSession {
  _id: string;
  sessionId: string;
  userId: string;
  therapistId: string;
  therapistName: string;
  roomName: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  status: "active" | "completed" | "interrupted" | "archived";
  transcripts: VoiceTranscript[];
  summary?: SessionSummary;
  metadata?: any;
  contextFromPreviousSessions?: string;

  // LiveKit
  url?: string;
  token?: string;
}

export async function createVoiceSession(data: {
  sessionId: string;
  therapistId: string;
  therapistName: string;
  roomName: string;
  metadata?: any;
}): Promise<{ session: Partial<VoiceSession>; context: string }> {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/api/voice/sessions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // ✅ Always send auth token
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();
  console.log("VOICE SESSION RESPONSE:", result);

  if (!response.ok) {
    throw new Error(result.error || "Failed to create session");
  }

  if (!result.session) {
    throw new Error("Session not returned from backend");
  }

  const session = result.session;

  // ✅ url and token come inside result.session from backend
  if (!session.url || !session.token) {
    console.error("Missing LiveKit data in session:", session);
    throw new Error("Backend did not return LiveKit connection details");
  }

  return {
    session,
    context: result.context || session.contextFromPreviousSessions || "",
  };
}

export async function addTranscriptToSession(
  sessionId: string,
  transcript: Omit<VoiceTranscript, "timestamp">
): Promise<void> {
  const token = localStorage.getItem("token");

  const response = await fetch(
    `${API_URL}/api/voice/sessions/${sessionId}/transcript`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(transcript),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to add transcript");
  }
}

export async function endVoiceSession(
  sessionId: string,
  summary?: SessionSummary
): Promise<{ session: Partial<VoiceSession> }> {
  const token = localStorage.getItem("token");

  const response = await fetch(
    `${API_URL}/api/voice/sessions/${sessionId}/end`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ summary }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to end session");
  }

  return await response.json();
}

export async function getVoiceSession(sessionId: string): Promise<VoiceSession> {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/api/voice/sessions/${sessionId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to get session");
  }

  const result = await response.json();
  return result.session;
}

export async function getUserVoiceSessions(
  limit: number = 50
): Promise<VoiceSession[]> {
  const token = localStorage.getItem("token");

  const response = await fetch(
    `${API_URL}/api/voice/sessions?limit=${limit}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to get sessions");
  }

  const result = await response.json();
  return result.sessions;
}

export async function getPreviousSessionsContext(
  numberOfSessions: number = 5
): Promise<string> {
  const token = localStorage.getItem("token");

  const response = await fetch(
    `${API_URL}/api/voice/context?sessions=${numberOfSessions}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to get context");
  }

  const result = await response.json();
  return result.context;
}

export async function searchVoiceSessions(query: string): Promise<VoiceSession[]> {
  const token = localStorage.getItem("token");

  const response = await fetch(
    `${API_URL}/api/voice/search?query=${encodeURIComponent(query)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to search sessions");
  }

  const result = await response.json();
  return result.sessions;
}

export async function getVoiceSessionStats(): Promise<any> {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/api/voice/stats`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to get statistics");
  }

  const result = await response.json();
  return result.stats;
}