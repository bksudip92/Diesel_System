// context/PlaceContext.tsx
import React, { createContext, useContext, useState } from 'react';

interface PlaceContextType {
  place: any;
  setPlace: any ;
}

const PlaceContext = createContext<PlaceContextType | null>(null);

interface PlaceProviderProps {
  children: React.ReactNode;
}

export function PlaceProvider({ children }: PlaceProviderProps) {
  const [place, setPlace] = useState<any>(null);

  return (
    <PlaceContext.Provider value={{ place, setPlace }}>
      {children}
    </PlaceContext.Provider>
  );
}

export const usePlace = () => useContext(PlaceContext);