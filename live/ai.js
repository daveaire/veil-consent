export async function runAuthorizedTask({ document, purpose }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is not configured');
  if (purpose.task !== 'summarize') throw new Error('Only the allowlisted summarize operation can run');
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      model: purpose.model,
      store: false,
      max_output_tokens: 500,
      instructions: 'Summarize the supplied document faithfully in at most five concise bullet points. Do not infer facts not present in the document.',
      input: document,
    }),
    signal: AbortSignal.timeout(90_000),
  });
  const value = await response.json();
  if (!response.ok) throw new Error(`AI provider rejected the authorized job (${response.status})`);
  const output = value.output_text || value.output?.flatMap((item) => item.content || []).find((item) => item.type === 'output_text')?.text;
  if (!output) throw new Error('AI provider returned no text result');
  return { output, provider: 'openai', model: purpose.model, responseId: value.id };
}

