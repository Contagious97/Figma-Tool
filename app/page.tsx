'use client'

import { ArrowRight, Sparkles, Zap, Lock, FileText, Code, Download, GitBranch } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { useEffect, useState } from "react"

export default function Home() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-background via-background to-muted/20">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-3xl animate-pulse-glow" />
          <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-primary/5 to-transparent rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '1s' }} />
        </div>

        <div className="container relative z-10 px-4 md:px-6">
          <div className="flex flex-col items-center text-center space-y-8 max-w-4xl mx-auto">
            {/* Badge */}
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-primary font-medium">Bridge Figma to AI Development</span>
            </div>

            {/* Main Heading */}
            <h1 className={`text-5xl md:text-7xl font-bold tracking-tight transition-all duration-1000 delay-100 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              Transform Figma Designs into{" "}
              <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                AI-Ready Context
              </span>
            </h1>

            {/* Subheading */}
            <p className={`text-xl md:text-2xl text-muted-foreground max-w-2xl transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              Extract, analyze, and export your Figma designs as machine-readable documentation for Claude, Copilot, and other AI coding assistants.
            </p>

            {/* CTA Buttons */}
            <div className={`flex flex-col sm:flex-row gap-4 pt-4 transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <Button asChild size="lg" className="text-base h-12 px-8 shadow-lg hover:shadow-xl transition-all">
                <Link href="/signin">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-base h-12 px-8">
                <Link href="#features">
                  Learn More
                </Link>
              </Button>
            </div>

            {/* Stats */}
            <div className={`flex flex-wrap justify-center gap-8 pt-8 text-sm transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
              <div className="flex flex-col items-center">
                <div className="text-3xl font-bold text-primary">100%</div>
                <div className="text-muted-foreground">Free & Open Source</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-3xl font-bold text-primary">AES-256</div>
                <div className="text-muted-foreground">Encrypted Tokens</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-3xl font-bold text-primary">LLM</div>
                <div className="text-muted-foreground">Optimized Output</div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-2">
            <div className="w-1 h-3 rounded-full bg-muted-foreground/30" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-muted/20">
        <div className="container px-4 md:px-6">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
              Supercharge Your AI Workflow
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to bridge the gap between design and development
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Import Designs</CardTitle>
                <CardDescription>
                  Connect your Figma files instantly with secure token authentication
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Auto-Analyze</CardTitle>
                <CardDescription>
                  Automatically extract frames, components, colors, and typography
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Code className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>LLM-Optimized</CardTitle>
                <CardDescription>
                  Export design context formatted specifically for AI coding tools
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Lock className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Secure & Private</CardTitle>
                <CardDescription>
                  Your tokens are encrypted with AES-256-GCM, never shared
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-background">
        <div className="container px-4 md:px-6">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
              Simple Three-Step Process
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From Figma to AI assistant in minutes
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-8">
            {/* Step 1 */}
            <Card className="overflow-hidden border-2">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row items-center">
                  <div className="bg-primary/10 p-12 md:p-16">
                    <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold">
                      1
                    </div>
                  </div>
                  <div className="p-8 flex-1">
                    <h3 className="text-2xl font-bold mb-3">Connect Your Figma</h3>
                    <p className="text-muted-foreground text-lg">
                      Sign in with Google and add your Figma Personal Access Token. We'll encrypt and securely store it for you.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Step 2 */}
            <Card className="overflow-hidden border-2">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row-reverse items-center">
                  <div className="bg-primary/10 p-12 md:p-16">
                    <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold">
                      2
                    </div>
                  </div>
                  <div className="p-8 flex-1">
                    <h3 className="text-2xl font-bold mb-3">Import & Analyze</h3>
                    <p className="text-muted-foreground text-lg">
                      Paste a Figma file URL and watch as we extract all frames, components, flows, and design system elements.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Step 3 */}
            <Card className="overflow-hidden border-2">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row items-center">
                  <div className="bg-primary/10 p-12 md:p-16">
                    <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold">
                      3
                    </div>
                  </div>
                  <div className="p-8 flex-1">
                    <h3 className="text-2xl font-bold mb-3">Export for AI</h3>
                    <p className="text-muted-foreground text-lg">
                      Download LLM-optimized documentation and paste it into Claude Code, Copilot, or any AI assistant for instant context.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 bg-muted/20">
        <div className="container px-4 md:px-6">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
              Why Figma Flow Mapper?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <GitBranch className="h-5 w-5 text-primary" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Visual Flow Mapping</h3>
                <p className="text-muted-foreground">
                  See how your screens connect with an interactive flow diagram that shows button interactions and navigation.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Download className="h-5 w-5 text-primary" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Multiple Export Formats</h3>
                <p className="text-muted-foreground">
                  Export as LLM-optimized context, CSV, or JSON. Perfect for documentation, reports, or AI prompts.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Smart Component Detection</h3>
                <p className="text-muted-foreground">
                  Automatically identify buttons, inputs, and other UI components with semantic analysis.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Device Classification</h3>
                <p className="text-muted-foreground">
                  Frames are automatically classified as mobile, tablet, or desktop based on dimensions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 bg-gradient-to-b from-background to-primary/5">
        <div className="container px-4 md:px-6">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              Ready to Transform Your Workflow?
            </h2>
            <p className="text-xl text-muted-foreground">
              Join developers who are using AI assistants with full design context
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button asChild size="lg" className="text-base h-12 px-8 shadow-lg hover:shadow-xl transition-all">
                <Link href="/signin">
                  Start Free Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-base h-12 px-8">
                <a href="https://github.com/Contagious97/Figma-Tool" target="_blank" rel="noopener noreferrer">
                  View on GitHub
                </a>
              </Button>
            </div>

            {/* Features badges */}
            <div className="flex flex-wrap justify-center gap-3 pt-8">
              <div className="px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm">
                ✓ No credit card required
              </div>
              <div className="px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm">
                ✓ Open source
              </div>
              <div className="px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm">
                ✓ Self-hostable
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 bg-background">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <div>
              Built with ❤️ for developers using AI coding assistants
            </div>
            <div className="flex gap-6">
              <a href="https://github.com/Contagious97/Figma-Tool" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                GitHub
              </a>
              <Link href="/dashboard" className="hover:text-primary transition-colors">
                Dashboard
              </Link>
              <Link href="/settings" className="hover:text-primary transition-colors">
                Settings
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
