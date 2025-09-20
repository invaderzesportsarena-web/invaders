import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TimePickerProps {
  label: string;
  value: string; // datetime-local format string
  onChange: (value: string) => void;
  required?: boolean;
}

export function TimePicker({ label, value, onChange, required }: TimePickerProps) {
  const [localValue, setLocalValue] = useState("");

  // Convert value to local datetime format when it changes
  useEffect(() => {
    if (value) {
      try {
        // Parse the incoming value as a date
        const date = new Date(value);
        
        // Check if the date is valid
        if (!isNaN(date.getTime())) {
          // Convert to local datetime-local format
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const hours = String(date.getHours()).padStart(2, '0');
          const minutes = String(date.getMinutes()).padStart(2, '0');
          
          const localDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
          setLocalValue(localDateTime);
          console.log("TimePicker initialized:", { value, localDateTime, parsedDate: date.toISOString() });
        } else {
          setLocalValue("");
        }
      } catch (error) {
        console.error("Error parsing datetime:", error);
        setLocalValue("");
      }
    } else {
      setLocalValue("");
    }
  }, [value]);

  const handleChange = (newValue: string) => {
    setLocalValue(newValue);
    
    if (newValue) {
      try {
        // Create a date object from the datetime-local input
        const date = new Date(newValue);
        
        if (!isNaN(date.getTime())) {
          // Convert to ISO string for storage
          const isoString = date.toISOString();
          console.log("TimePicker onChange:", { newValue, isoString, date: date.toString() });
          onChange(isoString);
        }
      } catch (error) {
        console.error("Error creating datetime:", error);
      }
    } else {
      onChange("");
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="space-y-2">
        <Input
          type="datetime-local"
          value={localValue}
          onChange={(e) => handleChange(e.target.value)}
          required={required}
          className="w-full"
        />
        <div className="text-xs text-muted-foreground">
          Enter date and time in your local timezone
        </div>
      </div>
    </div>
  );
}