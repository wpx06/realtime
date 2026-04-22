import { NextApiRequest, NextApiResponse } from 'next';
import db from "@/lib/db";
import { getSummaryWIB } from '@/lib/time';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {

    const { start, end } = req.query;

    if(typeof start !== 'string' || typeof end !== 'string') {
        return res.status(404).json({ error: 'Missing parameter date!' });
    }

    try {
        //const data = await fetchSummary(start, end);
        //if (!data) return res.status(404).json({ error: 'Data not found' });
        const { startDate, endDate, debug } = getSummaryWIB(start, end);

        console.log("DEBUG:", { start, end, ...debug });

        // Ambil summary untuk periode tertentu berdasarkan created_at, dikelompokkan per user
        const [summaryRows] = await db.execute(
            `SELECT 
                MAX(us.id) AS id,  -- Ambil salah satu ID untuk setiap user
                us.user,
                SUM(us.total_click) AS total_clicks,  -- Hitung total click dari user_summary
                COALESCE(lead_data.total_leads, 0) AS total_leads,  -- Hitung total leads dari subquery
                COALESCE(lead_data.total_earning, 0) AS total_earning  -- Hitung total earning dari subquery
            FROM user_summary us
            LEFT JOIN (
                SELECT 
                    ls.userId,
                    COUNT(DISTINCT ls.id) AS total_leads,  -- Hitung jumlah leads unik per user
                    SUM(ls.earning) AS total_earning  -- Hitung total earning per user
                FROM leads ls
                WHERE ls.created_at >= ? AND ls.created_at < ?
                GROUP BY ls.userId
            ) AS lead_data ON us.user = lead_data.userId  -- Menggabungkan data berdasarkan user
            WHERE us.created_at >= ? AND us.created_at < ?
            GROUP BY us.user  -- Kelompokkan berdasarkan user, bukan id untuk menghindari duplikasi
            ORDER BY total_earning DESC;  -- Urutkan berdasarkan total_earning
            `,
            [
                debug.startDB,
                debug.endDB,
                debug.startDB,
                debug.endDB
            ]
        );

        const summary = (summaryRows as any[]).map((row) => ({
            id: row.id,
            user: row.user,
            total_click: row.total_clicks,
            total_lead: row.total_leads,
            total_earning: row.total_earning,
        }));

        return res.status(200).json({ summary });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error' });
    }
  
}