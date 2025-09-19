import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";

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
  const [isInitialized, setIsInitialized] = useState(false);

  // Parse initial value when component mounts or value changes
  useEffect(() => {
    if (value && !isInitialized) {
      try {
        const dateObj = new Date(value);
        if (!isNaN(dateObj.getTime())) {
          setDate(format(dateObj, "yyyy-MM-dd"));
          
          let hour24 = dateObj.getHours();
          const minute = dateObj.getMinutes();
          const period = hour24 >= 12 ? "PM" : "AM";
          
          // Convert 24-hour to 12-hour
          if (hour24 === 0) hour24 = 12;
          else if (hour24 > 12) hour24 = hour24 - 12;
          
          setHour(hour24.toString());
          setMinute(minute.toString().padStart(2, "0"));
          setPeriod(period);
          setIsInitialized(true);
        }
      } catch (error) {
        console.error("Error parsing datetime:", error);
      }
    } else if (!value) {
      // Reset when value is cleared
      setDate("");
      setHour("12");
      setMinute("00");
      setPeriod("AM");
      setIsInitialized(false);
    }
  }, [value, isInitialized]);

  // Update parent when any component changes (but only after initialization)
  const updateDateTime = () => {
    if (date && hour && minute && period && isInitialized) {
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
  };

  // Handle individual field changes
  const handleDateChange = (newDate: string) => {
    setDate(newDate);
    if (newDate && hour && minute && period) {
      setTimeout(() => {
        try {
          let hour24 = parseInt(hour);
          if (period === "AM" && hour24 === 12) hour24 = 0;
          else if (period === "PM" && hour24 !== 12) hour24 = hour24 + 12;
          
          const datetimeLocal = `${newDate}T${hour24.toString().padStart(2, "0")}:${minute}`;
          onChange(datetimeLocal);
        } catch (error) {
          console.error("Error updating datetime:", error);
        }
      }, 0);
    }
  };

  const handleHourChange = (newHour: string) => {
    setHour(newHour);
    if (date && newHour && minute && period) {
      setTimeout(() => {
        try {
          let hour24 = parseInt(newHour);
          if (period === "AM" && hour24 === 12) hour24 = 0;
          else if (period === "PM" && hour24 !== 12) hour24 = hour24 + 12;
          
          const datetimeLocal = `${date}T${hour24.toString().padStart(2, "0")}:${minute}`;
          onChange(datetimeLocal);
        } catch (error) {
          console.error("Error updating datetime:", error);
        }
      }, 0);
    }
  };

  const handleMinuteChange = (newMinute: string) => {
    setMinute(newMinute);
    if (date && hour && newMinute && period) {
      setTimeout(() => {
        try {
          let hour24 = parseInt(hour);
          if (period === "AM" && hour24 === 12) hour24 = 0;
          else if (period === "PM" && hour24 !== 12) hour24 = hour24 + 12;
          
          const datetimeLocal = `${date}T${hour24.toString().padStart(2, "0")}:${newMinute}`;
          onChange(datetimeLocal);
        } catch (error) {
          console.error("Error updating datetime:", error);
        }
      }, 0);
    }
  };

  const handlePeriodChange = (newPeriod: "AM" | "PM") => {
    setPeriod(newPeriod);
    if (date && hour && minute && newPeriod) {
      setTimeout(() => {
        try {
          let hour24 = parseInt(hour);
          if (newPeriod === "AM" && hour24 === 12) hour24 = 0;
          else if (newPeriod === "PM" && hour24 !== 12) hour24 = hour24 + 12;
          
          const datetimeLocal = `${date}T${hour24.toString().padStart(2, "0")}:${minute}`;
          onChange(datetimeLocal);
        } catch (error) {
          console.error("Error updating datetime:", error);
        }
      }, 0);
    }
  };

  const hours = Array.from({ length: 12 }, (_, i) => {
    const hourNum = i + 1;
    return hourNum.toString();
  });

  const minutes = Array.from({ length: 12 }, (_, i) => 
    (i * 5).toString().padStart(2, "0")
  );

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="space-y-2">
        <Input
          type="date"
          value={date}
          onChange={(e) => handleDateChange(e.target.value)}
          required={required}
        />
        <div className="grid grid-cols-4 gap-2">
          <Select value={hour} onValueChange={handleHourChange}>
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
          
          <Select value={minute} onValueChange={handleMinuteChange}>
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
          
          <Select value={period} onValueChange={handlePeriodChange}>
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