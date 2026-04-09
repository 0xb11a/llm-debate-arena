import { fallbackModelDef } from "./models";
import { DebateEntry, ModelDef } from "./types";

type Models = Map<string, ModelDef>;

function getModel(models: Models, key: string): ModelDef {
  return models.get(key) ?? fallbackModelDef(key);
}

export function buildDebaterSystemPrompt(
  modelKey: string,
  otherKeys: string[],
  topic: string,
  round: number,
  totalRounds: number,
  instruction: string,
  models: Models
): string {
  const model = getModel(models, modelKey);
  const otherNames = otherKeys.map((k) => getModel(models, k).displayName);
  const count = otherKeys.length + 1;

  return `You are ${model.displayName}, participating in a ${count}-way intellectual debate with ${otherNames.join(" and ")}.

The topic is: "${topic}"

Your debating personality: ${instruction}

RULES:
- Start from a NEUTRAL position. Form your OWN genuine perspective based on reasoning.
- You may agree, partially agree, or fully disagree with others — follow your reasoning.
- Don't be contrarian for show, but don't be agreeable to be polite. Pursue truth.
- Directly engage with specific points others made. Reference their arguments.
- If your position evolves across rounds, acknowledge it openly.
- This is round ${round} of ${totalRounds}. 2-3 focused paragraphs. No meta-commentary — argue substantively.`;
}

export function buildDebaterUserMessage(
  topic: string,
  round: number,
  isFirstSpeaker: boolean,
  entries: DebateEntry[],
  models: Models
): string {
  if (round === 1 && isFirstSpeaker) {
    return `The topic is: "${topic}"\nYou speak first. Present your initial position.`;
  }

  const transcript = formatTranscript(entries, models);
  return `Debate transcript so far:\n\n${transcript}\n\nYour turn — round ${round}.`;
}

export function buildJudgeSystemPrompt(judgeKey: string, judgeInstruction: string, models: Models): string {
  const judge = getModel(models, judgeKey);
  return `You are ${judge.displayName}. ${judgeInstruction}`;
}

export function buildJudgeUserMessage(
  topic: string,
  debaterKeys: string[],
  entries: DebateEntry[],
  models: Models
): string {
  const names = debaterKeys.map((k) => getModel(models, k).displayName);
  const transcript = formatTranscript(entries, models);

  const scoreBlocks = names
    .map(
      (name) =>
        `**${name}**\nClarity: X/10 | Depth: X/10 | Engagement: X/10 | Honesty: X/10 | Total: X/40`
    )
    .join("\n\n");

  return `Topic: "${topic}"
Participants: ${names.join(", ")}

Full transcript:

${transcript}

---

Score each participant (1-10):
• Position Clarity — Did they develop a clear, coherent stance?
• Argument Depth — Quality of reasoning, evidence, and insight
• Engagement — How well did they respond to and build on others' points?
• Intellectual Honesty — Did they acknowledge good opposing points? Evolve their thinking?

Format:

${scoreBlocks}

**Most Compelling Debater**: [Name]
**Best Single Argument**: [which argument from whom was most powerful]
**Analysis**: [4-5 sentences on debate dynamics — convergence, divergence, what's unresolved]`;
}

function formatTranscript(entries: DebateEntry[], models: Models): string {
  return entries
    .map((e) => {
      const model = getModel(models, e.modelKey);
      return `[${model.displayName} — Round ${e.round}]:\n${e.text}`;
    })
    .join("\n\n");
}
