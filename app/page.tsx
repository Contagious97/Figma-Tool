export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="max-w-5xl w-full space-y-8 text-center">
        <h1 className="text-6xl font-bold tracking-tight">
          Figma Flow Mapper
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Design System Context Tool for LLMs - Bridge between Figma designs and AI-assisted development
        </p>
        <div className="flex gap-4 justify-center pt-8">
          <a
            href="/signin"
            className="inline-flex items-center justify-center rounded-md bg-primary px-8 py-3 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
          >
            Get Started
          </a>
          <a
            href="https://github.com/yourusername/figma-flow-mapper"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-8 py-3 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
          >
            View on GitHub
          </a>
        </div>
      </div>
    </div>
  );
}
