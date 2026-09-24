import { kv } from '@vercel/kv';

const KEY = 'painel_dados';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const role = req.query.role;
      const data = (await kv.get(KEY)) || { prospects: [], goal: 0 };
      if (role === 'estagiario') {
        return res.status(200).json({ prospects: data.prospects || [], goal: null });
      }
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      const { prospects, goal, role } = req.body || {};
      const current = (await kv.get(KEY)) || { prospects: [], goal: 0 };
      const nextGoal = role === 'estagiario'
        ? current.goal || 0
        : (typeof goal === 'number' ? goal : current.goal || 0);

      await kv.set(KEY, {
        prospects: Array.isArray(prospects) ? prospects : [],
        goal: nextGoal
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
