"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Header } from "@/components/header";
import { useUserSettings } from "@/lib/hooks/use-user-settings";
import { useAuth } from "@/lib/hooks/use-auth";

export default function SettingsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { settings, updateSettings } = useUserSettings();
  const { theme, setTheme } = useTheme();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="h-dvh flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!user) {
    return null;
  }

  return (
    <div className="bg-background max-w-xl mx-auto min-h-screen">
      <Header title="Settings" showBack />

      <main className="px-3 pb-3 space-y-3">
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>
              Customize the look and feel of the app
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Field>
              <FieldLabel htmlFor="theme">Theme</FieldLabel>
              <Select
                value={theme}
                onValueChange={setTheme}
              >
                <SelectTrigger id="theme">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Time Tracking Preferences</CardTitle>
            <CardDescription>
              Configure how you want to track your time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Field>
              <FieldLabel>Working Hours</FieldLabel>
              <div className="flex gap-2 items-center">
                <Select
                  value={settings.day_start_hour.toString()}
                  onValueChange={(value) => updateSettings({ day_start_hour: parseInt(value) })}
                >
                  <SelectTrigger id="dayStart">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => (
                      <SelectItem key={i} value={i.toString()}>
                        {i.toString().padStart(2, "0")}:00
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-muted-foreground">to</span>
                <Select
                  value={settings.day_end_hour.toString()}
                  onValueChange={(value) => updateSettings({ day_end_hour: parseInt(value) })}
                >
                  <SelectTrigger id="dayEnd">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => i + 1).map((hour) => (
                      <SelectItem key={hour} value={hour.toString()}>
                        {hour.toString().padStart(2, "0")}:00
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </Field>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
