import { NextApiRequest, NextApiResponse } from 'next';
import dayjs, { WIB_TZ } from "@/lib/dayjs";
import { getCurrentWibWindowForDB } from '@/lib/time';
import db from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  
  const now = dayjs().tz(WIB_TZ);
  const todayDate = now.format("YYYY-MM-DD");
  const currentHour = now.format("HH");
  const { startStr, endStr } = getCurrentWibWindowForDB();

  try {
    // const data = await fetchDashboardData();
    // if (!data) return res.status(404).json({ error: 'Data not found' });

    const [leadRows] = await db.execute(
      `SELECT id, userId, country, network, useragent, ip, earning, created_at
      FROM leads
      WHERE created_at >= ? AND created_at < ?
      ORDER BY created_at DESC`,
      [
        startStr, endStr
      ]
    );

    const leads: {
      id: string;
      userId: string;
      country: any;
      network: string;
      useragent: any;
      ip: any;
      earning: any;
      created_at: any;
    }[] = [];

    const earningPerUser: Record<string, number> = {};
    const topLeadMap: Record<string, number> = {};
    const countryCount: Record<string, number> = {};

    (leadRows as any[]).forEach((row) => {
      const createdAt = dayjs(row.created_at).tz("Asia/Jakarta");
      leads.push({
        id: row.id,
        userId: row.userId,
        country: row.country,
        network: row.network,
        useragent: row.useragent,
        ip: row.ip,
        earning: row.earning || 0,
        created_at: createdAt.toDate(),
      });

      const userId = row.userId;
      const earning = Number(row.earning) || 0;
      const country = row.country;

      earningPerUser[userId] = (earningPerUser[userId] || 0) + earning;
      topLeadMap[userId] = (topLeadMap[userId] || 0) + earning;

      if (country) {
        countryCount[country] = (countryCount[country] || 0) + 1;
      }
    });

    const topUsers = Object.entries(earningPerUser)
      .map(([username, total]) => ({ username, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 3);

    const topLeads = Object.entries(topLeadMap)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    const topCountry = Object.entries(countryCount)
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count);

    // === Ambil 45 klik terakhir dari MySQL ===
    const [clickRows] = await db.execute(
      `SELECT id, user, network, country, source, gadget, ip, created_at
      FROM clicks
      ORDER BY created_at DESC
      LIMIT 45`
    );
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

    // === Ambil 15 live clicks terakhir dari MySQL ===
    const [liveClickRows] = await db.execute(
      `SELECT id, user, network, country, source, gadget, ip, created_at
      FROM live_clicks
      ORDER BY created_at DESC
      LIMIT 15`
    );
    const liveClicks = (liveClickRows as any[]).map((row) => ({
      id: row.id,
      user: row.user,
      network: row.network,
      country: row.country,
      source: row.source,
      gadget: row.gadget,
      ip: row.ip,
      created_at: dayjs(row.created_at).tz("Asia/Jakarta").toDate(),
    }));

    return res.status(200).json({
      topUsers,
      topLeads,
      leads,
      clicks,
      liveClicks,
      countryData: countryCount,
      topCountry,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
  
}