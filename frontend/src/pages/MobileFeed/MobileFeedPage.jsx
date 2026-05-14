import { MobileShell } from '../../components/layout/MobileShell';
import { ComposerCard } from '../../components/common/ComposerCard';
import { FeedCard } from '../../components/common/FeedCard';
import { feedPosts } from '../../data/moodcastData';
import styles from './MobileFeedPage.module.css';

export function MobileFeedPage() {
  return (
    <MobileShell title="MoodCast">
      <section className={styles.column}>
        <ComposerCard />
        {feedPosts.map((post) => (
          <FeedCard key={post.id} post={post} compact />
        ))}
      </section>
    </MobileShell>
  );
}
