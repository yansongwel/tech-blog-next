"use client";

// Rive animated login character with eye-tracking
// Animation file: public/animations/login-character.riv
// State machine: "Login Machine"
// Inputs: isChecking (bool), numLook (number), isHandsUp (bool), trigSuccess (trigger), trigFail (trigger)

import { useEffect, useCallback, useRef } from "react";
import { useRive } from "@rive-app/react-canvas";
import { StateMachineInput } from "@rive-app/react-canvas";

interface LoginCharacterProps {
  /** Current value of the email/username input — eyes follow the text length */
  inputValue?: string;
  /** Whether the password field is focused — character covers eyes */
  isPasswordFocused?: boolean;
  /** Trigger success animation */
  triggerSuccess?: boolean;
  /** Trigger fail animation */
  triggerFail?: boolean;
  /** Max character length for eye tracking range (default 32) */
  maxInputLength?: number;
  /** Additional className */
  className?: string;
}

export default function LoginCharacter({
  inputValue = "",
  isPasswordFocused = false,
  triggerSuccess = false,
  triggerFail = false,
  maxInputLength = 32,
  className = "",
}: LoginCharacterProps) {
  const inputsRef = useRef<{
    isChecking?: StateMachineInput;
    numLook?: StateMachineInput;
    isHandsUp?: StateMachineInput;
    trigSuccess?: StateMachineInput;
    trigFail?: StateMachineInput;
  }>({});

  const { rive, RiveComponent } = useRive({
    src: "/animations/login-character.riv",
    stateMachines: "Login Machine",
    autoplay: true,
  });

  // Acquire state machine inputs once rive is ready
  useEffect(() => {
    if (!rive) return;
    const inputs = rive.stateMachineInputs("Login Machine");
    if (!inputs) return;

    for (const input of inputs) {
      if (input.name === "isChecking") inputsRef.current.isChecking = input;
      if (input.name === "numLook") inputsRef.current.numLook = input;
      if (input.name === "isHandsUp") inputsRef.current.isHandsUp = input;
      if (input.name === "trigSuccess") inputsRef.current.trigSuccess = input;
      if (input.name === "trigFail") inputsRef.current.trigFail = input;
    }
  }, [rive]);

  // Eye tracking: map input value length to look direction
  useEffect(() => {
    const { isChecking, numLook } = inputsRef.current;
    if (!isChecking || !numLook) return;

    if (isPasswordFocused) {
      isChecking.value = false;
      return;
    }

    if (inputValue.length > 0) {
      isChecking.value = true;
      numLook.value = Math.min((inputValue.length / maxInputLength) * 100, 100);
    } else {
      isChecking.value = false;
      numLook.value = 0;
    }
  }, [inputValue, isPasswordFocused, maxInputLength]);

  // Password field: cover eyes
  useEffect(() => {
    const { isHandsUp } = inputsRef.current;
    if (isHandsUp) isHandsUp.value = isPasswordFocused;
  }, [isPasswordFocused]);

  // Success animation
  const fireSuccess = useCallback(() => {
    inputsRef.current.trigSuccess?.fire();
  }, []);

  useEffect(() => {
    if (triggerSuccess) fireSuccess();
  }, [triggerSuccess, fireSuccess]);

  // Fail animation
  const fireFail = useCallback(() => {
    inputsRef.current.trigFail?.fire();
  }, []);

  useEffect(() => {
    if (triggerFail) fireFail();
  }, [triggerFail, fireFail]);

  return (
    <div className={`w-full aspect-square max-w-[250px] mx-auto ${className}`}>
      <RiveComponent />
    </div>
  );
}
