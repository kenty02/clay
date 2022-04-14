import React, { useContext } from "react";

export type CanvasState = {
  offset: { x: number; y: number };
  scale: number;
};

export const CanvasContext = React.createContext<CanvasState>({} as any);

export const Canvas: React.VFC = () => {
  const { state } = useContext(CanvasContext);
  return <></>;
};
