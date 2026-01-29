"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Key, Eye, EyeOff, Trash2, Check, AlertCircle } from "lucide-react";

const STORAGE_KEY = "anthropic_api_key_encrypted";

// Simple XOR encryption for localStorage (obscures casual inspection)
function xorEncrypt(text: string, key: string): string {
  let result = "";
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(
      text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
    );
  }
  return btoa(result);
}

function xorDecrypt(encoded: string, key: string): string {
  try {
    const text = atob(encoded);
    let result = "";
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(
        text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      );
    }
    return result;
  } catch {
    return "";
  }
}

// Encryption key derived from user ID
function getEncryptionKey(userId: string): string {
  return `dc_${userId}_key`;
}

function maskApiKey(key: string): string {
  if (key.length <= 12) return "****";
  return key.substring(0, 7) + "..." + key.substring(key.length - 4);
}

interface SettingsPanelProps {
  userId: string;
  onApiKeyChange?: (hasKey: boolean) => void;
}

export function SettingsPanel({ userId, onApiKeyChange }: SettingsPanelProps) {
  const [apiKey, setApiKey] = useState("");
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Load saved key on mount
  useEffect(() => {
    const encrypted = localStorage.getItem(STORAGE_KEY);
    if (encrypted) {
      const decrypted = xorDecrypt(encrypted, getEncryptionKey(userId));
      if (decrypted && decrypted.startsWith("sk-")) {
        setSavedKey(decrypted);
        onApiKeyChange?.(true);
      }
    }
  }, [userId, onApiKeyChange]);

  const handleSave = () => {
    setError(null);
    setSuccess(false);

    // Validate API key format
    if (!apiKey.trim()) {
      setError("Please enter an API key");
      return;
    }

    if (!apiKey.startsWith("sk-")) {
      setError("Invalid API key format (should start with 'sk-')");
      return;
    }

    setIsSaving(true);

    // Encrypt and save
    const encrypted = xorEncrypt(apiKey, getEncryptionKey(userId));
    localStorage.setItem(STORAGE_KEY, encrypted);

    setSavedKey(apiKey);
    setApiKey("");
    setSuccess(true);
    setIsSaving(false);
    onApiKeyChange?.(true);

    // Clear success message after 3 seconds
    setTimeout(() => setSuccess(false), 3000);
  };

  const handleDelete = () => {
    localStorage.removeItem(STORAGE_KEY);
    setSavedKey(null);
    setApiKey("");
    setShowKey(false);
    onApiKeyChange?.(false);
  };

  return (
    <div className="rounded-lg border bg-card p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Key className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">API Settings</h3>
      </div>

      <p className="text-sm text-muted-foreground">
        Enter your Anthropic API key to play the game. Your key is stored
        locally in your browser and never saved on our servers.
      </p>

      {savedKey ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 p-3 rounded-md bg-muted">
            <Check className="h-4 w-4 text-green-500" />
            <span className="text-sm font-mono flex-1">
              {showKey ? savedKey : maskApiKey(savedKey)}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowKey(!showKey)}
              className="h-8 w-8 p-0"
            >
              {showKey ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Your API key is saved and ready to use.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setError(null);
              }}
              placeholder="sk-ant-api03-..."
              className="flex-1 px-3 py-2 text-sm rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Button
              onClick={handleSave}
              disabled={isSaving || !apiKey.trim()}
              size="sm"
            >
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-500">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 text-sm text-green-500">
              <Check className="h-4 w-4" />
              API key saved successfully!
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Get your API key from{" "}
            <a
              href="https://console.anthropic.com/settings/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              console.anthropic.com
            </a>
          </p>
        </div>
      )}
    </div>
  );
}

// Utility function to get API key (for use in other components)
export function getStoredApiKey(userId: string): string | null {
  if (typeof window === "undefined") return null;

  const encrypted = localStorage.getItem(STORAGE_KEY);
  if (!encrypted) return null;

  const decrypted = xorDecrypt(encrypted, getEncryptionKey(userId));
  if (decrypted && decrypted.startsWith("sk-")) {
    return decrypted;
  }
  return null;
}
