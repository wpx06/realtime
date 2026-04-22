import { NextApiRequest, NextApiResponse } from 'next';
import dayjs, { WIB_TZ } from "@/lib/dayjs";
import db from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {

  const now = dayjs().tz(WIB_TZ);
  const todayDate = now.format("YYYY-MM-DD");
  const currentHour = now.format("HH");

  try {
    // const data = await fetchLiveClicks();
    // if (!data) return res.status(404).json({ error: 'Data not found' });

    // Ambil data klik yang terjadi dalam 1 menit terakhir
    const [rows] = await db.execute(
      `SELECT id, user, network, country, source, gadget, ip, created_at
       FROM live_clicks
       WHERE created_at >= NOW() - INTERVAL 1 MINUTE
       ORDER BY created_at DESC`
    );

    const liveClicks = (rows as any[]).map((row) => ({
      id: row.id,
      user: row.user,
      network: row.network,
      country: row.country,
      source: row.source,
      gadget: row.gadget,
      ip: row.ip,
      created_at: row.created_at,
    }));

    const [clickRows] = await db.execute(
      `SELECT id, user, network, country, source, gadget, ip, created_at
      FROM clicks
      ORDER BY created_at DESC
      LIMIT 45`
    );

    // === Ambil 45 klik terakhir === //
    const clicks = (clickRows as any[]).map((row) => ({
      id: row.id,
      user: row.user,
      network: row.network,
      country: row.country,
      source: row.source,
      gadget: row.gadget,
      ip: row.ip,
      created_at: dayjs(row.created_at),
    }));
    const clicksPerUserHour: Record<string, number> = {};
    clicks.forEach((click) => {
      const clickTime = dayjs(click.created_at).tz("Asia/Jakarta");
      const clickDate = clickTime.format("YYYY-MM-DD");
      const clickHour = clickTime.format("HH");

      if (clickDate === todayDate && clickHour === currentHour) {
        clicksPerUserHour[click.user] = (clicksPerUserHour[click.user] || 0) + 1;
      }
    });

    return res.status(200).json({ liveClicks, clicks });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
  
}