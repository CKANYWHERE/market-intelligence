import type { DigestItem } from '@/lib/batch/generate-weekly-digest';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://market-intelligence-87mm.vercel.app';

const CATEGORY_LABEL: Record<string, string> = {
  monetary_policy: 'Fed',
  inflation:       'Inflation',
  employment:      'Jobs',
  growth:          'Growth',
  earnings:        'Earnings',
  ipo:             'IPO',
};

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00Z').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC',
  });
}

export function buildWeeklyDigestEmail(items: DigestItem[], weekRange: string): string {
  const rows = items.map((item) => `
    <tr>
      <td style="padding:16px 24px;border-bottom:1px solid #1f2937">
        <div style="display:flex;align-items:flex-start;gap:12px">
          <div style="min-width:24px;height:24px;border-radius:4px;background:#1f2937;border:1px solid #374151;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:900;color:#d1d5db">
            ${item.rank}
          </div>
          <div>
            <div style="margin-bottom:4px">
              <span style="color:#f9fafb;font-size:14px;font-weight:600">${item.title}</span>
              <span style="margin-left:8px;padding:2px 8px;border-radius:4px;background:#1f2937;border:1px solid #374151;font-size:10px;color:#9ca3af;font-weight:500">
                ${CATEGORY_LABEL[item.category] ?? item.category}
              </span>
            </div>
            <div style="color:#6b7280;font-size:12px;margin-bottom:8px">${formatDate(item.date)}</div>
            <div style="color:#d1d5db;font-size:13px;line-height:1.6;margin-bottom:8px">${item.why_it_matters}</div>
            <div style="display:flex;gap:6px;align-items:flex-start">
              <span style="color:#eab308;font-size:10px;font-weight:700;flex-shrink:0;margin-top:2px">WATCH</span>
              <span style="color:#9ca3af;font-size:12px;line-height:1.6">${item.watch_for}</span>
            </div>
          </div>
        </div>
      </td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#030712;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#030712;padding:32px 16px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">

        <!-- Header -->
        <tr>
          <td style="padding:0 0 24px 0">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <a href="${SITE_URL}" style="text-decoration:none">
                    <span style="font-size:18px;font-weight:700;color:#f9fafb">📊 US Market Calendar</span>
                  </a>
                  <div style="color:#6b7280;font-size:12px;margin-top:4px">Weekly Market Focus · ${weekRange}</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Card -->
        <tr>
          <td style="background:#111827;border-radius:12px;border:1px solid #1f2937;overflow:hidden">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:16px 24px;border-bottom:1px solid #1f2937;background:#1f2937">
                  <span style="color:#f9fafb;font-size:14px;font-weight:700">This Week's Market Focus</span>
                  <span style="margin-left:8px;color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:0.05em">AI Curated</span>
                </td>
              </tr>
              ${rows}
            </table>
          </td>
        </tr>

        <!-- CTA -->
        <tr>
          <td style="padding:24px 0 8px 0;text-align:center">
            <a href="${SITE_URL}" style="display:inline-block;padding:12px 28px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600">
              Open Full Calendar →
            </a>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:16px 0;text-align:center;color:#4b5563;font-size:11px">
            <a href="${SITE_URL}/api/unsubscribe?token={{TOKEN}}" style="color:#4b5563">Unsubscribe</a>
            &nbsp;·&nbsp; US Market Calendar
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
