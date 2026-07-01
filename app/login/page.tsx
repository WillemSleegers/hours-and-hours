"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel } from "@/components/ui/field"
import { signInWithGithub, signInWithMagicLink } from "@/lib/auth"
import { toast } from "sonner"
import { Mail, Clock } from "lucide-react"

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} role="img" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  )
}

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const router = useRouter()

  const handleGithubLogin = async () => {
    try {
      setIsLoading(true)
      await signInWithGithub()
      // OAuth will redirect automatically
    } catch (error) {
      console.error("Error signing in with GitHub:", error)
      toast.error("Failed to sign in with GitHub")
      setIsLoading(false)
    }
  }

  const handleMagicLinkLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      toast.error("Please enter your email")
      return
    }

    try {
      setIsLoading(true)
      await signInWithMagicLink(email)
      setEmailSent(true)
      toast.success("Check your email for the login link!")
    } catch (error) {
      console.error("Error sending magic link:", error)
      toast.error("Failed to send magic link")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-background via-background to-accent/10 p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <Clock className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Hours and Hours</h1>
        </div>

        {/* Login Card */}
        <div className="bg-card border border-border rounded-2xl shadow-lg p-8">
          {emailSent ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-2">Check your email</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  We sent a magic link to{" "}
                  <span className="font-medium text-foreground">{email}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Click the link in the email to sign in
                </p>
              </div>
              <Button
                variant="ghost"
                onClick={() => {
                  setEmailSent(false)
                  setEmail("")
                }}
                className="w-full"
              >
                Use a different email
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* GitHub Login */}
              <Button
                onClick={handleGithubLogin}
                disabled={isLoading}
                className="w-full h-12 gap-3 text-base"
                size="lg"
              >
                <GithubIcon className="w-5 h-5" />
                Continue with GitHub
              </Button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              {/* Magic Link Form */}
              <form onSubmit={handleMagicLinkLogin} className="space-y-4">
                <Field>
                  <FieldLabel htmlFor="email">Email address</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className="h-12"
                    required
                  />
                </Field>
                <Button
                  type="submit"
                  disabled={isLoading}
                  variant="outline"
                  className="w-full h-12 gap-3 text-base"
                  size="lg"
                >
                  <Mail className="w-5 h-5" />
                  {isLoading ? "Sending..." : "Continue with Email"}
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
