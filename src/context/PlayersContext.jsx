"use client";

import { createContext, useContext, useMemo } from "react";

import {
  getEventResponseSummary,
  getPlayerById,
  getPlayerName,
  getSquadPlayers,
} from "@/lib/players";

const PlayersContext = createContext(null);

export function PlayersProvider({ players, children }) {
  const value = useMemo(
    () => ({
      players,
      getPlayerById: (playerId) => getPlayerById(players, playerId),
      getPlayerName: (playerId) => getPlayerName(players, playerId),
      getSquadPlayers: () => getSquadPlayers(players),
      getEventResponseSummary: (eventId, responses) =>
        getEventResponseSummary(players, eventId, responses),
    }),
    [players]
  );

  return (
    <PlayersContext.Provider value={value}>{children}</PlayersContext.Provider>
  );
}

export function usePlayers() {
  const context = useContext(PlayersContext);

  if (!context) {
    throw new Error("usePlayers must be used within PlayersProvider");
  }

  return context;
}
