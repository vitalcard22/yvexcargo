export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 800,
        system: `You are a helpful customer support assistant for YvexCargo, an international logistics company.
Phone: +1 509 305 2716. Email: support@yvexcargo.com. Address: New York City, USA.
Services: Air Freight ($45/kg, 1-5 days), Sea Freight ($8/kg, 15-45 days), Road Delivery ($1.5/kg, 1-7 days), Express Courier ($35 flat, 24-48hrs), Warehousing ($150/mo).
Tracking statuses in order: Order Placed, In Process, In Transit, Customs Check, Out for Delivery, Delivered.
Be concise, warm and professional. Never make up tracking data.`,
        messages: req.body.messages,
      }),
    });
    const data = await response.json();
    const content = data?.content?.[0]?.text || 'Sorry, I could not get a response.';
    res.status(200).json({ content });
  } catch (error) {
    res.status(500).json({ content: 'Having trouble connecting. Please email support@yvexcargo.com' });
  }
}
