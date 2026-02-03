# Atlas UX - Design System Guide

## 🎨 Color Palette

### Primary Colors
```css
--cyan-400: #22d3ee      /* Primary accent, buttons, highlights */
--cyan-500: #06b6d4      /* Hover states, active elements */
--blue-400: #60a5fa      /* Secondary accent, gradients */
--blue-500: #3b82f6      /* Links, secondary actions */
--blue-950: #172554      /* Background gradient component */
```

### Background Colors
```css
--slate-950: #020617     /* Primary background */
--slate-900: #0f172a     /* Secondary background, cards */
--slate-800: #1e293b     /* Tertiary background, inputs */
--slate-700: #334155     /* Borders, dividers */
```

### Text Colors
```css
--white: #ffffff         /* Primary text */
--slate-300: #cbd5e1     /* Secondary text */
--slate-400: #94a3b8     /* Tertiary text, placeholders */
--slate-500: #64748b     /* Disabled text */
```

### Status Colors
```css
--green-400: #4ade80     /* Success, online, positive */
--yellow-400: #facc15    /* Warning, pending */
--red-400: #f87171       /* Error, offline, negative */
--purple-400: #c084fc    /* Special, premium */
--orange-400: #fb923c    /* Alert, attention */
--pink-400: #f472b6      /* Creative, design */
```

---

## 📦 Component Patterns

### Cards
```jsx
<Card className="bg-slate-800/50 border-cyan-500/20 hover:border-cyan-500/40 transition-colors">
  {/* Card content */}
</Card>
```

**Variants:**
- Default: `bg-slate-800/50 border-cyan-500/20`
- Hover: `hover:border-cyan-500/40`
- Active/Selected: `bg-slate-800/70 border-cyan-500/50`
- Disabled: `bg-slate-800/30 border-slate-700/20 opacity-50`

### Buttons

**Primary (Cyan)**
```jsx
<Button className="bg-cyan-500 hover:bg-cyan-400 text-white">
  Primary Action
</Button>
```

**Secondary (Outline)**
```jsx
<Button variant="outline" className="border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/10">
  Secondary Action
</Button>
```

**Ghost**
```jsx
<Button variant="ghost" className="text-slate-400 hover:text-cyan-300 hover:bg-slate-800/50">
  Ghost Action
</Button>
```

**Destructive**
```jsx
<Button variant="destructive" className="bg-red-500/20 text-red-400 hover:bg-red-500/30">
  Delete
</Button>
```

### Badges

**Status Badges**
```jsx
{/* Active/Success */}
<Badge className="bg-green-500/20 text-green-400 border-green-500/30">Active</Badge>

{/* Warning/Pending */}
<Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Pending</Badge>

{/* Error/Inactive */}
<Badge className="bg-red-500/20 text-red-400 border-red-500/30">Inactive</Badge>

{/* Info/Default */}
<Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">Info</Badge>
```

### Input Fields
```jsx
<Input 
  className="bg-slate-900 border-cyan-500/20 text-white placeholder:text-slate-500 focus:border-cyan-400"
  placeholder="Enter value..."
/>
```

### Progress Bars
```jsx
<Progress 
  value={65} 
  className="bg-slate-700"
  indicatorClassName="bg-gradient-to-r from-cyan-500 to-blue-500"
/>
```

### Switches
```jsx
<Switch 
  checked={enabled}
  onCheckedChange={setEnabled}
  className="data-[state=checked]:bg-cyan-500"
/>
```

---

## 🎭 Animation Patterns

### Transitions
```css
/* Standard transition */
transition-all duration-300 ease-in-out

/* Quick transition */
transition-all duration-150 ease-out

/* Slow transition */
transition-all duration-500 ease-in-out

/* Color only */
transition-colors duration-300

/* Transform only */
transition-transform duration-300
```

### Hover Effects

**Cards**
```css
hover:border-cyan-500/40 hover:shadow-lg hover:shadow-cyan-500/10 transition-all
```

**Buttons**
```css
hover:bg-cyan-400 hover:scale-105 transition-all duration-200
```

**Icons**
```css
hover:text-cyan-300 hover:rotate-12 transition-all
```

### Loading States
```css
/* Pulse animation */
animate-pulse

/* Spin animation */
animate-spin

/* Custom glow */
animate-pulse shadow-lg shadow-cyan-500/50
```

---

## 📐 Spacing System

### Padding/Margin Scale
```css
p-1: 0.25rem (4px)
p-2: 0.5rem (8px)
p-3: 0.75rem (12px)
p-4: 1rem (16px)
p-6: 1.5rem (24px)
p-8: 2rem (32px)
p-12: 3rem (48px)
```

### Gap Scale (Flexbox/Grid)
```css
gap-1: 0.25rem
gap-2: 0.5rem
gap-3: 0.75rem
gap-4: 1rem
gap-6: 1.5rem
gap-8: 2rem
```

### Common Patterns
```css
/* Card padding */
p-6

/* Section spacing */
space-y-6

/* Button padding */
px-4 py-2

/* Icon spacing */
gap-2
```

---

## 🔤 Typography

### Headers
```jsx
{/* Page Title */}
<h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
  Page Title
</h2>

{/* Section Title */}
<h3 className="text-xl font-semibold text-white">
  Section Title
</h3>

{/* Card Title */}
<h4 className="text-base font-semibold text-white">
  Card Title
</h4>
```

### Body Text
```jsx
{/* Primary */}
<p className="text-sm text-white">Primary text</p>

{/* Secondary */}
<p className="text-sm text-slate-300">Secondary text</p>

{/* Tertiary */}
<p className="text-xs text-slate-400">Tertiary text</p>

{/* Disabled */}
<p className="text-xs text-slate-500">Disabled text</p>
```

### Special Text
```jsx
{/* Code/Monospace */}
<code className="font-mono text-xs text-cyan-400 bg-slate-900 px-2 py-1 rounded">
  code snippet
</code>

{/* Link */}
<a className="text-cyan-400 hover:text-cyan-300 underline">Link</a>

{/* Label */}
<label className="text-sm font-medium text-white">Label</label>
```

---

## 🎯 Icon Usage

### Icon Colors by Context
```jsx
{/* Success/Active */}
<CheckCircle className="w-5 h-5 text-green-400" />

{/* Warning */}
<AlertTriangle className="w-5 h-5 text-yellow-400" />

{/* Error */}
<XCircle className="w-5 h-5 text-red-400" />

{/* Info/Default */}
<Info className="w-5 h-5 text-cyan-400" />

{/* Disabled */}
<Icon className="w-5 h-5 text-slate-500" />
```

### Icon Sizes
```css
w-4 h-4  /* Small (16px) - inline with text */
w-5 h-5  /* Medium (20px) - buttons, cards */
w-6 h-6  /* Large (24px) - headers */
w-8 h-8  /* XL (32px) - features */
w-12 h-12 /* 2XL (48px) - hero sections */
```

### Icon with Background
```jsx
<div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center">
  <Icon className="w-6 h-6 text-cyan-400" />
</div>
```

---

## 📱 Responsive Patterns

### Breakpoints
```css
sm: 640px   /* Mobile landscape */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
2xl: 1536px /* Extra large */
```

### Common Responsive Patterns
```jsx
{/* Grid */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Items */}
</div>

{/* Flex */}
<div className="flex flex-col md:flex-row gap-4">
  {/* Items */}
</div>

{/* Hidden on mobile */}
<div className="hidden md:block">
  {/* Content */}
</div>

{/* Show only on mobile */}
<div className="block md:hidden">
  {/* Content */}
</div>
```

---

## ✨ Special Effects

### Glassmorphism
```css
bg-slate-900/50 backdrop-blur-xl border border-cyan-500/20
```

### Gradient Backgrounds
```css
/* Blue gradient */
bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900

/* Card gradient */
bg-gradient-to-br from-cyan-500/20 to-blue-500/20

/* Text gradient */
bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent
```

### Shadows
```css
/* Subtle */
shadow-lg shadow-cyan-500/10

/* Medium */
shadow-lg shadow-cyan-500/20

/* Strong */
shadow-2xl shadow-cyan-500/30

/* Glow effect */
shadow-lg shadow-cyan-500/50
```

### Borders
```css
/* Subtle */
border border-cyan-500/20

/* Medium */
border border-cyan-500/40

/* Strong */
border border-cyan-500/60

/* Active/Selected */
border-2 border-cyan-400
```

---

## 🔄 State Patterns

### Loading State
```jsx
<div className="animate-pulse">
  <div className="h-4 bg-slate-700 rounded w-3/4 mb-2"></div>
  <div className="h-4 bg-slate-700 rounded w-1/2"></div>
</div>
```

### Empty State
```jsx
<div className="text-center py-12">
  <Icon className="w-16 h-16 text-slate-600 mx-auto mb-4" />
  <h3 className="text-lg font-semibold text-slate-300 mb-2">No items found</h3>
  <p className="text-sm text-slate-400 mb-4">Get started by creating your first item</p>
  <Button>Create Item</Button>
</div>
```

### Error State
```jsx
<div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
  <div className="flex gap-3">
    <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
    <div>
      <h4 className="font-semibold text-red-400 mb-1">Error occurred</h4>
      <p className="text-sm text-red-200/80">Error message details</p>
    </div>
  </div>
</div>
```

### Success State
```jsx
<div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
  <div className="flex gap-3">
    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
    <div>
      <h4 className="font-semibold text-green-400 mb-1">Success!</h4>
      <p className="text-sm text-green-200/80">Operation completed successfully</p>
    </div>
  </div>
</div>
```

---

## 🎪 Modal Patterns

### Standard Modal
```jsx
<motion.div
  initial={{ opacity: 0, scale: 0.9, y: 20 }}
  animate={{ opacity: 1, scale: 1, y: 0 }}
  exit={{ opacity: 0, scale: 0.9, y: 20 }}
  className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50"
>
  {/* Modal content */}
</motion.div>
```

### Modal Backdrop
```jsx
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
/>
```

---

## 📋 Form Patterns

### Form Group
```jsx
<div className="space-y-4">
  <div>
    <label className="text-sm font-medium text-white mb-2 block">
      Field Label
    </label>
    <Input placeholder="Enter value..." />
  </div>
</div>
```

### Form Row
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <div>
    <label>Field 1</label>
    <Input />
  </div>
  <div>
    <label>Field 2</label>
    <Input />
  </div>
</div>
```

---

## 🎬 Motion Patterns (Framer Motion / Motion)

### Fade In
```jsx
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.3 }}
>
  {/* Content */}
</motion.div>
```

### Slide Up
```jsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  {/* Content */}
</motion.div>
```

### Stagger Children
```jsx
<motion.div
  initial="hidden"
  animate="visible"
  variants={{
    visible: { transition: { staggerChildren: 0.1 } }
  }}
>
  {items.map(item => (
    <motion.div
      key={item.id}
      variants={{
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 }
      }}
    >
      {/* Item */}
    </motion.div>
  ))}
</motion.div>
```

---

## ✅ Consistency Checklist

### Before Shipping Each Component
- [ ] Uses consistent card styling (bg-slate-800/50, border-cyan-500/20)
- [ ] Uses consistent button variants
- [ ] Uses consistent text colors (white, slate-300, slate-400)
- [ ] Uses consistent spacing (p-6, gap-6, space-y-6)
- [ ] Has proper hover states on interactive elements
- [ ] Has proper focus states on form elements
- [ ] Uses consistent icon sizes and colors
- [ ] Has loading/empty/error states where applicable
- [ ] Uses consistent animations (300ms transitions)
- [ ] Follows responsive patterns (grid, flex, hidden)
- [ ] Has proper accessibility (labels, aria attributes)
- [ ] Uses proper status colors (green=success, yellow=warning, red=error)

---

## 🎨 Design Tokens Summary

```javascript
export const designTokens = {
  colors: {
    primary: '#22d3ee',      // cyan-400
    secondary: '#60a5fa',    // blue-400
    background: '#020617',   // slate-950
    surface: '#0f172a',      // slate-900
    border: 'rgba(34, 211, 238, 0.2)',  // cyan-500/20
  },
  spacing: {
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
  },
  borderRadius: {
    sm: '0.5rem',    // 8px
    md: '0.75rem',   // 12px
    lg: '1rem',      // 16px
    xl: '1.5rem',    // 24px
  },
  transitions: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
  }
}
```

---

**Status:** 🎨 **DESIGN SYSTEM COMPLETE**

This design system ensures consistent visual language across all components of Atlas UX.
