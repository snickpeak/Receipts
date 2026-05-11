import React, { createContext, useContext } from "react";

export interface LockContextType {
  lock: () => void;
  decoyMode: boolean;
}

export const LockContext = createContext<LockContextType>({
  lock: () => {},
  decoyMode: false,
});

export function useLock(): LockContextType {
  return useContext(LockContext);
}
