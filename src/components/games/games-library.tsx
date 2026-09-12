"use client";

import { useMemo, useState, useTransition } from "react";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";
import { GameForm } from "@/components/games/game-form";
import { Spinner } from "@/components/spinner";
import { addGame, updateGame, deleteGame } from "@/app/actions/games";
import type { GameFormValues } from "@/lib/game-schema";
import type { Game, PlayStatus } from "@/types";
import type { Dictionary } from "@/lib/dictionaries/en";

const PLAY_STATUS_BADGE: Record<PlayStatus, string> = {
  backlog: "bg-muted text-foreground/70",
  playing: "bg-primary/15 text-primary",
  finished: "bg-accent/15 text-accent",
  dropped: "bg-destructive/15 text-destructive",
};

function toFormData(values: GameFormValues): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(values)) {
    fd.set(key, value === undefined || value === null ? "" : String(value));
  }
  return fd;
}

function formatPlaytime(minutes: number): string {
  if (minutes === 0) return "—";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

function formatDownloadSize(bytes: number | null): string {
  if (bytes === null || bytes === 0) return "—";
  const gb = bytes / 1024 ** 3;
  if (gb >= 1) return `${gb.toFixed(1)} GB`;
  const mb = bytes / 1024 ** 2;
  return `${mb.toFixed(0)} MB`;
}

type SortColumn =
  | "title"
  | "store"
  | "play_status"
  | "install_status"
  | "playtime_minutes"
  | "deck_compat"
  | "rating"
  | "download_size_bytes";
type SortDirection = "asc" | "desc";

// Sorts by the localized label the user actually sees for the enum columns
// (store/play_status/install_status/deck_compat), not the raw db value —
// so switching to ms doesn't leave sort order tied to English text.
function sortGames(games: Game[], column: SortColumn, direction: SortDirection, dict: Dictionary["games"]): Game[] {
  const sortKey = (game: Game): string | number => {
    switch (column) {
      case "title":
        return game.title.toLowerCase();
      case "store":
        return dict.store[game.store];
      case "play_status":
        return dict.playStatus[game.play_status];
      case "install_status":
        return dict.installStatus[game.install_status];
      case "deck_compat":
        return dict.deckCompat[game.deck_compat];
      case "playtime_minutes":
        return game.playtime_minutes;
      case "download_size_bytes":
        // Unmeasured sizes sort to the end regardless of direction, same
        // treatment as unrated games below.
        return game.download_size_bytes ?? (direction === "asc" ? Infinity : -Infinity);
      case "rating":
        // Unrated games sort to the end regardless of direction, rather
        // than clumping at whichever end 0/null happens to land on.
        return game.rating ?? (direction === "asc" ? Infinity : -Infinity);
    }
  };

  const sorted = [...games].sort((a, b) => {
    const ka = sortKey(a);
    const kb = sortKey(b);
    if (typeof ka === "number" && typeof kb === "number") return ka - kb;
    return String(ka).localeCompare(String(kb));
  });

  return direction === "asc" ? sorted : sorted.reverse();
}

function SortableHeader({
  column,
  sort,
  onSort,
  children,
}: {
  column: SortColumn;
  sort: { column: SortColumn; direction: SortDirection } | null;
  onSort: (column: SortColumn) => void;
  children: React.ReactNode;
}) {
  const active = sort?.column === column;
  return (
    <th
      className="px-4 py-3 font-medium"
      aria-sort={active ? (sort!.direction === "asc" ? "ascending" : "descending") : "none"}
    >
      <button
        type="button"
        onClick={() => onSort(column)}
        className="inline-flex cursor-pointer items-center gap-1 py-1 -my-1 text-left transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        {children}
        <span className={`text-[10px] ${active ? "text-foreground" : "text-foreground/30"}`} aria-hidden="true">
          {active ? (sort!.direction === "asc" ? "▲" : "▼") : "▲▼"}
        </span>
      </button>
    </th>
  );
}

export function GamesLibrary({ games, dict }: { games: Game[]; dict: Dictionary["games"] }) {
  const [addOpen, setAddOpen] = useState(false);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [deletingId, startDeleteTransition] = useTransition();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [sort, setSort] = useState<{ column: SortColumn; direction: SortDirection } | null>(null);

  const sortedGames = useMemo(
    () => (sort ? sortGames(games, sort.column, sort.direction, dict) : games),
    [games, sort, dict]
  );

  const toggleSort = (column: SortColumn) => {
    setSort((current) => {
      if (!current || current.column !== column) return { column, direction: "asc" };
      if (current.direction === "asc") return { column, direction: "desc" };
      return null; // third click on the same column clears back to insertion order
    });
  };

  const handleAdd = async (values: GameFormValues) => {
    const result = await addGame(toFormData(values));
    if (!result.error) setAddOpen(false);
    return result;
  };

  const handleEdit = async (values: GameFormValues) => {
    if (!editingGame) return { error: null };
    const result = await updateGame(editingGame.id, toFormData(values));
    if (!result.error) setEditingGame(null);
    return result;
  };

  const handleDelete = (id: string) => {
    if (!confirm(dict.form.confirmDelete)) return;
    setPendingDeleteId(id);
    startDeleteTransition(async () => {
      await deleteGame(id);
      setPendingDeleteId(null);
    });
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-12 animate-page-in">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            {dict.title} <span className="text-foreground/50">({games.length})</span>
          </h1>
          <p className="text-sm text-foreground/60">{dict.subtitle}</p>
        </div>

        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <button
              type="button"
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              {dict.addGame}
            </button>
          </DialogTrigger>
          <DialogContent title={dict.form.newTitle}>
            <GameForm dict={dict} onSubmit={handleAdd} onCancel={() => setAddOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {games.length === 0 ? (
        <div className="rounded-2xl border border-border bg-muted/40 p-10 text-center text-sm text-foreground/60">
          {dict.empty}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/40 text-foreground/60">
              <tr>
                <SortableHeader column="title" sort={sort} onSort={toggleSort}>
                  {dict.table.title}
                </SortableHeader>
                <SortableHeader column="store" sort={sort} onSort={toggleSort}>
                  {dict.table.store}
                </SortableHeader>
                <SortableHeader column="play_status" sort={sort} onSort={toggleSort}>
                  {dict.table.playStatus}
                </SortableHeader>
                <SortableHeader column="install_status" sort={sort} onSort={toggleSort}>
                  {dict.table.installStatus}
                </SortableHeader>
                <SortableHeader column="playtime_minutes" sort={sort} onSort={toggleSort}>
                  {dict.table.playtime}
                </SortableHeader>
                <SortableHeader column="deck_compat" sort={sort} onSort={toggleSort}>
                  {dict.table.deckCompat}
                </SortableHeader>
                <SortableHeader column="rating" sort={sort} onSort={toggleSort}>
                  {dict.table.rating}
                </SortableHeader>
                <SortableHeader column="download_size_bytes" sort={sort} onSort={toggleSort}>
                  {dict.table.downloadSize}
                </SortableHeader>
                <th className="px-4 py-3 font-medium text-right">{dict.table.actions}</th>
              </tr>
            </thead>
            <tbody>
              {sortedGames.map((game) => (
                <tr key={game.id} className="animate-row-in border-t border-border">
                  <td className="px-4 py-3 font-medium text-foreground">{game.title}</td>
                  <td className="px-4 py-3 text-foreground/70">{dict.store[game.store]}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${PLAY_STATUS_BADGE[game.play_status]}`}
                    >
                      {dict.playStatus[game.play_status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-foreground/70">{dict.installStatus[game.install_status]}</td>
                  <td className="px-4 py-3 font-mono text-foreground/70">{formatPlaytime(game.playtime_minutes)}</td>
                  <td className="px-4 py-3 text-foreground/70">{dict.deckCompat[game.deck_compat]}</td>
                  <td className="px-4 py-3 font-mono text-foreground/70">{game.rating ?? "—"}</td>
                  <td className="px-4 py-3 font-mono text-foreground/70">
                    {formatDownloadSize(game.download_size_bytes)}
                    {game.download_size_bytes !== null && game.download_size_source === "steam_crossmatch" && (
                      <span
                        className="ml-1.5 cursor-help text-[10px] font-sans text-foreground/40"
                        title={dict.downloadSizeSource.steam_crossmatch}
                      >
                        ~
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setEditingGame(game)}
                      className="cursor-pointer py-2 -my-2 pl-2 text-sm text-foreground/70 underline-offset-4 hover:text-foreground hover:underline"
                    >
                      {dict.edit}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(game.id)}
                      disabled={deletingId && pendingDeleteId === game.id}
                      className="cursor-pointer py-2 -my-2 pl-3 text-sm text-destructive underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {pendingDeleteId === game.id ? <Spinner className="inline h-3.5 w-3.5" /> : dict.delete}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={!!editingGame} onOpenChange={(open) => !open && setEditingGame(null)}>
        <DialogContent title={dict.form.editTitle}>
          {editingGame && (
            <GameForm game={editingGame} dict={dict} onSubmit={handleEdit} onCancel={() => setEditingGame(null)} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
