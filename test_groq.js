const apiKey = process.env.GROQ_API_KEY

if (!apiKey) {
  throw new Error('Set the GROQ_API_KEY environment variable before running this test.')
}

const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'openai/gpt-oss-120b',
    messages: [
      { role: 'system', content: 'You are an AI assistant.' },
      { role: 'user', content: 'Bonjour, reponds en francais court.' }
    ],
    max_tokens: 100
  })
});

console.log('STATUS:', res.status);
const text = await res.text();
console.log('RESPONSE:', text);
