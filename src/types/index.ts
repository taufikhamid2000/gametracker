export const STORES = ["steam", "epic", "gog", "ubisoft", "ea", "xbox", "other"] as const;
export type Store = (typeof STORES)[number];

export const INSTALL_STATUSES = ["not_installed", "installed"] as const;
export type InstallStatus = (typeof INSTALL_STATUSES)[number];

export const PLAY_STATUSES = ["backlog", "playing", "finished", "dropped"] as const;
export type PlayStatus = (typeof PLAY_STATUSES)[number];

export const DECK_COMPAT_RATINGS = ["unknown", "verified", "playable", "unsupported"] as const;
export type DeckCompat = (typeof DECK_COMPAT_RATINGS)[number];

export interface Game {
  id: string;
  user_id: string;
  title: string;
  store: Store;
  store_id: string | null;
  install_status: InstallStatus;
  install_path: string | null;
  play_status: PlayStatus;
  playtime_minutes: number;
  last_played_at: string | null;
  deck_compat: DeckCompat;
  rating: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type GameInsert = Omit<Game, "id" | "user_id" | "created_at" | "updated_at">;
export type GameUpdate = Partial<GameInsert>;

export type Database = {
  gametracker: {
    Tables: {
      games: {
        Row: Game;
        Insert: Partial<Game> & Pick<Game, "title">;
        Update: GameUpdate;
      };
    };
    Views: object;
    Functions: object;
    Enums: {
      store: Store;
      install_status: InstallStatus;
      play_status: PlayStatus;
      deck_compat: DeckCompat;
    };
  };
};
