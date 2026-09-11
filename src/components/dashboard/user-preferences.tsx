"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

type UserPreferencesProps = {
  userId: string;
  initialSettings?: {
    theme?: "light" | "dark" | "system";
    emailNotifications?: boolean;
  };
};

export default function UserPreferences({
  userId,
  initialSettings = { theme: "system", emailNotifications: true },
}: UserPreferencesProps) {
  const [settings, setSettings] = useState(initialSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">(
    "idle"
  );

  const handleThemeChange = (theme: "light" | "dark" | "system") => {
    setSettings({ ...settings, theme });
    setSaveStatus("idle");
  };

  const handleNotificationsChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSettings({ ...settings, emailNotifications: e.target.checked });
    setSaveStatus("idle");
  };

  const savePreferences = async () => {
    setIsSaving(true);
    setSaveStatus("idle");

    try {
      const supabase = createClient();

      // Update user preferences in a profile or user_preferences table
      const { error } = await supabase
        .from("profiles")
        .update({
          theme_preference: settings.theme,
          email_notifications: settings.emailNotifications,
        })
        .eq("id", userId);

      if (error) throw error;
      setSaveStatus("success");
    } catch (error) {
      console.error("Error saving preferences:", error);
      setSaveStatus("error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">User Preferences</h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Theme</label>
          <div className="flex space-x-4">
            {(["light", "dark", "system"] as const).map((theme) => (
              <button
                key={theme}
                onClick={() => handleThemeChange(theme)}
                className={`px-3 py-1 rounded-md text-sm ${
                  settings.theme === theme
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {theme.charAt(0).toUpperCase() + theme.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={settings.emailNotifications}
              onChange={handleNotificationsChange}
              className="rounded border-gray-300"
            />
            <span className="text-sm font-medium">Email notifications</span>
          </label>
        </div>

        <div className="pt-2">
          <button
            onClick={savePreferences}
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
          >
            {isSaving ? "Saving..." : "Save Preferences"}
          </button>

          {saveStatus === "success" && (
            <span className="ml-2 text-sm text-green-600">
              Saved successfully!
            </span>
          )}

          {saveStatus === "error" && (
            <span className="ml-2 text-sm text-red-600">
              Failed to save. Please try again.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
