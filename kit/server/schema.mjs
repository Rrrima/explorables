// JSON schema for one answer clip: a short two-column script whose shots are drawn
// from the answer kit (kit/answer.js). The props enum comes from the project, since
// each style draws its own illustrations.
const obj = (properties) => ({ type: "object", properties, required: Object.keys(properties), additionalProperties: false });
const str = { type: "string" }, num = { type: "number" };
const arr = (items) => ({ type: "array", items });

// domain-neutral templates; a style decides what each looks like
export const KINDS = ["title", "bignumber", "compare", "bars", "timeline", "count", "proportion", "beforeafter", "list", "versus", "quote"];

export function clipSchema(props) {
  return obj({
    title: str,                                  // 2–6 words, for the timeline marker
    summary: str,                                // the answer in one or two sentences
    shots: arr(obj({
      vo: str,                                   // what the narrator says
      visual: str,                               // the right-hand column: what we see and how it moves
      kind: { type: "string", enum: KINDS },
      prop: { type: "string", enum: ["none", ...props] },
      headline: str,
      value: str,
      caption: str,
      items: arr(obj({ label: str, value: num, note: str, cue: str, prop: { type: "string", enum: ["none", ...props] } })),
    })),
    sources: arr(obj({ n: { type: "integer" }, title: str, url: str })),
    followups: arr(str),
  });
}
