import { useCallback, useEffect, useState } from 'react';
import { useRoomContext, useVoiceAssistant } from '@livekit/components-react';
import type { TranscriptionSegment } from 'livekit-client';

export type Transcription = {
    identity: string;
    segment: TranscriptionSegment;
    participant?: {
        identity: string;
        name?: string;
    };
    text: string;
};

export type TranscriptionsState = {
    transcriptions: Transcription[];
    addTranscription: (identity: string, message: string) => void;
};

/**
 * Hook to manage transcriptions from LiveKit voice assistant
 * Handles real-time transcription streaming and manual message additions
 */
export function useDataStreamTranscriptions(): Transcription[] {
    const room = useRoomContext();
    const { agent } = useVoiceAssistant();
    const agentIdentity = agent?.identity;

    const [transcriptionMap] = useState<Map<string, Transcription>>(new Map());
    const [transcriptions, setTranscriptions] = useState<Transcription[]>([]);

    const mergeTranscriptions = useCallback(
        (merge: Transcription[]) => {
            for (const transcription of merge) {
                const existing = transcriptionMap.get(transcription.segment.id);
                transcriptionMap.set(transcription.segment.id, {
                    identity: transcription.identity,
                    participant: transcription.participant,
                    text: transcription.text,
                    segment: mergeTranscriptionSegment(existing?.segment, transcription.segment),
                });
            }

            const sortedTranscriptions = Array.from(transcriptionMap.values()).sort(
                (a, b) => b.segment.firstReceivedTime - a.segment.firstReceivedTime
            );

            setTranscriptions(sortedTranscriptions);
        },
        [transcriptionMap]
    );

    useEffect(() => {
        if (!room) {
            return;
        }

        try {
            // Register handler for transcription text streams
            room.registerTextStreamHandler(
                'lk.transcription',
                (reader: any, participantInfo: { identity: string; name?: string }) => {
                    const segment = createTranscriptionSegment(reader.info.attributes);
                    let text = '';

                    const readFunc = async () => {
                        try {
                            for await (const chunk of reader) {
                                text += chunk;
                                const updatedSegment = { 
                                    ...segment, 
                                    text, 
                                    lastReceivedTime: Date.now() 
                                };
                                mergeTranscriptions([{ 
                                    identity: participantInfo.identity,
                                    participant: participantInfo,
                                    text,
                                    segment: updatedSegment 
                                }]);
                            }
                            
                            // Mark as final when stream completes
                            const finalSegment = { ...segment, text, final: true };
                            mergeTranscriptions([{ 
                                identity: participantInfo.identity,
                                participant: participantInfo,
                                text,
                                segment: finalSegment 
                            }]);
                        } catch (error) {
                            console.error('[Transcription] Error reading stream:', error);
                        }
                    };

                    readFunc();
                }
            );

            return () => {
                try {
                    room.unregisterTextStreamHandler('lk.transcription');
                } catch (error) {
                    console.error('[Transcription] Error unregistering handler:', error);
                }
            };
        } catch (error) {
            console.error('[Transcription] Error registering text stream handler:', error);
        }
    }, [room, mergeTranscriptions]);

    return transcriptions;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const createTranscriptionSegment = (
    attributes?: Record<string, string>
): TranscriptionSegment => {
    const now = Date.now();
    
    // Generate UUID fallback for browsers without crypto.randomUUID
    const generateId = () => {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    };

    return {
        id: attributes?.['lk.segment_id'] ?? generateId(),
        text: '',
        language: attributes?.['lk.transcription.language'] ?? '',
        startTime: now,
        endTime: now,
        final: (attributes?.['lk.transcription.final'] ?? 'false') === 'true',
        firstReceivedTime: now,
        lastReceivedTime: now,
    };
};

const mergeTranscriptionSegment = (
    existing: TranscriptionSegment | undefined,
    newSegment: TranscriptionSegment
): TranscriptionSegment => {
    if (!existing) return newSegment;
    if (existing.id !== newSegment.id) return existing;
    
    return {
        ...existing,
        text: newSegment.text,
        language: newSegment.language,
        final: newSegment.final,
        endTime: newSegment.endTime,
        lastReceivedTime: newSegment.lastReceivedTime,
    };
};
