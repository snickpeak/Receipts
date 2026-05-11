import type { Tag } from "@/context/EntriesContext";

export interface DailyPrompt {
  text: string;
  tag: Tag;
}

export const DAILY_PROMPTS: DailyPrompt[] = [
  // ── Win (20) ────────────────────────────────────────────────────────────────
  { text: "What's a win you almost didn't notice until you looked back?", tag: "Win" },
  { text: "What did you do today that last year's version of you couldn't?", tag: "Win" },
  { text: "What obstacle quietly turned into an advantage this week?", tag: "Win" },
  { text: "What small action moved the needle more than you expected?", tag: "Win" },
  { text: "What compliment did you receive that you actually believed?", tag: "Win" },
  { text: "When did you show up even when you really didn't feel like it?", tag: "Win" },
  { text: "What did you finish that had been sitting on your list too long?", tag: "Win" },
  { text: "What did you handle better than you expected?", tag: "Win" },
  { text: "When did you trust yourself and turn out to be right?", tag: "Win" },
  { text: "What problem did you solve that no one else even knew you had?", tag: "Win" },
  { text: "What did you create, build, or put into the world this week?", tag: "Win" },
  { text: "What risk paid off recently?", tag: "Win" },
  { text: "What are you proud of that you haven't told anyone yet?", tag: "Win" },
  { text: "What breakthrough happened quietly, without fanfare?", tag: "Win" },
  { text: "What habit showed up for you this week without you forcing it?", tag: "Win" },
  { text: "When did you choose the harder right thing over the easier wrong one?", tag: "Win" },
  { text: "What goal is closer than you realized?", tag: "Win" },
  { text: "What would your best self say about how you showed up today?", tag: "Win" },
  { text: "Who deserves credit alongside your win today?", tag: "Win" },
  { text: "What are you getting better at that you rarely talk about?", tag: "Win" },

  // ── Memory (20) ─────────────────────────────────────────────────────────────
  { text: "What moment today deserves to be frozen in time?", tag: "Memory" },
  { text: "Who made you feel genuinely seen this week?", tag: "Memory" },
  { text: "What conversation shifted how you see something?", tag: "Memory" },
  { text: "What made you laugh until it actually hurt?", tag: "Memory" },
  { text: "Where were you when you felt most alive this week?", tag: "Memory" },
  { text: "What smell, sound, or sight stopped you in your tracks?", tag: "Memory" },
  { text: "Who do you wish you could have shared this moment with?", tag: "Memory" },
  { text: "What would you tell someone in 10 years about today?", tag: "Memory" },
  { text: "What small detail about today is too precious to forget?", tag: "Memory" },
  { text: "What surprised you most about yourself this week?", tag: "Memory" },
  { text: "What moment connected you to someone in an unexpected way?", tag: "Memory" },
  { text: "What did a stranger do that stayed with you?", tag: "Memory" },
  { text: "When did time seem to slow down this week?", tag: "Memory" },
  { text: "What experience this week would you put in a time capsule?", tag: "Memory" },
  { text: "What ordinary moment felt extraordinary today?", tag: "Memory" },
  { text: "What do you want your future self to remember about right now?", tag: "Memory" },
  { text: "Who told you something honest that you actually needed to hear?", tag: "Memory" },
  { text: "What moment would you relive if you could?", tag: "Memory" },
  { text: "What did you witness today that reminded you people can be good?", tag: "Memory" },
  { text: "What experience this week would make a great opening line of a story?", tag: "Memory" },

  // ── Money (20) ──────────────────────────────────────────────────────────────
  { text: "What money decision are you genuinely proud of this week?", tag: "Money" },
  { text: "Where did you spend money that was completely worth every penny?", tag: "Money" },
  { text: "What did you learn about money — or your relationship with it — recently?", tag: "Money" },
  { text: "Where did you show real financial discipline?", tag: "Money" },
  { text: "What investment — in yourself or otherwise — are you quietly making right now?", tag: "Money" },
  { text: "What financial goal is starting to feel real for the first time?", tag: "Money" },
  { text: "What did you earn that represents more than just the number?", tag: "Money" },
  { text: "Where did you find real value where others saw none?", tag: "Money" },
  { text: "What purchase did you almost make but didn't — and why?", tag: "Money" },
  { text: "What does your spending this week say about your priorities?", tag: "Money" },
  { text: "What financial decision do you want to remember making?", tag: "Money" },
  { text: "What income or gain — expected or not — is worth documenting?", tag: "Money" },
  { text: "What would your future self thank you for doing with money today?", tag: "Money" },
  { text: "What deal, discount, or smart move saved you more than just cash?", tag: "Money" },
  { text: "What financial milestone deserves to be stamped and dated?", tag: "Money" },
  { text: "How did money show up as a tool for your freedom this week?", tag: "Money" },
  { text: "What did you negotiate, save, or create that added real value?", tag: "Money" },
  { text: "Who taught you something valuable about money lately?", tag: "Money" },
  { text: "What resource did you use wisely that others take for granted?", tag: "Money" },
  { text: "What opportunity are you pricing correctly in your own life?", tag: "Money" },

  // ── Promise (20) ────────────────────────────────────────────────────────────
  { text: "What did you commit to this week that scared you a little?", tag: "Promise" },
  { text: "What promise to yourself have you actually kept recently?", tag: "Promise" },
  { text: "What intention are you carrying into the next chapter?", tag: "Promise" },
  { text: "Who are you showing up for and why does it genuinely matter?", tag: "Promise" },
  { text: "What boundary did you set and actually hold this week?", tag: "Promise" },
  { text: "What did you decide today that quietly changes your trajectory?", tag: "Promise" },
  { text: "What accountability are you willing to put in writing right now?", tag: "Promise" },
  { text: "What are you becoming through the commitments you're keeping?", tag: "Promise" },
  { text: "What promise would your future self be grateful you made today?", tag: "Promise" },
  { text: "What are you refusing to let slide any longer?", tag: "Promise" },
  { text: "Who counts on you, and how are you showing up for them?", tag: "Promise" },
  { text: "What did you recommit to after almost walking away?", tag: "Promise" },
  { text: "What does your word mean to you right now?", tag: "Promise" },
  { text: "What are you building through small daily promises?", tag: "Promise" },
  { text: "What are you saying yes to this week that costs you something?", tag: "Promise" },
  { text: "What are you saying no to so you can protect what matters most?", tag: "Promise" },
  { text: "What would you need to see from yourself to feel proud in a month?", tag: "Promise" },
  { text: "What vow did you make quietly that deserves to be documented?", tag: "Promise" },
  { text: "What agreement — with yourself or someone else — deserves to be honored?", tag: "Promise" },
  { text: "What are you on the hook for that actually matters?", tag: "Promise" },

  // ── Proof (20) ──────────────────────────────────────────────────────────────
  { text: "What evidence do you have right now that you're actually growing?", tag: "Proof" },
  { text: "What do you have today that you didn't have a year ago?", tag: "Proof" },
  { text: "What screenshot, message, or result should be preserved right now?", tag: "Proof" },
  { text: "What number — even a small one — shows your progress?", tag: "Proof" },
  { text: "What has changed about you that you can actually point to?", tag: "Proof" },
  { text: "What did someone say about your work that's worth keeping?", tag: "Proof" },
  { text: "What result came back better than you expected?", tag: "Proof" },
  { text: "What does your calendar, inbox, or account prove about your effort?", tag: "Proof" },
  { text: "What have you built that you can show, not just describe?", tag: "Proof" },
  { text: "What confirmation arrived today that you're on the right path?", tag: "Proof" },
  { text: "What milestone deserves to be stamped and dated today?", tag: "Proof" },
  { text: "What before-and-after is worth capturing right now?", tag: "Proof" },
  { text: "What would be hard to believe without the receipts?", tag: "Proof" },
  { text: "What recognition, approval, or response showed up this week?", tag: "Proof" },
  { text: "What did you deliver that exceeded your own expectations?", tag: "Proof" },
  { text: "What feedback proved your instincts right?", tag: "Proof" },
  { text: "What has staying consistent actually produced that's measurable?", tag: "Proof" },
  { text: "What output, creation, or result is worth archiving today?", tag: "Proof" },
  { text: "What would silence the voice that says you're not making progress?", tag: "Proof" },
  { text: "What proof do you have that your time is being spent on the right things?", tag: "Proof" },
];

export function getDailyBaseIndex(): number {
  const dateStr = new Date().toDateString();
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash * 31 + dateStr.charCodeAt(i)) >>> 0;
  }
  return hash % DAILY_PROMPTS.length;
}

export function getDailyPrompt(): DailyPrompt {
  return DAILY_PROMPTS[getDailyBaseIndex()];
}
