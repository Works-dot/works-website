// Globalping public diagnostic API. No credentials; only the public URL is sent.
// Usage: node scripts/measure-budapest.mjs [https://www.worksdot.hu/]
const target = new URL(process.argv[2] || "https://www.worksdot.hu/");
if (target.protocol !== "https:" || target.username || target.password) throw Error("Use a public HTTPS URL");
const response = await fetch("https://api.globalping.io/v1/measurements", {
  method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    type: "http", target: target.hostname, limit: 10,
    locations: [{ city: "Budapest", country: "HU" }],
    measurementOptions: { protocol: "HTTPS", request: { method: "GET", path: target.pathname + target.search } },
  }),
});
if (!response.ok) throw Error(`Measurement unavailable: ${response.status}`);
const { id } = await response.json();
let data;
for (let attempt = 0; attempt < 30; attempt++) {
  await new Promise(resolve => setTimeout(resolve, 2000));
  const result = await fetch(`https://api.globalping.io/v1/measurements/${id}`);
  if (!result.ok) throw Error(`Measurement result unavailable: ${result.status}`);
  data = await result.json();
  if (data.status === "finished") break;
}
if (data?.status !== "finished") throw Error(`Measurement timed out: ${id}`);
const samples = data.results.filter(({ probe, result }) => probe.city === "Budapest" &&
  probe.country === "HU" && result.statusCode === 200 && result.timings).map(({ probe, result }) => ({
  city: probe.city, network: probe.network,
  // Globalping's firstByte is a phase, not elapsed time since navigation.
  ttfbMs: ["dns", "tcp", "tls", "firstByte"].reduce((sum, key) => sum + (result.timings[key] || 0), 0),
  timings: result.timings, cacheControl: result.headers?.["cache-control"],
  cacheStatus: result.headers?.["cf-cache-status"] || result.headers?.["x-cache"] || "not reported",
}));
const sorted = samples.map(s => s.ttfbMs).sort((a, b) => a - b);
const median = sorted.length ? (sorted[Math.floor((sorted.length - 1) / 2)] + sorted[Math.floor(sorted.length / 2)]) / 2 : null;
console.log(JSON.stringify({
  measurementId: id, measuredAt: new Date().toISOString(), url: target.href,
  connection: "new HTTP/TLS connections; DNS resolver warmth is uncontrolled; not browser-cache hits",
  samples, medianMs: median, p95Ms: sorted[Math.ceil(sorted.length * .95) - 1],
  passed: samples.length >= 10 && median < 200,
}, null, 2));
if (samples.length < 10 || median >= 200) process.exitCode = 1;
