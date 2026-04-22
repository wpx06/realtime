import { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import db from "@/lib/db";
import dayjs from "@/lib/dayjs";
import { getCurrentWibWindowForDB } from "@/lib/time";


export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const { leads, earn } = req.query;

  if (!leads || !earn) {
    return res.status(400).json({ error: "Missing parameter!" });
  }

  try {
    const decodedClick = Buffer.from(leads as string, "base64").toString("utf-8");
    const parts = decodedClick.split(",");
    
    // update cek jam untuk menambahkan earning per user summary!
    const nowJS = new Date();
    const shifted = dayjs(nowJS).subtract(5, "hour"); // Geser -5 jam
    const startOfDay = shifted.startOf("day").add(5, "hour").toDate();
    const endOfDay = dayjs(startOfDay)
      .add(1, "day")
      .subtract(1, "millisecond")
      .toDate();

    // const { startStr, endStr, debug } = getCurrentWibWindowForDB();

    // console.log("[WIB window]", debug.startWIB, "→", debug.endWIB);
    // console.log("[DB range ]", debug.startDB, "→", debug.endDB);

    if (parts.length < 5) {
      return res
        .status(400)
        .json({ error: "Invalid lead id format. Expected 5 parts separated by ," });
    }

    const [sub, country, ip, useragent, network] = parts;
    const earningValue = Number(earn);

    if (isNaN(earningValue)) {
      return res.status(400).json({ error: "Invalid earning value" });
    }

    console.log("Checking user:", sub);

    // Check if user exists in MySQL
    const [rows] = await db.execute(
      "SELECT id FROM users WHERE username = ? LIMIT 1",
      [sub]
    );

    if (!rows || (Array.isArray(rows) && rows.length === 0)) {
      console.log("User not found:", sub);
      return res.status(404).json({ error: `User ${sub} not found` });
    }

    const leadData = {
      userId: sub,
      network: network,
      earning: earningValue,
      country: country || null,
      useragent: useragent || null,
      ip: ip || null,
      created_at: new Date(),
    };

    console.log("Adding lead data for user (MySQL):", sub);
    const [result] = await db.execute(
      `INSERT INTO leads (userId, network, earning, country, useragent, ip, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
      leadData.userId,
      leadData.network,
      leadData.earning,
      leadData.country,
      leadData.useragent,
      leadData.ip,
      leadData.created_at,
      ]
    );
    if (!result || (result as any).affectedRows !== 1) {
      return res.status(500).json({ error: "Failed to save lead data" });
    }

    //update earning di summary
    const [summaryRows] = (await db.execute(
      `SELECT id, total_click, total_earning FROM user_summary WHERE user = ? AND created_at >= ? AND updated_at <= ? LIMIT 1`,
      [sub, startOfDay, endOfDay]
    )) as [
      Array<{ id: number; total_click: number; total_earning: number }>,
      any
    ];

    // Update summary baru
    if (Array.isArray(summaryRows) && summaryRows.length > 0) {

      // kalau sudah ada, update klik +1 dan earning hari ini
      const [leadRows] = await db.execute(
        `SELECT 
            COALESCE(SUM(earning), 0) AS totalEarning,
            COUNT(*) AS totalLeads
        FROM leads 
        WHERE userId = ? AND created_at BETWEEN ? AND ?`,
        [sub, startOfDay, endOfDay]
      ) as [Array<{ totalEarning: number; totalLeads: number }>, any];
      const { totalEarning, totalLeads } = 
      Array.isArray(leadRows) && leadRows.length > 0 ? leadRows[0] : { totalEarning: 0, totalLeads: 0 };

      // update summary
      const current = summaryRows[0];
      await db.execute(
        `UPDATE user_summary 
        SET total_click = ?, total_earning = ?, total_lead = ? 
        WHERE id = ?`,
        [
          (current.total_click || 0) + 1,
          totalEarning,
          totalLeads,
          current.id,
        ]
      );
    }

    // Trigger realtime update
    await axios.post(`${process.env.NEXT_PUBLIC_SOCKET_URL}/broadcast`, {
      event: "user-lead",
      payload: {
        message: `User: ${sub} Lead received..!`,
        data: { ...leadData },
      },
    });

    // update socketweb dewe
    // const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL, {
    //   path: "/api/socket"
    // });
    // socket.emit('user-lead', {
    //   user: sub,
    //   detail: { ...leadData },
    // });
    // setTimeout(() => {
    //   socket.disconnect();
    // }, 1500);

    return res.status(200).json({ message: "Lead received successfully" });
  } catch (error: any) {
    console.error("Error in API:", error);
    return res.status(400).json({
      error: "Invalid base64 in leads parameter",
      errorDetails: error.message,
    });
  }
}