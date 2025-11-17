import { FileText, Lock, Zap, Code } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-b from-background to-muted/20">
      <div className="max-w-5xl w-full space-y-12 text-center">
        {/* Hero Section */}
        <div className="space-y-6">
          <h1 className="text-6xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Figma Flow Mapper
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Design System Context Tool for LLMs! - Bridge between Figma designs and AI-assisted development
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-8">
          <div className="flex flex-col items-center space-y-2 p-6 rounded-lg border bg-card hover:shadow-md transition-shadow">
            <FileText className="h-10 w-10 text-primary" />
            <h3 className="font-semibold">Import Designs</h3>
            <p className="text-sm text-muted-foreground">Fetch Figma files instantly</p>
          </div>
          <div className="flex flex-col items-center space-y-2 p-6 rounded-lg border bg-card hover:shadow-md transition-shadow">
            <Zap className="h-10 w-10 text-primary" />
            <h3 className="font-semibold">Auto-Analyze</h3>
            <p className="text-sm text-muted-foreground">Extract frames & components</p>
          </div>
          <div className="flex flex-col items-center space-y-2 p-6 rounded-lg border bg-card hover:shadow-md transition-shadow">
            <Code className="h-10 w-10 text-primary" />
            <h3 className="font-semibold">LLM-Ready</h3>
            <p className="text-sm text-muted-foreground">Optimized for AI tools</p>
          </div>
          <div className="flex flex-col items-center space-y-2 p-6 rounded-lg border bg-card hover:shadow-md transition-shadow">
            <Lock className="h-10 w-10 text-primary" />
            <h3 className="font-semibold">Secure</h3>
            <p className="text-sm text-muted-foreground">AES-256 encrypted tokens</p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex gap-4 justify-center pt-8">
          <a
            href="/signin"
            className="inline-flex items-center justify-center rounded-md bg-primary px-8 py-3 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
          >
            Get Started
          </a>
          <a
            href="https://github.com/yourusername/figma-flow-mapper"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-8 py-3 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            View on GitHub
          </a>
        </div>
      </div>
    </div>
  );
}
