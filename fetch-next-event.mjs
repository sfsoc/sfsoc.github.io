import ical from 'node-ical';
import fs from 'fs';
const ICS_URL = 'https://calendar.google.com/calendar/ical/c_00fa591d915679c4458ee03f2fc09b9b9daeb4a8fc92d1c0d48121ae7cb80d9a%40group.calendar.google.com/public/basic.ics';

async function main() {
  const data = await ical.async.fromURL(ICS_URL);
  const now = new Date();
  const oneYearOut = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

  let next = null;

  for (const key in data) {
    const ev = data[key];
    if (ev.type !== 'VEVENT') continue;

    if (ev.rrule) {
      //recurring
      const occurrences = ev.rrule.between(now, oneYearOut, true);
      if (occurrences.length > 0) {
        const start = occurrences[0];
        if (!next || start < new Date(next.start)) {
          next = {
            summary: ev.summary || 'Untitled event',
            start: start.toISOString(),
            allDay: !!ev.datetype && ev.datetype === 'date',
            location: ev.location || null,
            description: ev.description || null
          };
        }
      }
    } else if (ev.start && ev.start > now) {
      if (!next || ev.start < new Date(next.start)) {
        next = {
          summary: ev.summary || 'Untitled event',
          start: ev.start.toISOString(),
          allDay: ev.datetype === 'date',
          location: ev.location || null,
          description: ev.description || null
        };
      }
    }
  }

  fs.writeFileSync('next-event.json', JSON.stringify(next, null, 2));
  console.log('Wrote next-event.json:', next);
}

main().catch(err => {
  console.error('Failed to fetch calendar:', err);
  process.exit(1);
});
