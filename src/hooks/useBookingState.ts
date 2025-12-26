// src/hooks/useBookingState.ts
/**
 * Custom hook for managing booking flow state
 * Handles step navigation and selection state across the booking process
 */

import { useState, useCallback } from "react";
import { ConsoleId } from "@/lib/constants";

export type BookingStep = 1 | 2;

export interface BookingState {
  // Current step in booking flow
  step: BookingStep;

  // Step 1: Date & Time selections
  selectedDate: string;
  selectedTime: string;

  // Step 2: Console & Ticket selections
  selectedConsole: ConsoleId;
  selectedDuration: 30 | 60 | 90;
  quantities: Record<string, number>; // ticketId -> quantity
}

export interface BookingStateActions {
  // Step navigation
  goToStep2: () => void;
  backToStep1: () => void;

  // Date & Time updates
  setSelectedDate: (date: string) => void;
  setSelectedTime: (time: string) => void;

  // Console & Ticket updates
  setSelectedConsole: (console: ConsoleId) => void;
  setSelectedDuration: (duration: 30 | 60 | 90) => void;
  updateQuantity: (ticketId: string, quantity: number) => void;
  resetQuantities: () => void;
}

/**
 * Hook for managing booking flow state
 * @param initialDate Initial date selection
 * @param initialConsole Initial console selection
 * @returns Booking state and action handlers
 */
export function useBookingState(
  initialDate: string,
  initialConsole: ConsoleId = "ps5"
): [BookingState, BookingStateActions] {
  const [step, setStep] = useState<BookingStep>(1);
  const [selectedDate, setSelectedDate] = useState<string>(initialDate);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedConsole, setSelectedConsole] = useState<ConsoleId>(initialConsole);
  const [selectedDuration, setSelectedDuration] = useState<30 | 60 | 90>(60);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const goToStep2 = useCallback(() => {
    setStep(2);
  }, []);

  const backToStep1 = useCallback(() => {
    setStep(1);
  }, []);

  const updateQuantity = useCallback((ticketId: string, quantity: number) => {
    setQuantities((prev) => ({
      ...prev,
      [ticketId]: quantity,
    }));
  }, []);

  const resetQuantities = useCallback(() => {
    setQuantities({});
  }, []);

  const state: BookingState = {
    step,
    selectedDate,
    selectedTime,
    selectedConsole,
    selectedDuration,
    quantities,
  };

  const actions: BookingStateActions = {
    goToStep2,
    backToStep1,
    setSelectedDate,
    setSelectedTime,
    setSelectedConsole,
    setSelectedDuration,
    updateQuantity,
    resetQuantities,
  };

  return [state, actions];
}
