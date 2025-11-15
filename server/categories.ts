export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string;
  tier: 1 | 2 | 3;
  isPremium: boolean;
  sortOrder: number;
  scoringCriteria: string;
  journalPrompts: string[];
  chatFocusAreas: string[];
}

export const CATEGORIES: Category[] = [
  {
    id: "1",
    slug: "relationships-communication",
    name: "Relationships & Communication",
    description: "How effectively you connect with others, express yourself, and maintain healthy relationships",
    tier: 1,
    isPremium: false,
    sortOrder: 1,
    scoringCriteria: `Evaluate based on:
- Quality and depth of interpersonal connections mentioned
- Clarity and effectiveness of communication patterns
- Conflict resolution approaches
- Empathy and active listening behaviors
- Boundary setting and respect for others' boundaries
- Consistency in maintaining relationships
Score 0-100 where:
- 0-30: Significant struggles with communication, frequent conflicts, isolation
- 31-60: Some effective communication, occasional misunderstandings, working on relationships
- 61-85: Generally strong communication, healthy relationships, minor areas for growth
- 86-100: Excellent communication skills, deep meaningful connections, role model level`,
    journalPrompts: [
      "How did you connect with someone meaningful today?",
      "Describe a conversation that went particularly well or poorly - what made it that way?",
      "What patterns do you notice in how you communicate when stressed?"
    ],
    chatFocusAreas: [
      "Communication style and effectiveness",
      "Relationship quality and depth",
      "Conflict handling",
      "Listening and empathy"
    ]
  },
  {
    id: "2",
    slug: "emotional-regulation",
    name: "Emotional Regulation",
    description: "Your ability to understand, process, and manage emotions in healthy ways",
    tier: 1,
    isPremium: false,
    sortOrder: 2,
    scoringCriteria: `Evaluate based on:
- Awareness of emotional states and triggers
- Ability to process difficult emotions without suppression or explosion
- Recovery time from emotional setbacks
- Use of healthy coping mechanisms vs destructive patterns
- Emotional resilience and adaptability
- Self-soothing and grounding techniques
Score 0-100 where:
- 0-30: Overwhelmed by emotions, poor coping, frequent emotional reactivity
- 31-60: Growing awareness, some regulation skills, occasional overwhelm
- 61-85: Generally well-regulated, effective coping, minor lapses under stress
- 86-100: Exceptional emotional intelligence and regulation, healthy processing`,
    journalPrompts: [
      "What emotions came up for you today? How did you handle them?",
      "Describe a moment when you felt overwhelmed - what helped you cope?",
      "What patterns do you notice in your emotional responses?"
    ],
    chatFocusAreas: [
      "Emotional awareness and labeling",
      "Coping mechanisms and strategies",
      "Triggers and patterns",
      "Resilience and recovery"
    ]
  },
  {
    id: "3",
    slug: "confidence-self-worth",
    name: "Confidence & Self-Worth",
    description: "How you value yourself, trust your abilities, and show up authentically",
    tier: 1,
    isPremium: false,
    sortOrder: 3,
    scoringCriteria: `Evaluate based on:
- Self-talk patterns (critical vs supportive)
- Willingness to take appropriate risks and try new things
- Ability to accept compliments and acknowledge strengths
- Recovery from failures or criticism
- Comparison to others (frequency and impact)
- Self-advocacy and standing up for personal needs
Score 0-100 where:
- 0-30: Heavy self-criticism, severe imposter syndrome, constant comparison
- 31-60: Building confidence, occasional self-doubt, working on self-acceptance
- 61-85: Generally confident, healthy self-image, minor insecurities
- 86-100: Strong self-worth, authentic self-expression, resilient confidence`,
    journalPrompts: [
      "What did you do today that you're proud of?",
      "When did you doubt yourself today? What triggered it?",
      "How did you advocate for yourself or your needs?"
    ],
    chatFocusAreas: [
      "Self-talk and inner dialogue",
      "Risk-taking and trying new things",
      "Handling criticism and failure",
      "Self-advocacy"
    ]
  },
  {
    id: "4",
    slug: "career-leadership",
    name: "Career & Leadership",
    description: "Professional growth, influence, and your ability to lead yourself and others",
    tier: 2,
    isPremium: true,
    sortOrder: 4,
    scoringCriteria: `Evaluate based on:
- Career direction clarity and goal pursuit
- Initiative and proactive problem-solving
- Leadership behaviors (formal or informal)
- Influence and impact on others
- Professional skill development
- Work relationships and collaboration
Score 0-100 where:
- 0-30: Career stagnation, reactive approach, minimal impact
- 31-60: Some direction, developing skills, occasional leadership moments
- 61-85: Clear career path, growing influence, consistent professional development
- 86-100: Strong career momentum, natural leader, significant impact`,
    journalPrompts: [
      "What professional challenge did you tackle today?",
      "How did you influence or lead others (formally or informally)?",
      "What skills are you developing right now?"
    ],
    chatFocusAreas: [
      "Career goals and direction",
      "Leadership opportunities",
      "Professional development",
      "Workplace dynamics"
    ]
  },
  {
    id: "5",
    slug: "decision-making",
    name: "Decision-Making Patterns",
    description: "How you make choices, trust your judgment, and learn from outcomes",
    tier: 2,
    isPremium: true,
    sortOrder: 5,
    scoringCriteria: `Evaluate based on:
- Decision-making speed and confidence
- Analysis paralysis vs impulsivity
- Use of intuition vs data in decisions
- Learning from past decisions
- Commitment to decisions once made
- Ability to pivot when needed
Score 0-100 where:
- 0-30: Chronic indecision or impulsive choices, regret cycles
- 31-60: Improving decision process, some clarity, occasional doubt
- 61-85: Generally sound decisions, balanced approach, minor regrets
- 86-100: Excellent judgment, learns from all outcomes, decisive yet flexible`,
    journalPrompts: [
      "What decision did you make today? How did you arrive at it?",
      "Describe a choice you're struggling with - what makes it difficult?",
      "What did you learn from a recent decision (good or bad)?"
    ],
    chatFocusAreas: [
      "Decision-making process",
      "Confidence in choices",
      "Learning from outcomes",
      "Analysis vs intuition balance"
    ]
  },
  {
    id: "6",
    slug: "work-life-balance",
    name: "Work-Life Balance",
    description: "How well you integrate professional ambition with personal wellbeing and relationships",
    tier: 2,
    isPremium: true,
    sortOrder: 6,
    scoringCriteria: `Evaluate based on:
- Boundaries between work and personal time
- Energy levels and burnout prevention
- Time for relationships, hobbies, rest
- Saying no to unreasonable demands
- Guilt about rest or work (depending on which side)
- Sustainable pace and rhythm
Score 0-100 where:
- 0-30: Severe imbalance, burnout symptoms, neglected life areas
- 31-60: Aware of imbalance, making adjustments, some boundaries
- 61-85: Generally balanced, sustainable pace, occasional overwork
- 86-100: Excellent integration, healthy boundaries, sustainable success`,
    journalPrompts: [
      "How did you balance work and personal time today?",
      "When did you feel most energized vs drained?",
      "What boundaries did you set or need to set?"
    ],
    chatFocusAreas: [
      "Work-life boundaries",
      "Energy management",
      "Rest and recovery",
      "Sustainable pace"
    ]
  },
  {
    id: "7",
    slug: "conflict-resolution",
    name: "Conflict Resolution",
    description: "Your ability to navigate disagreements constructively and repair relationships",
    tier: 3,
    isPremium: true,
    sortOrder: 7,
    scoringCriteria: `Evaluate based on:
- Approach to disagreements (avoidance vs aggression vs assertive)
- Ability to see other perspectives during conflict
- Repair attempts and making amends
- Learning from conflicts to prevent future issues
- Emotional regulation during disagreements
- Win-win vs win-lose mindset
Score 0-100 where:
- 0-30: Avoids or escalates conflicts, poor repair, lingering resentment
- 31-60: Facing conflicts more, some resolution skills, working on it
- 61-85: Generally handles conflicts well, good repair, minor avoidance
- 86-100: Excellent conflict navigation, strong repair skills, growth mindset`,
    journalPrompts: [
      "Describe any tension or conflict you experienced today - how did you handle it?",
      "What could you have done differently in a recent disagreement?",
      "How do you typically respond when someone challenges you?"
    ],
    chatFocusAreas: [
      "Conflict approach and style",
      "Perspective-taking",
      "Repair and reconciliation",
      "Learning from disagreements"
    ]
  },
  {
    id: "8",
    slug: "authenticity-people-pleasing",
    name: "Authenticity & People-Pleasing",
    description: "Being true to yourself while navigating others' expectations and approval needs",
    tier: 3,
    isPremium: true,
    sortOrder: 8,
    scoringCriteria: `Evaluate based on:
- Expressing true opinions even when unpopular
- Saying no without excessive guilt
- Seeking approval vs internal validation
- Suppressing needs to keep peace
- Authenticity in different relationships
- Discomfort with disappointing others
Score 0-100 where:
- 0-30: Heavy people-pleasing, suppressed authentic self, approval addiction
- 31-60: Increasing authenticity, some boundary-setting, working on it
- 61-85: Generally authentic, occasional people-pleasing, good balance
- 86-100: Highly authentic, healthy boundaries, comfortable disappointing when needed`,
    journalPrompts: [
      "When did you compromise your authentic self today? Why?",
      "Describe a moment when you said yes but meant no",
      "How do you feel when someone is disappointed in you?"
    ],
    chatFocusAreas: [
      "Authentic expression",
      "People-pleasing patterns",
      "Boundary-setting",
      "Approval-seeking behaviors"
    ]
  }
];

export function getCategoryById(id: string): Category | undefined {
  return CATEGORIES.find(c => c.id === id);
}

export function getCategoryBySlug(slug: string): Category | undefined {
  return CATEGORIES.find(c => c.slug === slug);
}

export function getFreeTierCategories(): Category[] {
  return CATEGORIES.filter(c => !c.isPremium);
}

export function getAllCategories(): Category[] {
  return CATEGORIES.sort((a, b) => a.sortOrder - b.sortOrder);
}
