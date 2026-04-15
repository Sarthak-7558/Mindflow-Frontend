"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "@/lib/contexts/session-context";
import { useRouter } from "next/navigation";
import { Phone, PhoneOff, UserCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Therapist } from "@/components/therapy/therapist-selection-modal";
import { TherapistSelectionModal } from "@/components/therapy/therapist-selection-modal";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

type CallStatus = "idle" | "calling" | "active" | "ended" | "error";

export default function VoiceAgentPage() {
  const { user, isAuthenticated, loading } = useSession();
  const router = useRouter();

  const [phoneNumber, setPhoneNumber] = useState("");
  const [callStatus, setCallStatus] = useState<CallStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [callId, setCallId] = useState<string | null>(null);
  const [selectedTherapist, setSelectedTherapist] = useState<Therapist | null>(null);
  const [showTherapistModal, setShowTherapistModal] = useState(false);

  useEffect(() => {
    const therapistData = localStorage.getItem("selectedTherapist");
    if (therapistData) {
      setSelectedTherapist(JSON.parse(therapistData));
    }
    const savedPhone = localStorage.getItem("savedPhoneNumber");
    if (savedPhone) {
      setPhoneNumber(savedPhone);
    }
  }, []);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [loading, isAuthenticated, router]);

  const handleTherapistSelected = (therapist: Therapist) => {
    setSelectedTherapist(therapist);
    localStorage.setItem("selectedTherapist", JSON.stringify(therapist));
  };

  const handleStartCall = useCallback(async () => {
    if (!phoneNumber.trim()) {
      setError("Please enter your phone number");
      return;
    }

    setCallStatus("calling");
    setError(null);

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`${API_URL}/api/outbound/initiate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          phoneNumber: phoneNumber.trim(),
          userName: user?.name || user?.email || "User",
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || result.message || "Failed to initiate call");
      }

      setCallId(result.call?.callId || result.call?.id);
      setCallStatus("active");
      localStorage.setItem("savedPhoneNumber", phoneNumber.trim());

    } catch (err) {
      console.error("[VoiceAgent] Call error:", err);
      setError(err instanceof Error ? err.message : "Failed to start call");
      setCallStatus("error");
    }
  }, [phoneNumber, user]);

  const handleEndCall = useCallback(async () => {
    if (!callId) {
      setCallStatus("ended");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await fetch(`${API_URL}/api/outbound/calls/${callId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (err) {
      console.error("[VoiceAgent] Error ending call:", err);
    } finally {
      setCallStatus("ended");
      setCallId(null);
    }
  }, [callId]);

  const handleReset = () => {
    setCallStatus("idle");
    setError(null);
    setCallId(null);
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-purple-600" />
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950 pt-20">
      <div className="container mx-auto px-4 py-6 min-h-[calc(100vh-5rem)] flex flex-col max-w-2xl">

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-12 pb-6 border-b border-gray-200 dark:border-gray-800">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Voice Therapy Session
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {selectedTherapist
                ? `Session with ${selectedTherapist.name}`
                : "AI will call you on your phone"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {selectedTherapist && (
              <div className="flex items-center gap-3 bg-white dark:bg-gray-900 rounded-lg px-4 py-2 border border-gray-200 dark:border-gray-700 shadow-sm">
                <img
                  src={selectedTherapist.avatar}
                  alt={selectedTherapist.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {selectedTherapist.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {selectedTherapist.specialty}
                  </p>
                </div>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTherapistModal(true)}
              disabled={callStatus === "calling" || callStatus === "active"}
              className="flex items-center gap-2"
            >
              <UserCircle className="w-4 h-4" />
              {selectedTherapist ? "Change" : "Select"} Therapist
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center justify-center gap-8">

          {/* Avatar */}
          <motion.div
            className="relative"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {(callStatus === "calling" || callStatus === "active") && (
              <motion.div
                className="absolute inset-0 rounded-full bg-purple-500/20 blur-3xl"
                animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
            )}
            <motion.div
              className="relative w-40 h-40 rounded-full bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center shadow-lg overflow-hidden"
              animate={{ scale: callStatus === "active" ? [1, 1.02, 1] : 1 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              {selectedTherapist ? (
                <img
                  src={selectedTherapist.avatar}
                  alt={selectedTherapist.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Phone className="w-14 h-14 text-white" strokeWidth={1.5} />
              )}
            </motion.div>
          </motion.div>

          {/* Status */}
          <AnimatePresence mode="wait">
            <motion.div
              key={callStatus}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-center"
            >
              {callStatus === "idle" && (
                <p className="text-gray-500 dark:text-gray-400">
                  Enter your phone number to start a session
                </p>
              )}
              {callStatus === "calling" && (
                <p className="text-purple-600 font-medium animate-pulse">
                  Initiating call...
                </p>
              )}
              {callStatus === "active" && (
                <div className="space-y-1">
                  <p className="text-green-600 font-medium">Call initiated! 📞</p>
                  <p className="text-sm text-gray-500">
                    You'll receive a call on {phoneNumber}
                  </p>
                </div>
              )}
              {callStatus === "ended" && (
                <p className="text-gray-500">Session ended. Take care! 💙</p>
              )}
              {callStatus === "error" && (
                <p className="text-red-500">Something went wrong</p>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Controls */}
          <div className="w-full max-w-sm space-y-4">
            {(callStatus === "idle" || callStatus === "error") && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Your Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <p className="text-xs text-gray-400">
                    Enter with country code (e.g. +91 for India, +1 for US)
                  </p>
                </div>

                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-2">
                    <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                  </div>
                )}

                <button
                  onClick={handleStartCall}
                  disabled={!phoneNumber.trim()}
                  className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Phone className="w-4 h-4" />
                  Start Session
                </button>
              </motion.div>
            )}

            {callStatus === "calling" && (
              <div className="flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
              </div>
            )}

            {callStatus === "active" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-3"
              >
                <button
                  onClick={handleEndCall}
                  className="w-16 h-16 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors flex items-center justify-center shadow-lg"
                >
                  <PhoneOff className="w-7 h-7" />
                </button>
                <p className="text-xs text-gray-500">End Session</p>
              </motion.div>
            )}

            {(callStatus === "ended" || callStatus === "error") && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-center"
              >
                <button
                  onClick={handleReset}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                >
                  Start New Session
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      <TherapistSelectionModal
        open={showTherapistModal}
        onOpenChange={setShowTherapistModal}
        onSelectTherapist={handleTherapistSelected}
      />
    </main>
  );
}