import { kv } from '@vercel/kv';

const KEY = 'painel_dados';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const data = await kv.get(KEY);
      return res.status(200).json(data || { prospects: [], goal: 0 });
    }

    if (req.method === 'POST') {
      const { prospects, goal } = req.body || {};
      await kv.set(KEY, {
        prospects: Array.isArray(prospects) ? prospects : [],
        goal: typeof goal === 'number' ? goal : 0
      });
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: 'Método não permitido' });
  } catch (err) {
    console.error('Erro no /api/data:', err);
    return res.status(500).json({ error: 'Erro ao acessar o banco de dados', details: err.message });
  }
}
