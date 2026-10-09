// Rows shown on /my-party: parties the user hosts, is confirmed in, or is
// waiting on, plus rows they left (marked). Rejected requests are left out.
const shownStatuses = new Set(["confirmed", "pending", "cancelled"]);

function groupByDate(items) {
  const groups = [];

  for (const item of items) {
    const last = groups.at(-1);

    if (last && last.date === item.eventDate) {
      last.items.push(item);
    } else {
      groups.push({ date: item.eventDate, items: [item] });
    }
  }

  return groups;
}

// Upcoming (not ended yet) soonest first; past (ended) most recent first.
// Both are grouped by event date for the agenda.
export function groupMyParties(memberships, now = Date.now()) {
  const shown = memberships.filter((item) => shownStatuses.has(item.status));
  const upcoming = shown
    .filter((item) => item.endMs > now)
    .sort((a, b) => a.startMs - b.startMs);
  const past = shown
    .filter((item) => item.endMs <= now)
    .sort((a, b) => b.startMs - a.startMs);

  return { upcoming: groupByDate(upcoming), past: groupByDate(past) };
}

// The badge next to a row, or null for an active member of an open party.
// tone picks the theme colour: danger, highlight (waiting) or muted.
export function myPartyBadge(item) {
  if (item.partyStatus === "cancelled") {
    return { label: "ตี้ถูกยกเลิก", tone: "danger" };
  }

  if (item.status === "cancelled") {
    return { label: "ออกจากตี้แล้ว", tone: "muted" };
  }

  if (item.status === "pending") {
    return { label: "รออนุมัติ", tone: "highlight" };
  }

  return null;
}
