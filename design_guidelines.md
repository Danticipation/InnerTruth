# Design Guidelines: AI Personality Analyzer

## Design Approach

**Reference-Based Strategy**: Drawing inspiration from wellness and productivity leaders - Calm's empathetic design, Notion's information clarity, Apple Health's data visualization, and therapy app trust-building aesthetics. This creates a safe, professional environment for deep self-reflection.

**Core Design Principle**: Balance clinical professionalism with warm accessibility. Users are sharing intimate personal details, so the design must feel trustworthy, calming, and non-judgmental while maintaining analytical credibility.

## Typography System

**Primary Font**: Inter or DM Sans via Google Fonts
- Hero/Display: 3xl to 5xl, font-semibold
- Section Headers: 2xl to 3xl, font-semibold
- Card Titles: xl to 2xl, font-medium
- Body Text: base to lg, font-normal
- UI Labels: sm to base, font-medium
- Data/Metrics: lg to 3xl, font-bold (for personality scores)
- Journal Prompts: lg, font-normal, italic

**Secondary Font**: Crimson Pro or Lora (serif) for journal entries and reflective content only

## Layout System

**Spacing Primitives**: Use Tailwind units of 2, 4, 6, 8, 12, 16, and 20
- Micro-spacing: p-2, gap-2
- Component padding: p-4, p-6
- Section spacing: py-12, py-16, py-20
- Container margins: px-4, px-6, px-8

**Grid System**: 
- Dashboard: 12-column responsive grid
- Cards: 3-column on desktop (lg:grid-cols-3), 2-column tablet (md:grid-cols-2), single column mobile
- Max width containers: max-w-7xl for full sections, max-w-4xl for content-focused areas

## Component Library

### Landing Page Components

**Hero Section** (80vh):
- Large headline with gradient text effect
- Subheading explaining the transformative journey
- Primary CTA: "Start Your Journey" + Secondary: "See How It Works"
- Blurred background with hero image showing serene self-reflection imagery
- Social proof indicator: "Join 50,000+ people discovering themselves"

**Features Section** (3-column grid):
- AI Chat Analysis card with message bubble icon
- Personality Questionnaire card with clipboard icon
- Journal Insights card with book icon
- Each card: icon, title, 2-3 sentence description, subtle border

**How It Works Timeline** (vertical on mobile, horizontal on desktop):
- 4-step process with connecting lines
- Step cards with number badges, icons, titles, descriptions
- Visual progression showing user journey

**Personality Insights Preview**:
- Sample personality trait visualization (radar chart or bar chart)
- Quote: "The truth will set you free" - emphasis on honest self-discovery
- Example insight cards showing "Blind Spots" and "Growth Opportunities"

**Testimonials** (2-column grid):
- User photo placeholders, names, transformation stories
- Star ratings and specific outcomes
- Authentic, emotional testimonials about self-discovery

**CTA Section**:
- Dark background section
- Compelling headline about starting the journey
- Email signup OR direct "Get Started" button
- Privacy reassurance text

**Footer**:
- Newsletter signup with benefit text
- Links: About, Privacy, Terms, Contact
- Social media icons
- Copyright and trust badges

### Application Dashboard Components

**Top Navigation Bar**:
- Logo/brand on left
- Navigation: Dashboard, Chat, Journal, Insights, Profile
- User avatar with dropdown menu on right
- Progress indicator showing completion percentage

**Dashboard Cards**:
- Personality Score Overview (large card, top of dashboard)
- Recent Insights card with bullet points
- Current Streak tracker (gamification element)
- Quick Action cards: "Start Chat", "Write Journal Entry", "Take Assessment"

**Personality Profile Visualization**:
- Circular or radar chart showing 5-8 key traits
- Color-coded trait categories (no specific colors defined, just structure)
- Interactive hover states revealing detailed descriptions
- Comparison view: "You vs. Average" toggle

**Insight Cards**:
- Icon representing insight category
- Insight title (bold, attention-grabbing)
- Supporting explanation (2-3 sentences)
- Action button: "Explore This" or "Learn More"
- Timestamp showing when insight was discovered

**Chat Interface**:
- Clean messaging layout with clear user/AI message distinction
- AI messages include thoughtful follow-up prompts
- Suggested conversation starters as clickable bubbles
- "Save this conversation" button
- Typing indicator with calming animation

**Journal Interface**:
- Distraction-free writing area with generous padding
- Floating toolbar: Format text, Add emotion tags, Save draft
- Prompt suggestions sidebar
- Previous entries list with date and preview text
- Search and filter functionality

**Questionnaire Interface**:
- Progress bar at top showing completion
- One question per screen approach (mobile-friendly)
- Slider inputs for scale questions
- Radio buttons for multiple choice
- Large "Continue" button
- Ability to skip questions with note

**Trend Visualization**:
- Line charts showing personality trait evolution over time
- Month/Quarter/Year view toggles
- Milestone markers for significant insights
- Comparative overlays for multiple traits

### Form Elements

**Input Fields**:
- Generous padding (p-4)
- Clear focus states with border transitions
- Label positioning: floating labels for cleaner look
- Helper text below fields
- Error states with inline validation messages

**Buttons**:
- Primary: Large, rounded, bold text (px-8, py-3)
- Secondary: Outlined version with hover states
- Tertiary: Text-only with underline on hover
- Icon buttons: Circular with subtle shadows

**Cards**:
- Soft shadows for depth (shadow-sm to shadow-md)
- Rounded corners (rounded-lg to rounded-xl)
- Padding: p-6 to p-8
- Hover state: subtle lift effect (transform transition)

## Images

**Hero Section**: Full-width background image showing peaceful self-reflection - person journaling by window, meditation scene, or abstract peaceful imagery. Image should be softly blurred with overlay for text legibility.

**Feature Cards**: Icon-based, no images needed (use Heroicons or similar)

**Testimonial Section**: Profile photo placeholders (circular, 64x64px)

**Insights Preview**: Screenshot mockups of actual personality visualizations

**About/How It Works**: Illustration of the analysis process - abstract representation of data flowing into insights

## Accessibility & Interactions

- All interactive elements have minimum 44x44px touch targets
- Form inputs maintain consistent height and spacing
- Focus indicators visible on all interactive elements
- Skip navigation link for keyboard users
- Semantic HTML throughout (proper heading hierarchy)

## Animation Guidelines

**Minimal, Purposeful Motion**:
- Gentle fade-ins for insight cards appearing
- Smooth transitions for navigation (200ms ease)
- Progress indicators use subtle pulse animation
- NO parallax, NO scroll-jacking, NO distracting effects
- Loading states use simple spinner or skeleton screens

## Special Considerations

**Trust-Building Elements**:
- Privacy reassurance text throughout
- "Your data is encrypted" badges
- Clear opt-out options for data collection
- Transparent explanation of AI analysis process

**Emotional Design**:
- Generous whitespace to reduce cognitive load
- Calming interface that doesn't feel clinical
- Encouraging micro-copy throughout
- Celebration moments for milestones and breakthroughs

**Data Density Balance**:
- Complex personality data presented in digestible chunks
- Progressive disclosure: overview → details on demand
- Visual hierarchy guides eye to most important insights first