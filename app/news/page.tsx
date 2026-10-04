import NewsFeed, { NewsItem } from "@/components/NewsFeed";
import { getNews, getPlayers } from "@/lib/data";
import { timeAgo } from "@/lib/format";
import type { Row } from "@/lib/types";

export default function News() {
  const news = getNews();
  const rows = news.rows as Row[];
  const validIds = getPlayers().filter((p) => p.games >= 1).map((p) => p.gsis_id);
  const ids = new Set(rows.flatMap((n) => [n.gsis_id, ...(n.handcuffs ?? []).map((h: Row) => h.gsis_id)]));
  const linkable = validIds.filter((id) => ids.has(id));
  const recent = (n: Row) => (n.hours_ago ?? 99) <= 72;
  const mine = rows.filter((n) => n.tags?.includes("MY TEAM") && recent(n)).slice(0, 6);
  const cuffs = rows.filter((n) => n.tags?.includes("RB INJURY") && n.handcuffs?.length && recent(n) && !n.tags.includes("MY TEAM")).slice(0, 6);
  return (
    <>
      <div className="pagehead">
        <h1>News</h1>
        <p className="sub">
          RotoWire&apos;s latest NFL player news, ranked for you: stories about your roster first, then running-back
          injuries — each with the healthy backups on that team, who owns them, and their current usage — so you can
          grab the handcuff before your league does. Everything else follows by recency.
        </p>
        <p className="small muted">
          Feed checked every 10 minutes from the Mac mini · last update {timeAgo(news.run_ts)} · {rows.length} stories from the last 14 days ·
          source: <a className="link" href="https://www.rotowire.com/football/news.php" target="_blank" rel="noopener noreferrer">RotoWire</a>
        </p>
      </div>
      {!news.run_ts ? (
        <div className="banner">No news collected yet. It appears after the next pipeline run or news poll on the Mac mini.</div>
      ) : (
        <>
          <div className="grid g2">
            <div className="card">
              <div className="card-head"><h2>Your team</h2><span className="small muted">last 72 hours</span></div>
              {mine.length ? <div className="newslist">{mine.map((n) => <NewsItem key={n.guid} n={n} validIds={linkable} />)}</div>
                : <div className="empty">No news on your players in the last 72 hours.</div>}
            </div>
            <div className="card">
              <div className="card-head"><h2>RB injuries → handcuffs</h2><span className="small muted">last 72 hours</span></div>
              {cuffs.length ? <div className="newslist">{cuffs.map((n) => <NewsItem key={n.guid} n={n} validIds={linkable} />)}</div>
                : <div className="empty">No running-back injury news in the last 72 hours.</div>}
            </div>
          </div>
          <div className="card section">
            <div className="card-head"><h2>All stories</h2><span className="small muted">priority = your team +40 · RB injury +30 (+10 severe) · free handcuff +10 · recency up to +30</span></div>
            <NewsFeed rows={rows} validIds={linkable} />
          </div>
        </>
      )}
    </>
  );
}
