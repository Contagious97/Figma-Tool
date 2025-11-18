# shadcn/ui Component Usage Guide

This project uses [shadcn/ui](https://ui.shadcn.com/) for all UI components. This guide ensures consistency across all frontend development.

## Core Principle

**ALWAYS use shadcn/ui components for ALL UI elements.** Do not create custom components or use plain HTML elements when a shadcn component exists.

## Available Components

The following shadcn/ui components are already installed and ready to use:

- `Button` - All clickable actions
- `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent` - Content containers
- `Input` - Text inputs
- `Label` - Form labels
- `Alert`, `AlertDescription` - Notifications and warnings
- `Checkbox` - Checkbox inputs
- `Dropdown Menu` - Dropdown menus and select components

## Component Import Pattern

Always import from `@/components/ui/`:

```typescript
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
```

## Common Usage Examples

### Buttons

```typescript
// Primary action
<Button>Click me</Button>

// Secondary action
<Button variant="outline">Cancel</Button>

// Destructive action
<Button variant="destructive">Delete</Button>

// Ghost button
<Button variant="ghost">Close</Button>

// With icon
<Button>
  <Plus className="mr-2 h-4 w-4" />
  Add Item
</Button>

// Different sizes
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>

// As Link
<Button asChild>
  <Link href="/dashboard">Dashboard</Link>
</Button>
```

### Cards

```typescript
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description text</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Card content */}
  </CardContent>
</Card>
```

### Forms

```typescript
<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input
    id="email"
    type="email"
    placeholder="you@example.com"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
  />
</div>
```

### Alerts

```typescript
// Info alert
<Alert>
  <AlertDescription>This is an informational message</AlertDescription>
</Alert>

// Error alert
<Alert variant="destructive">
  <AlertCircle className="h-4 w-4" />
  <AlertDescription>Error message here</AlertDescription>
</Alert>
```

### Checkboxes

```typescript
<div className="flex items-center space-x-2">
  <Checkbox
    id="terms"
    checked={accepted}
    onCheckedChange={setAccepted}
  />
  <label htmlFor="terms">Accept terms and conditions</label>
</div>
```

## Adding New shadcn Components

When you need a component that's not yet installed:

1. Check if it exists at [https://ui.shadcn.com/docs/components](https://ui.shadcn.com/docs/components)
2. Install it using the CLI (if available) or copy the component code manually
3. Update this guide with the new component

### Manual Installation (if CLI doesn't work)

1. Navigate to [https://ui.shadcn.com/docs/components/[component-name]](https://ui.shadcn.com/docs/components)
2. Click "View Code" or "Copy Code"
3. Create a new file in `/components/ui/[component-name].tsx`
4. Paste the component code
5. Install any required dependencies

## Custom Animations

Custom animations are defined in `tailwind.config.ts`. Available animations:

- `animate-fade-in` - Fade in with slight upward movement
- `animate-fade-in-up` - Fade in from bottom
- `animate-fade-in-down` - Fade in from top
- `animate-slide-in-left` - Slide in from left
- `animate-slide-in-right` - Slide in from right
- `animate-scale-in` - Scale in from smaller size
- `animate-float` - Floating animation (continuous)
- `animate-pulse-glow` - Pulsing glow effect (continuous)

Usage:

```typescript
<div className="animate-fade-in">Content appears smoothly</div>
<div className="animate-float">Floating element</div>
```

## Styling Guidelines

### Use Tailwind CSS Variables

shadcn uses CSS variables for theming. Always use these for colors:

- `bg-background` / `text-foreground` - Main background and text
- `bg-primary` / `text-primary-foreground` - Primary actions
- `bg-secondary` / `text-secondary-foreground` - Secondary elements
- `bg-muted` / `text-muted-foreground` - Muted/disabled elements
- `bg-accent` / `text-accent-foreground` - Accent elements
- `bg-card` / `text-card-foreground` - Card backgrounds
- `border` - Border color

### Responsive Design

Always design mobile-first, then add responsive classes:

```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  {/* Content */}
</div>
```

### Spacing

Use consistent spacing with Tailwind's spacing scale:

- `space-y-2` / `space-y-4` / `space-y-6` / `space-y-8` for vertical spacing
- `gap-2` / `gap-4` / `gap-6` / `gap-8` for grid/flex gaps
- `p-4` / `p-6` / `p-8` for padding
- `mb-4` / `mt-6` / `mx-auto` for margins

## OAuth/Authentication Components

For OAuth sign-in buttons, use the Button component with custom icons:

```typescript
<Button onClick={handleGoogleSignIn} className="w-full" size="lg">
  <Chrome className="mr-2 h-5 w-5" />
  Continue with Google
</Button>
```

## Dark Mode Support

All shadcn components support dark mode out of the box. The theme is controlled by the `darkMode: ["class"]` configuration in `tailwind.config.ts`.

To toggle dark mode, add/remove the `dark` class to the root element:

```typescript
document.documentElement.classList.toggle('dark')
```

## Best Practices

1. **Never use plain HTML buttons** - Always use `<Button>`
2. **Never use plain divs for cards** - Always use `<Card>`
3. **Never use plain inputs** - Always use `<Input>` or `<Checkbox>`
4. **Use semantic HTML** - Even with components, maintain proper HTML structure
5. **Maintain consistency** - If one page uses shadcn, all pages should
6. **Test responsiveness** - Always check mobile, tablet, and desktop views
7. **Use TypeScript** - Define props interfaces for custom components

## Component Variants

Most components support variants for different use cases:

```typescript
// Button variants
variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"

// Button sizes
size?: "default" | "sm" | "lg" | "icon"

// Alert variants
variant?: "default" | "destructive"
```

## Icons

This project uses `lucide-react` for icons, which integrates perfectly with shadcn:

```typescript
import { User, Settings, LogOut, Plus, AlertCircle } from 'lucide-react'

<Button>
  <Plus className="mr-2 h-4 w-4" />
  Add Item
</Button>
```

Common icon sizes:
- Small icons: `h-4 w-4`
- Medium icons: `h-5 w-5`
- Large icons: `h-6 w-6`
- Extra large: `h-8 w-8` or `h-12 w-12`

## Future Development

When building new features:

1. Check [shadcn/ui components](https://ui.shadcn.com/docs/components) first
2. Install the component if not already available
3. Use the component consistently with this guide
4. Update this guide if you add new components

## Resources

- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Lucide Icons](https://lucide.dev/)
- [Radix UI Primitives](https://www.radix-ui.com/) (underlying component library)

---

**Remember: Consistency is key. Always use shadcn/ui components for a professional, cohesive user interface.**
