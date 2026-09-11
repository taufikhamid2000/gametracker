"use client";

import { useState, useTransition } from "react";
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

export function GamesLibrary({ games, dict }: { games: Game[]; dict: Dictionary["games"] }) {
  const [addOpen, setAddOpen] = useState(false);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [deletingId, startDeleteTransition] = useTransition();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

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
          <h1 className="text-xl font-semibold text-foreground">{dict.title}</h1>
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
                <th className="px-4 py-3 font-medium">{dict.table.title}</th>
                <th className="px-4 py-3 font-medium">{dict.table.store}</th>
                <th className="px-4 py-3 font-medium">{dict.table.playStatus}</th>
                <th className="px-4 py-3 font-medium">{dict.table.installStatus}</th>
                <th className="px-4 py-3 font-medium">{dict.table.playtime}</th>
                <th className="px-4 py-3 font-medium">{dict.table.deckCompat}</th>
                <th className="px-4 py-3 font-medium">{dict.table.rating}</th>
                <th className="px-4 py-3 font-medium text-right">{dict.table.actions}</th>
              </tr>
            </thead>
            <tbody>
              {games.map((game) => (
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
