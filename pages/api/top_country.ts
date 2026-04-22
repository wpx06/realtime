import dayjs from '@/lib/dayjs';
import db from '@/lib/db';
import { getCurrentWibWindowForDB } from '@/lib/time';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {

  // const nowUTC = dayjs().add(5, "hour");
  // const startStr = nowUTC.startOf("day").toDate();
  // const endStr = nowUTC.endOf("day").toDate();
  const { startStr, endStr } = getCurrentWibWindowForDB();

  try {
    //const data = await fetchCountryData();
    //if (!data) return res.status(404).json({ error: 'Data not found' });

    // Fetch leads from MySQL
    const [leadsRows] = await db.execute(
      `SELECT id, userId, country, network, useragent, ip, earning, created_at
      FROM leads
      WHERE created_at >= ? AND created_at < ?`,
      [ startStr, endStr ]
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
    }[] = (leadsRows as any[]).map(row => ({
      ...row,
      created_at: dayjs(row.created_at).tz("Asia/Jakarta").toDate(),
    }));

    const countryCount: Record<string, number> = {};
    leads.forEach(lead => {
      const country = lead.country;
      if (country) {
        countryCount[country] = (countryCount[country] || 0) + 1;
      }
    });

    // == Fetch clicks langsung total hari ini ==//
    // soale wes auto hapus klik per hari cronjob wkwkkwwk...
    const [clickRows] = await db.execute(
      `SELECT id, user, network, country, source, gadget, ip, created_at
      FROM clicks WHERE created_at >= ? AND created_at < ?`,
      [ startStr, endStr ]
    );

    const Allclicks = (clickRows as any[]).map(row => ({
      ...row,
      created_at: dayjs(row.created_at).tz("Asia/Jakarta").toDate(),
    }));

    const clickCountryCount: Record<string, number> = {};
    let totalCountryClicksToday = 0;
    Allclicks.forEach(click => {
      const country = click.country;
      if (country) {
        clickCountryCount[country] = (clickCountryCount[country] || 0) + 1;
        totalCountryClicksToday++;
      }
    });

    // === Hitung CR per negara ===
    const data = Object.entries(countryCount).map(([countryName, totalLeads]) => {
      const countryClicks = clickCountryCount[countryName] || 0;
      const cr = countryClicks > 0 ? (totalLeads / countryClicks) : 0;
      return {
        countryName,
        totalLeads,
        totalClicks: countryClicks,
        cr: parseFloat((cr * 100).toFixed(2)), // persentase
      };
    }).sort((a, b) => b.totalLeads - a.totalLeads);

    return res.status(200).json({ data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
  
}