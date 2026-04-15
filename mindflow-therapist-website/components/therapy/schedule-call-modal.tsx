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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Phone, Loader2, CheckCircle, XCircle } from "lucide-react";
import { initiateOutboundCall } from "@/lib/api/outboundCall";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ScheduleCallModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ScheduleCallModal({ open, onOpenChange }: ScheduleCallModalProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [userName, setUserName] = useState("");
  const [country, setCountry] = useState<"US" | "IN">("IN");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phoneNumber) {
      setStatus("error");
      setMessage("Please enter a phone number");
      return;
    }

    setIsLoading(true);
    setStatus("idle");
    setMessage("");

    try {
      // Add country code prefix if not present
      let formattedNumber = phoneNumber.replace(/\D/g, "");
      
      if (country === "IN" && !formattedNumber.startsWith("91")) {
        formattedNumber = "91" + formattedNumber;
      } else if (country === "US" && !formattedNumber.startsWith("1")) {
        formattedNumber = "1" + formattedNumber;
      }

      const result = await initiateOutboundCall({
        phoneNumber: formattedNumber,
        userName: userName || undefined,
      });

      if (result.success) {
        setStatus("success");
        setMessage("Call initiated successfully! You should receive a call shortly.");
        
        // Reset form after 3 seconds
        setTimeout(() => {
          setPhoneNumber("");
          setUserName("");
          setStatus("idle");
          setMessage("");
          onOpenChange(false);
        }, 3000);
      } else {
        setStatus("error");
        setMessage(result.error || "Failed to initiate call");
      }
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Failed to initiate call");
    } finally {
      setIsLoading(false);
    }
  };

  const formatPhoneNumber = (value: string, countryCode: "US" | "IN") => {
    // Remove all non-digit characters
    const cleaned = value.replace(/\D/g, "");
    
    if (countryCode === "US") {
      // Format as (XXX) XXX-XXXX for US numbers
      if (cleaned.length <= 3) {
        return cleaned;
      } else if (cleaned.length <= 6) {
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
      } else {
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
      }
    } else {
      // Format as XXXXX-XXXXX for Indian numbers
      if (cleaned.length <= 5) {
        return cleaned;
      } else {
        return `${cleaned.slice(0, 5)}-${cleaned.slice(5, 10)}`;
      }
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value, country);
    setPhoneNumber(formatted);
  };

  const handleCountryChange = (newCountry: "US" | "IN") => {
    setCountry(newCountry);
    // Reformat existing number for new country
    if (phoneNumber) {
      const cleaned = phoneNumber.replace(/\D/g, "");
      setPhoneNumber(formatPhoneNumber(cleaned, newCountry));
    }
  };

  const getPlaceholder = () => {
    return country === "US" ? "(555) 123-4567" : "98765-43210";
  };

  const getMaxLength = () => {
    return country === "US" ? 14 : 11; // (XXX) XXX-XXXX or XXXXX-XXXXX
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Phone className="w-6 h-6 text-purple-600" />
            Schedule Therapy Call
          </DialogTitle>
          <DialogDescription>
            Enter your phone number to receive an immediate therapy call from our AI assistant.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Select value={country} onValueChange={(value) => handleCountryChange(value as "US" | "IN")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="IN">🇮🇳 India (+91)</SelectItem>
                <SelectItem value="US">🇺🇸 United States (+1)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Phone Number *</Label>
            <div className="flex gap-2">
              <div className="flex items-center px-3 py-2 border rounded-md bg-muted text-muted-foreground font-mono text-sm">
                {country === "IN" ? "+91" : "+1"}
              </div>
              <Input
                id="phoneNumber"
                type="tel"
                placeholder={getPlaceholder()}
                value={phoneNumber}
                onChange={handlePhoneChange}
                maxLength={getMaxLength()}
                required
                disabled={isLoading || status === "success"}
                className="text-lg flex-1"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {country === "IN" 
                ? "Enter a valid 10-digit Indian mobile number" 
                : "Enter a valid 10-digit US phone number"}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="userName">Your Name (Optional)</Label>
            <Input
              id="userName"
              type="text"
              placeholder="John Doe"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              disabled={isLoading || status === "success"}
            />
          </div>

          {status !== "idle" && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-lg flex items-start gap-3 ${
                status === "success"
                  ? "bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800"
                  : "bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800"
              }`}
            >
              {status === "success" ? (
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              )}
              <p
                className={`text-sm ${
                  status === "success"
                    ? "text-green-800 dark:text-green-200"
                    : "text-red-800 dark:text-red-200"
                }`}
              >
                {message}
              </p>
            </motion.div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || status === "success"}
              className="bg-purple-600 hover:bg-purple-700 min-w-[120px]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Calling...
                </>
              ) : status === "success" ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Success!
                </>
              ) : (
                <>
                  <Phone className="w-4 h-4 mr-2" />
                  Call Now
                </>
              )}
            </Button>
          </div>
        </form>

        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Note:</strong> You will receive a call within 30 seconds. Please ensure your phone is nearby and ready to answer.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
