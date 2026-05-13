import { MobileShell } from '../../layouts/MobileShell/MobileShell';
import { ComposerCard } from '../../widgets/ComposerCard/ComposerCard';
import { FeedCard } from '../../widgets/FeedCard/FeedCard';
import { feedPosts } from '../../app/data/moodcastData';
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
