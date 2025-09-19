import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { format, parse } from "date-fns";

interface TimePickerProps {
  label: string;
  value: string; // datetime-local format string
  onChange: (value: string) => void;
  required?: boolean;
}

export function TimePicker({ label, value, onChange, required }: TimePickerProps) {
  const [date, setDate] = useState("");
  const [hour, setHour] = useState("12");
  const [minute, setMinute] = useState("00");
  const [period, setPeriod] = useState<"AM" | "PM">("AM");

  // Parse initial value when component mounts or value changes
  useEffect(() => {
    if (value) {
      try {
        const dateObj = new Date(value);
        setDate(format(dateObj, "yyyy-MM-dd"));
        
        let hour24 = dateObj.getHours();
        const minute = dateObj.getMinutes();
        const period = hour24 >= 12 ? "PM" : "AM";
        
        // Convert 24-hour to 12-hour
        if (hour24 === 0) hour24 = 12;
        else if (hour24 > 12) hour24 = hour24 - 12;
        
        setHour(hour24.toString().padStart(2, "0"));
        setMinute(minute.toString().padStart(2, "0"));
        setPeriod(period);
      } catch (error) {
        console.error("Error parsing datetime:", error);
      }
    }
  }, [value]);

  // Update parent when any component changes
  useEffect(() => {
    if (date && hour && minute && period) {
      try {
        // Convert 12-hour to 24-hour
        let hour24 = parseInt(hour);
        if (period === "AM" && hour24 === 12) hour24 = 0;
        else if (period === "PM" && hour24 !== 12) hour24 = hour24 + 12;
        
        // Create datetime-local format string
        const datetimeLocal = `${date}T${hour24.toString().padStart(2, "0")}:${minute}`;
        onChange(datetimeLocal);
      } catch (error) {
        console.error("Error creating datetime:", error);
      }
    }
  }, [date, hour, minute, period, onChange]);

  const hours = Array.from({ length: 12 }, (_, i) => {
    const hourNum = i + 1;
    return hourNum.toString().padStart(2, "0");
  });

  const minutes = Array.from({ length: 60 }, (_, i) => 
    i.toString().padStart(2, "0")
  );

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="space-y-2">
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required={required}
        />
        <div className="grid grid-cols-4 gap-2">
          <Select value={hour} onValueChange={setHour}>
            <SelectTrigger>
              <SelectValue placeholder="Hour" />
            </SelectTrigger>
            <SelectContent>
              {hours.map((h) => (
                <SelectItem key={h} value={h}>
                  {h}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={minute} onValueChange={setMinute}>
            <SelectTrigger>
              <SelectValue placeholder="Min" />
            </SelectTrigger>
            <SelectContent>
              {minutes.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={period} onValueChange={(value: "AM" | "PM") => setPeriod(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AM">AM</SelectItem>
              <SelectItem value="PM">PM</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="text-xs text-muted-foreground flex items-center justify-center">
            Karachi Time
          </div>
        </div>
      </div>
    </div>
  );
}