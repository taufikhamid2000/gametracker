"use client";

import { Fragment, useEffect, useMemo, useState, useTransition } from "react";
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

// Title, actions, and (for now) store are always shown — everything else can
// be hidden per-viewer. Status/Installed/Playtime/Deck/Rating start hidden
// since most people care about store and size first and the rest is clutter
// until they ask for it.
type ToggleableColumn = "play_status" | "install_status" | "playtime_minutes" | "deck_compat" | "rating";
const TOGGLEABLE_COLUMNS: ToggleableColumn[] = [
  "play_status",
  "install_status",
  "playtime_minutes",
  "deck_compat",
  "rating",
];
const DEFAULT_VISIBLE_COLUMNS: Record<ToggleableColumn, boolean> = {
  play_status: false,
  install_status: false,
  playtime_minutes: false,
  deck_compat: false,
  rating: false,
};
const VISIBLE_COLUMNS_STORAGE_KEY = "gametracker:visibleColumns";
const COLUMN_LABEL_KEY: Record<ToggleableColumn, keyof Dictionary["games"]["table"]> = {
  play_status: "playStatus",
  install_status: "installStatus",
  playtime_minutes: "playtime",
  deck_compat: "deckCompat",
  rating: "rating",
};

function loadVisibleColumns(): Record<ToggleableColumn, boolean> {
  if (typeof window === "undefined") return DEFAULT_VISIBLE_COLUMNS;
  try {
    const raw = window.localStorage.getItem(VISIBLE_COLUMNS_STORAGE_KEY);
    if (!raw) return DEFAULT_VISIBLE_COLUMNS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_VISIBLE_COLUMNS, ...parsed };
  } catch {
    return DEFAULT_VISIBLE_COLUMNS;
  }
}

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

function GameRow({
  game,
  dict,
  indented,
  hasChildren,
  isExpanded,
  onToggleExpanded,
  onEdit,
  onDelete,
  deleting,
  visibleColumns,
}: {
  game: Game;
  dict: Dictionary["games"];
  indented: boolean;
  hasChildren: boolean;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onEdit: () => void;
  onDelete: () => void;
  deleting: boolean;
  visibleColumns: Record<ToggleableColumn, boolean>;
}) {
  return (
    <tr className="animate-row-in border-t border-border">
      <td className="px-4 py-3 font-medium text-foreground">
        <div className={`flex items-center gap-1.5 ${indented ? "pl-6" : ""}`}>
          {hasChildren ? (
            <button
              type="button"
              onClick={onToggleExpanded}
              aria-expanded={isExpanded}
              aria-label={isExpanded ? dict.collapse : dict.expand}
              className="cursor-pointer rounded p-0.5 text-foreground/40 transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <span className="inline-block w-3 text-[10px]" aria-hidden="true">
                {isExpanded ? "▼" : "▶"}
              </span>
            </button>
          ) : (
            !indented && <span className="inline-block w-3" aria-hidden="true" />
          )}
          <span>{game.title}</span>
          {!game.owned && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-foreground/50">
              {dict.notOwned}
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-foreground/70">{dict.store[game.store]}</td>
      {visibleColumns.play_status && (
        <td className="px-4 py-3">
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${PLAY_STATUS_BADGE[game.play_status]}`}>
            {dict.playStatus[game.play_status]}
          </span>
        </td>
      )}
      {visibleColumns.install_status && (
        <td className="px-4 py-3 text-foreground/70">{dict.installStatus[game.install_status]}</td>
      )}
      {visibleColumns.playtime_minutes && (
        <td className="px-4 py-3 font-mono text-foreground/70">{formatPlaytime(game.playtime_minutes)}</td>
      )}
      {visibleColumns.deck_compat && (
        <td className="px-4 py-3 text-foreground/70">{dict.deckCompat[game.deck_compat]}</td>
      )}
      {visibleColumns.rating && <td className="px-4 py-3 font-mono text-foreground/70">{game.rating ?? "—"}</td>}
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
          onClick={onEdit}
          className="cursor-pointer py-2 -my-2 pl-2 text-sm text-foreground/70 underline-offset-4 hover:text-foreground hover:underline"
        >
          {dict.edit}
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={deleting}
          className="cursor-pointer py-2 -my-2 pl-3 text-sm text-destructive underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
        >
          {deleting ? <Spinner className="inline h-3.5 w-3.5" /> : dict.delete}
        </button>
      </td>
    </tr>
  );
}

export function GamesLibrary({ games, dict }: { games: Game[]; dict: Dictionary["games"] }) {
  const [addOpen, setAddOpen] = useState(false);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [deletingId, startDeleteTransition] = useTransition();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [sort, setSort] = useState<{ column: SortColumn; direction: SortDirection } | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [columnsOpen, setColumnsOpen] = useState(false);
  // Starts from the shared default on every render (server and client alike)
  // so hydration matches, then syncs to whatever this browser had saved.
  const [visibleColumns, setVisibleColumns] = useState<Record<ToggleableColumn, boolean>>(DEFAULT_VISIBLE_COLUMNS);

  useEffect(() => {
    setVisibleColumns(loadVisibleColumns());
  }, []);

  const toggleColumn = (column: ToggleableColumn) => {
    setVisibleColumns((current) => {
      const next = { ...current, [column]: !current[column] };
      try {
        window.localStorage.setItem(VISIBLE_COLUMNS_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // per-viewer convenience only — fine if it can't be saved (private mode, storage disabled, etc.)
      }
      return next;
    });
  };

  const sortedGames = useMemo(
    () => (sort ? sortGames(games, sort.column, sort.direction, dict) : games),
    [games, sort, dict]
  );

  // Children (DLC/cosmetics) are looked up from the full unsorted list, keyed
  // by parent id, then rendered in whatever order sortedGames already put
  // them in — so sorting a column still orders child rows sensibly relative
  // to each other, they just don't compete with top-level rows for position.
  const childrenByParent = useMemo(() => {
    const map = new Map<string, Game[]>();
    for (const game of sortedGames) {
      if (!game.parent_id) continue;
      const siblings = map.get(game.parent_id) ?? [];
      siblings.push(game);
      map.set(game.parent_id, siblings);
    }
    return map;
  }, [sortedGames]);

  const topLevelGames = useMemo(() => sortedGames.filter((game) => !game.parent_id), [sortedGames]);

  const toggleExpanded = (id: string) => setExpanded((current) => ({ ...current, [id]: !current[id] }));

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

        <div className="flex items-center gap-2">
          <Dialog open={columnsOpen} onOpenChange={setColumnsOpen}>
            <DialogTrigger asChild>
              <button
                type="button"
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium text-foreground/70 transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                {dict.columns.button}
              </button>
            </DialogTrigger>
            <DialogContent title={dict.columns.title}>
              <div className="flex flex-col gap-3 py-2">
                {TOGGLEABLE_COLUMNS.map((column) => (
                  <label key={column} className="flex cursor-pointer items-center gap-2.5 text-sm text-foreground">
                    <input
                      type="checkbox"
                      checked={visibleColumns[column]}
                      onChange={() => toggleColumn(column)}
                      className="h-4 w-4 cursor-pointer accent-primary"
                    />
                    {dict.table[COLUMN_LABEL_KEY[column]]}
                  </label>
                ))}
              </div>
            </DialogContent>
          </Dialog>

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
                {visibleColumns.play_status && (
                  <SortableHeader column="play_status" sort={sort} onSort={toggleSort}>
                    {dict.table.playStatus}
                  </SortableHeader>
                )}
                {visibleColumns.install_status && (
                  <SortableHeader column="install_status" sort={sort} onSort={toggleSort}>
                    {dict.table.installStatus}
                  </SortableHeader>
                )}
                {visibleColumns.playtime_minutes && (
                  <SortableHeader column="playtime_minutes" sort={sort} onSort={toggleSort}>
                    {dict.table.playtime}
                  </SortableHeader>
                )}
                {visibleColumns.deck_compat && (
                  <SortableHeader column="deck_compat" sort={sort} onSort={toggleSort}>
                    {dict.table.deckCompat}
                  </SortableHeader>
                )}
                {visibleColumns.rating && (
                  <SortableHeader column="rating" sort={sort} onSort={toggleSort}>
                    {dict.table.rating}
                  </SortableHeader>
                )}
                <SortableHeader column="download_size_bytes" sort={sort} onSort={toggleSort}>
                  {dict.table.downloadSize}
                </SortableHeader>
                <th className="px-4 py-3 font-medium text-right">{dict.table.actions}</th>
              </tr>
            </thead>
            <tbody>
              {topLevelGames.map((game) => {
                const children = childrenByParent.get(game.id) ?? [];
                const isExpanded = !!expanded[game.id];
                return (
                  <Fragment key={game.id}>
                    <GameRow
                      game={game}
                      dict={dict}
                      indented={false}
                      hasChildren={children.length > 0}
                      isExpanded={isExpanded}
                      onToggleExpanded={() => toggleExpanded(game.id)}
                      onEdit={() => setEditingGame(game)}
                      onDelete={() => handleDelete(game.id)}
                      deleting={deletingId !== null && pendingDeleteId === game.id}
                      visibleColumns={visibleColumns}
                    />
                    {isExpanded &&
                      children.map((child) => (
                        <GameRow
                          key={child.id}
                          game={child}
                          dict={dict}
                          indented
                          hasChildren={false}
                          isExpanded={false}
                          onToggleExpanded={() => {}}
                          onEdit={() => setEditingGame(child)}
                          onDelete={() => handleDelete(child.id)}
                          deleting={deletingId !== null && pendingDeleteId === child.id}
                          visibleColumns={visibleColumns}
                        />
                      ))}
                  </Fragment>
                );
              })}
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
