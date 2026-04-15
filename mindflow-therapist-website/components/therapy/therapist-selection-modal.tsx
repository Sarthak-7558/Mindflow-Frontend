"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Therapist {
  id: string;
  name: string;
  specialty: string;
  avatar: string;
  description: string;
}

const therapists: Therapist[] = [
  {
    id: "dr-sarah",
    name: "Dr. Sarah Chen",
    specialty: "Anxiety & Stress Management",
    avatar: "https://i.pravatar.cc/150?img=47",
    description: "Specializes in cognitive behavioral therapy and mindfulness techniques",
  },
  {
    id: "dr-michael",
    name: "Dr. Michael Roberts",
    specialty: "Depression & Mood Disorders",
    avatar: "https://i.pravatar.cc/150?img=12",
    description: "Expert in positive psychology and emotional regulation",
  },
  {
    id: "dr-emily",
    name: "Dr. Emily Thompson",
    specialty: "Relationship & Communication",
    avatar: "https://i.pravatar.cc/150?img=45",
    description: "Focuses on interpersonal relationships and communication skills",
  },
  {
    id: "dr-james",
    name: "Dr. James Wilson",
    specialty: "Trauma & PTSD",
    avatar: "https://i.pravatar.cc/150?img=33",
    description: "Specialized in trauma-informed care and EMDR therapy",
  },
];

interface TherapistSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTherapist: (therapist: Therapist) => void;
}

export function TherapistSelectionModal({
  open,
  onOpenChange,
  onSelectTherapist,
}: TherapistSelectionModalProps) {
  const [selectedTherapist, setSelectedTherapist] = useState<Therapist | null>(null);

  const handleStartSession = () => {
    if (selectedTherapist) {
      onSelectTherapist(selectedTherapist);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Choose Your Therapist</DialogTitle>
          <DialogDescription>
            Select a therapist that best matches your needs for this session
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          {therapists.map((therapist) => (
            <motion.div
              key={therapist.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedTherapist(therapist)}
              className={cn(
                "relative p-4 rounded-lg border-2 cursor-pointer transition-all",
                selectedTherapist?.id === therapist.id
                  ? "border-purple-600 bg-purple-50 dark:bg-purple-950/20"
                  : "border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700"
              )}
            >
              {selectedTherapist?.id === therapist.id && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-2 right-2 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center"
                >
                  <Check className="w-4 h-4 text-white" />
                </motion.div>
              )}

              <div className="flex flex-col items-center text-center gap-3">
                <div className="relative">
                  <img
                    src={therapist.avatar}
                    alt={therapist.name}
                    className="w-20 h-20 rounded-full object-cover border-4 border-white dark:border-gray-800 shadow-md"
                  />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white dark:border-gray-800" />
                </div>

                <div>
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                    {therapist.name}
                  </h3>
                  <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">
                    {therapist.specialty}
                  </p>
                </div>

                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                  {therapist.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleStartSession}
            disabled={!selectedTherapist}
            className="bg-purple-600 hover:bg-purple-700"
          >
            Start Session
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { therapists };
