---
name: Kinetic Noir
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#393939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1b1b1b'
  surface-container: '#1f1f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353535'
  on-surface: '#e2e2e2'
  on-surface-variant: '#e6bdb8'
  inverse-surface: '#e2e2e2'
  inverse-on-surface: '#303030'
  outline: '#ac8884'
  outline-variant: '#5c403c'
  surface-tint: '#ffb4ab'
  primary: '#ffb4ab'
  on-primary: '#690005'
  primary-container: '#dc2626'
  on-primary-container: '#fff6f5'
  inverse-primary: '#bf0715'
  secondary: '#c6c6c7'
  on-secondary: '#2f3131'
  secondary-container: '#454747'
  on-secondary-container: '#b4b5b5'
  tertiary: '#c0c7d3'
  on-tertiary: '#2a313b'
  tertiary-container: '#6b727d'
  on-tertiary-container: '#f5f7ff'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdad6'
  primary-fixed-dim: '#ffb4ab'
  on-primary-fixed: '#410002'
  on-primary-fixed-variant: '#93000b'
  secondary-fixed: '#e2e2e2'
  secondary-fixed-dim: '#c6c6c7'
  on-secondary-fixed: '#1a1c1c'
  on-secondary-fixed-variant: '#454747'
  tertiary-fixed: '#dce3f0'
  tertiary-fixed-dim: '#c0c7d3'
  on-tertiary-fixed: '#151c25'
  on-tertiary-fixed-variant: '#404752'
  background: '#131313'
  on-background: '#e2e2e2'
  surface-variant: '#353535'
typography:
  h1:
    fontFamily: Oswald
    fontSize: 72px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  h2:
    fontFamily: Oswald
    fontSize: 48px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  h3:
    fontFamily: Oswald
    fontSize: 32px
    fontWeight: '500'
    lineHeight: '1.2'
    letterSpacing: 0em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: 0em
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: 0em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 48px
  xl: 80px
  container-max: 1280px
  gutter: 24px
---

## Brand & Style

This design system is defined by a high-octane, "Kinetic Noir" aesthetic. It targets a tech-forward, performance-driven audience that values precision and impact. The brand personality is aggressive yet refined, evoking an emotional response of urgency, focus, and modern sophistication.

The visual style blends **High-Contrast / Bold** elements with a **Modern** dark aesthetic. It utilizes a deep black foundation to make vibrant crimson accents feel luminous. Interactions are not just functional but theatrical, relying on smooth motion, physics-based transitions, and a heavy emphasis on state changes to provide constant tactile feedback to the user.

## Colors

The color palette is built on a foundation of absolute blacks and dark grays to maximize the luminance of its primary accent. 

- **Primary (#DC2626):** A high-energy "Vibrant Red" used for calls to action, critical indicators, and interactive highlights. 
- **Neutral (#000000):** The primary background color, ensuring maximum contrast and a sleek, premium feel.
- **Secondary (#FFFFFF):** Reserved for high-priority typography and icons to ensure immediate legibility against the dark backdrop.
- **Surface (#1F2937):** Used for UI containment, cards, and input fields to create depth without breaking the dark theme.
- **Muted (#9CA3AF):** A low-priority gray for secondary text, borders, and inactive states.

## Typography

The typography strategy focuses on a stark contrast between structural, condensed headlines and highly readable, utilitarian body text.

- **Headlines:** Uses **Oswald**. This condensed sans-serif provides a powerful, journalistic authority. H1 and H2 levels should almost always be uppercase to lean into the bold brand voice.
- **Body & Labels:** Uses **Inter**. Chosen for its exceptional legibility on digital screens. It provides a technical, clean counter-balance to the expressive headlines.
- **Rhythm:** Generous line-heights are maintained for body copy to ensure readability against the high-contrast black background, while headlines are kept tight to maintain visual tension.

## Layout & Spacing

This design system utilizes a **Fixed Grid** model for desktop and a **Fluid Grid** for mobile devices. The layout is anchored by a 12-column grid with a maximum container width of 1280px.

Spacing follows a strict 8px base unit. 
- **Margins:** Use large `xl` spacing for section vertical buffers to create a cinematic, airy feel between content blocks.
- **Gutters:** Standardized at 24px to provide clear separation without breaking the visual flow of information.
- **Component Spacing:** Internal padding for cards and modals should scale between `sm` and `md` units to maintain a compact, high-density feel where appropriate.

## Elevation & Depth

In a pure black environment, traditional shadows are ineffective. Instead, this design system uses **Tonal Layers** and **Glows** to establish hierarchy.

1.  **Base Layer:** Pure Black (#000000).
2.  **Surface Layer:** Dark Grey (#1F2937). Used for cards and secondary navigation.
3.  **Accent Elevation:** Interactive elements (like active buttons or cards) should employ a soft, primary-colored glow (shadow with a #DC2626 tint) to simulate a light source emitting from the element.
4.  **Borders:** Subtle 1px borders using the Muted (#9CA3AF) color at low opacity (10-20%) define containers without creating visual clutter.

## Shapes

The shape language is predominantly sharp and technical. A **Soft** (4px / 0.25rem) corner radius is applied to standard UI elements like buttons and inputs to prevent the design from feeling dated or overly "brutalist." 

Large containers and cards may use `rounded-lg` (8px) for a slightly smoother aesthetic, but the overall goal is to maintain a crisp, engineered appearance that aligns with the condensed typography.

## Components

### Buttons
- **Primary:** Solid #DC2626 background with White text. On hover, trigger a scale-up (1.05x) and a primary color glow.
- **Ghost:** 1px White or #9CA3AF border. On hover, fill the background with White and invert the text color to Black.

### Cards
- **Construction:** Use the Surface color (#1F2937) with a subtle 1px border.
- **Interaction:** Hovering should lift the card using a vertical translation (-4px) and intensify the border color to #DC2626.

### Input Fields
- **Styling:** Minimalist, bottom-only border by default. On focus, the border transitions to #DC2626 with a micro-interaction where the label floats and shrinks.

### Micro-interactions & Animations
- **Transitions:** All state changes (hover, focus, active) must use a 300ms "cubic-bezier(0.4, 0, 0.2, 1)" timing function for a snappy, high-end feel.
- **Scroll Effects:** Implement reveal animations where elements slide upward and fade in as they enter the viewport.
- **Navigation:** Use a "magnetic" effect for icons or menu items, where the element slightly gravitates toward the cursor when in proximity.

### Progress & Status
- Use the Primary Red for all active progress states. Inactive tracks should be Pure Black with a 1px border to maintain the high-contrast aesthetic.