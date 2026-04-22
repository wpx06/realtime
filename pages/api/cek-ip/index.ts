// pages/api/cek-ip/index.ts
import type { NextApiRequest, NextApiResponse } from "next";
import path from "path";
import maxmind, { Reader, CityResponse, AsnResponse } from "maxmind";

type Data = {
  ip: string;
  data: any;
  isp: any;
  // country: string | null;
  // country_code: string | null;
  // isp: string | null;
  // city: string | null;
  // region: string | null;
  // postal: string | null;
};

// update di server
let cityLookup: Reader<CityResponse> | null = null;
let asnLookup: Reader<AsnResponse> | null = null;

// Lazy load supaya nggak reopen DB tiap request
async function loadDbs() {
  if (!cityLookup) {
    const cityDbPath = path.join(process.cwd(), "data", "GeoLite2-City.mmdb");
    // update server
    //cityLookup = await maxmind.open<maxmind.CityResponse>(cityDbPath);
    cityLookup = await maxmind.open(cityDbPath) as Reader<CityResponse>;
  }
  if (!asnLookup) {
    const asnDbPath = path.join(process.cwd(), "data", "GeoLite2-ASN.mmdb");
    // update server
    //asnLookup = await maxmind.open<maxmind.AsnResponse>(asnDbPath);
    asnLookup = await maxmind.open(asnDbPath) as Reader<AsnResponse>;
  }
  return { cityLookup, asnLookup };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  try {
    const ip = req.body.ip;

    const { cityLookup, asnLookup } = await loadDbs();

    const geo = ip !== "unknown" ? cityLookup.get(ip) : null;
    const asn = ip !== "unknown" ? asnLookup.get(ip) : null;

    // res.status(200).json({
    //   ip,
    //   country_code: geo?.country?.iso_code || null,
    //   country: geo?.country?.names?.en || null,
    //   isp: asn?.autonomous_system_organization || null,
    //   city: geo?.city?.names?.en || null,
    //   region: geo?.subdivisions?.[0]?.names?.en || null,
    //   postal: geo?.postal?.code || null,
    // });

    res.status(200).json({
      ip,
      data: geo,
      isp: asn
    });
  } catch (err) {
    console.error("GeoIP error:", err);
    // res.status(500).json({ 
    //   ip: "unknown", 
    //   country_code: null, 
    //   country: null,
    //   isp: null,
    //   city: null,
    //   region: null,
    //   postal: null,
    // });
    res.status(500).json({ 
      ip: "unknown",
      data : null,
      isp: null,
    });
  }
}