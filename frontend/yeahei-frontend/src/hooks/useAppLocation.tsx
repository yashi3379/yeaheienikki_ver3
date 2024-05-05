// hooks/useAppLocation.ts
import { useLocation } from 'react-router-dom';

interface LocationState {
  message?: string;
}

export function useAppLocation() {
  return useLocation() as unknown as { state?: LocationState };
}
