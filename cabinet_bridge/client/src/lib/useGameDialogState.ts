import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Game } from "@/data/library";
import type { UploadedRom, GameCollectionWithItems } from "@shared/schema";

/**
 * Shared hook that manages all game-detail-dialog state: open/close,
 * fav/rating/status optimistic overrides, and the underlying mutations.
 *
 * Used by both Home.tsx and Dashboard.tsx so the dialog behaviour is
 * consistent across both pages.
 */
export function useGameDialogState() {
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [favOverrides, setFavOverrides] = useState<Record<string, boolean>>({});
  const [ratingOverrides, setRatingOverrides] = useState<Record<string, number>>({});
  const [statusOverrides, setStatusOverrides] = useState<Record<string, string>>({});

  // ── mutations ──────────────────────────────────────────────────────────────
  const favoriteUploadedRom = useMutation({
    mutationFn: async ({ game, favorite }: { game: Game; favorite: boolean }) => {
      if (!game.romId) return null;
      const res = await apiRequest("PATCH", `/api/roms/${game.romId}/favorite`, { favorite });
      return (await res.json()) as UploadedRom;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/roms"] });
    },
  });

  const rateUploadedRom = useMutation({
    mutationFn: async ({ game, rating }: { game: Game; rating: number }) => {
      if (!game.romId) return null;
      const res = await apiRequest("PATCH", `/api/roms/${game.romId}/rating`, { rating });
      return (await res.json()) as UploadedRom;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/roms"] });
    },
  });

  const setStatusMutation = useMutation({
    mutationFn: async ({ game, playStatus }: { game: Game; playStatus: string }) => {
      if (!game.romId) return null;
      const res = await apiRequest("PATCH", `/api/roms/${game.romId}/play-status`, { playStatus });
      return (await res.json()) as UploadedRom;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/roms"] });
    },
  });

  const createCollectionMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await apiRequest("POST", "/api/collections", { name });
      return (await res.json()) as GameCollectionWithItems;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/collections"] });
    },
  });

  const toggleCollectionItem = useMutation({
    mutationFn: async ({
      collectionId,
      romId,
      selected,
    }: {
      collectionId: number;
      romId: number;
      selected: boolean;
    }) => {
      const method = selected ? "PUT" : "DELETE";
      const res = await apiRequest(method, `/api/collections/${collectionId}/roms/${romId}`);
      return (await res.json()) as GameCollectionWithItems;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/collections"] });
    },
  });

  // ── actions ────────────────────────────────────────────────────────────────
  const openGame = (game: Game) => setSelectedGame(game);
  const closeGame = () => setSelectedGame(null);

  const handleToggleFav = (game: Game) => {
    const next = !(favOverrides[game.id] !== undefined ? favOverrides[game.id] : !!game.favorite);
    setFavOverrides((prev) => ({ ...prev, [game.id]: next }));
    setSelectedGame((cur) => (cur && cur.id === game.id ? { ...cur, favorite: next } : cur));
    if (game.romId) favoriteUploadedRom.mutate({ game, favorite: next });
  };

  const handleRate = (game: Game, rating: number) => {
    setRatingOverrides((prev) => ({ ...prev, [game.id]: rating }));
    setSelectedGame((cur) => (cur && cur.id === game.id ? { ...cur, rating } : cur));
    if (game.romId) rateUploadedRom.mutate({ game, rating });
  };

  const handleSetStatus = (game: Game, playStatus: string) => {
    setStatusOverrides((prev) => ({ ...prev, [game.id]: playStatus }));
    setSelectedGame((cur) => (cur && cur.id === game.id ? { ...cur, playStatus } : cur));
    if (game.romId) setStatusMutation.mutate({ game, playStatus });
  };

  const handleCreateCollection = () => {
    const name = window.prompt("Name this collection", "RPGs");
    const trimmed = name?.trim();
    if (!trimmed) return;
    createCollectionMutation.mutate(trimmed);
  };

  const handleToggleCollection = (collectionId: number, game: Game, selected: boolean) => {
    if (!game.romId) return;
    toggleCollectionItem.mutate({ collectionId, romId: game.romId, selected });
  };

  return {
    selectedGame,
    openGame,
    closeGame,
    handleToggleFav,
    handleRate,
    handleSetStatus,
    handleCreateCollection,
    handleToggleCollection,
    favOverrides,
    ratingOverrides,
    statusOverrides,
  };
}
