import React, {createContext, useContext} from 'react';

/**
 * The 3D scene is mounted in two <Series> sequences (walkthrough + end card),
 * each with its own local frame. Everything animated inside the scene reads
 * the GLOBAL composition frame from here so motion stays continuous.
 */
const GlobalFrameCtx = createContext<number>(0);

export const GlobalFrameProvider: React.FC<{frame: number; children: React.ReactNode}> = ({frame, children}) => (
	<GlobalFrameCtx.Provider value={frame}>{children}</GlobalFrameCtx.Provider>
);

export const useGlobalFrame = () => useContext(GlobalFrameCtx);
