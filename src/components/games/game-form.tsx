"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { gameFormSchema, gameFormDefaults, type GameFormValues } from "@/lib/game-schema";
import { STORES, INSTALL_STATUSES, PLAY_STATUSES, DECK_COMPAT_RATINGS, type Game } from "@/types";
import { Spinner } from "@/components/spinner";
import type { Dictionary } from "@/lib/dictionaries/en";

const FIELD_CLASS =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring";
const LABEL_CLASS = "text-sm font-medium text-foreground/70";

function toDefaults(game?: Game | null): GameFormValues {
  if (!game) return gameFormDefaults;
  return {
    title: game.title,
    store: game.store,
    store_id: game.store_id ?? "",
    install_status: game.install_status,
    install_path: game.install_path ?? "",
    play_status: game.play_status,
    playtime_minutes: game.playtime_minutes,
    last_played_at: game.last_played_at ? game.last_played_at.slice(0, 10) : "",
    deck_compat: game.deck_compat,
    rating: game.rating ?? "",
    notes: game.notes ?? "",
    price_amount: game.price_amount ?? "",
    price_currency: game.price_currency ?? "",
  };
}

export function GameForm({
  game,
  dict,
  onSubmit,
  onCancel,
}: {
  game?: Game | null;
  dict: Dictionary["games"];
  onSubmit: (values: GameFormValues) => Promise<{ error: string | null }>;
  onCancel: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<GameFormValues>({
    resolver: zodResolver(gameFormSchema),
    defaultValues: toDefaults(game),
  });

  const submit = async (values: GameFormValues) => {
    setIsSubmitting(true);
    setServerError(null);
    try {
      const result = await onSubmit(values);
      if (result.error) {
        setServerError(result.error);
      }
    } catch {
      setServerError(dict.form.genericError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="mt-4 flex flex-col gap-4">
      {serverError && <p className="text-sm text-destructive">{serverError}</p>}

      <div className="flex flex-col gap-1.5">
        <label className={LABEL_CLASS} htmlFor="title">
          {dict.form.titleLabel}
        </label>
        <input
          id="title"
          {...register("title")}
          placeholder={dict.form.titlePlaceholder}
          disabled={isSubmitting}
          className={FIELD_CLASS}
        />
        {errors.title && <p className="text-sm text-destructive">{dict.form.titleRequired}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className={LABEL_CLASS} htmlFor="store">
            {dict.form.storeLabel}
          </label>
          <select id="store" {...register("store")} disabled={isSubmitting} className={FIELD_CLASS}>
            {STORES.map((s) => (
              <option key={s} value={s}>
                {dict.store[s]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={LABEL_CLASS} htmlFor="store_id">
            {dict.form.storeIdLabel}
          </label>
          <input
            id="store_id"
            {...register("store_id")}
            placeholder={dict.form.storeIdPlaceholder}
            disabled={isSubmitting}
            className={FIELD_CLASS}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className={LABEL_CLASS} htmlFor="play_status">
            {dict.form.playStatusLabel}
          </label>
          <select id="play_status" {...register("play_status")} disabled={isSubmitting} className={FIELD_CLASS}>
            {PLAY_STATUSES.map((s) => (
              <option key={s} value={s}>
                {dict.playStatus[s]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={LABEL_CLASS} htmlFor="install_status">
            {dict.form.installStatusLabel}
          </label>
          <select
            id="install_status"
            {...register("install_status")}
            disabled={isSubmitting}
            className={FIELD_CLASS}
          >
            {INSTALL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {dict.installStatus[s]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={LABEL_CLASS} htmlFor="install_path">
          {dict.form.installPathLabel}
        </label>
        <input
          id="install_path"
          {...register("install_path")}
          placeholder={dict.form.installPathPlaceholder}
          disabled={isSubmitting}
          className={FIELD_CLASS}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className={LABEL_CLASS} htmlFor="playtime_minutes">
            {dict.form.playtimeLabel}
          </label>
          <input
            id="playtime_minutes"
            type="number"
            min={0}
            {...register("playtime_minutes")}
            disabled={isSubmitting}
            className={FIELD_CLASS}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={LABEL_CLASS} htmlFor="last_played_at">
            {dict.form.lastPlayedLabel}
          </label>
          <input
            id="last_played_at"
            type="date"
            {...register("last_played_at")}
            disabled={isSubmitting}
            className={FIELD_CLASS}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={LABEL_CLASS} htmlFor="rating">
            {dict.form.ratingLabel}
          </label>
          <input
            id="rating"
            type="number"
            min={1}
            max={10}
            placeholder={dict.form.ratingPlaceholder}
            {...register("rating")}
            disabled={isSubmitting}
            className={FIELD_CLASS}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className={LABEL_CLASS} htmlFor="price_amount">
            {dict.form.priceAmountLabel}
          </label>
          <input
            id="price_amount"
            type="number"
            min={0}
            step="0.01"
            placeholder={dict.form.priceAmountPlaceholder}
            {...register("price_amount")}
            disabled={isSubmitting}
            className={FIELD_CLASS}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={LABEL_CLASS} htmlFor="price_currency">
            {dict.form.priceCurrencyLabel}
          </label>
          <input
            id="price_currency"
            {...register("price_currency")}
            placeholder={dict.form.priceCurrencyPlaceholder}
            disabled={isSubmitting}
            className={FIELD_CLASS}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={LABEL_CLASS} htmlFor="deck_compat">
          {dict.form.deckCompatLabel}
        </label>
        <select id="deck_compat" {...register("deck_compat")} disabled={isSubmitting} className={FIELD_CLASS}>
          {DECK_COMPAT_RATINGS.map((s) => (
            <option key={s} value={s}>
              {dict.deckCompat[s]}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={LABEL_CLASS} htmlFor="notes">
          {dict.form.notesLabel}
        </label>
        <textarea
          id="notes"
          rows={3}
          {...register("notes")}
          placeholder={dict.form.notesPlaceholder}
          disabled={isSubmitting}
          className={FIELD_CLASS}
        />
      </div>

      <div className="mt-2 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {dict.form.cancel}
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {isSubmitting && <Spinner />}
          {isSubmitting ? dict.form.saving : dict.form.save}
        </button>
      </div>
    </form>
  );
}
