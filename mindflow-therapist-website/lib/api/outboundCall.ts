const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export interface ScheduleCallRequest {
  phoneNumber: string;
  userName?: string;
  scheduledTime?: Date;
  notes?: string;
}

export interface ScheduledCall {
  id: string;
  phoneNumber: string;
  userName: string;
  scheduledTime: Date;
  status: "pending" | "calling" | "completed" | "failed" | "cancelled";
  callId?: string;
  vapiCallId?: string;
  duration?: number;
  notes?: string;
}

/**
 * Schedule an outbound call
 */
export async function scheduleOutboundCall(
  data: ScheduleCallRequest
): Promise<{ success: boolean; scheduledCall?: any; error?: string }> {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/api/outbound/schedule`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || "Failed to schedule call");
  }

  return result;
}

/**
 * Initiate immediate call
 */
export async function initiateOutboundCall(data: {
  phoneNumber: string;
  userName?: string;
}): Promise<{ success: boolean; call?: any; error?: string }> {
  const token = localStorage.getItem("token");

  console.log("[OutboundCall] Initiating call with token:", token ? "Token exists" : "No token");

  if (!token) {
    throw new Error("Authentication required. Please log in again.");
  }

  const response = await fetch(`${API_URL}/api/outbound/initiate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  console.log("[OutboundCall] Response status:", response.status);

  if (response.status === 401) {
    throw new Error("Authentication failed. Please log in again.");
  }

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || "Failed to initiate call");
  }

  return result;
}

/**
 * Get all scheduled calls for user
 */
export async function getUserScheduledCalls(
  limit: number = 50
): Promise<ScheduledCall[]> {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/api/outbound/calls?limit=${limit}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to get scheduled calls");
  }

  const result = await response.json();
  return result.calls;
}

/**
 * Get call status
 */
export async function getCallStatus(callId: string): Promise<ScheduledCall> {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/api/outbound/calls/${callId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to get call status");
  }

  const result = await response.json();
  return result.call;
}

/**
 * Cancel a scheduled call
 */
export async function cancelScheduledCall(callId: string): Promise<void> {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/api/outbound/calls/${callId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to cancel call");
  }
}
