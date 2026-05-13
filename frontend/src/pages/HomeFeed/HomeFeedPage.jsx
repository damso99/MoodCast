import { DesktopShell } from '../../layouts/DesktopShell/DesktopShell';
import { ComposerCard } from '../../widgets/ComposerCard/ComposerCard';
import { FeedCard } from '../../widgets/FeedCard/FeedCard';
import { feedPosts } from '../../app/data/moodcastData';
import styles from './HomeFeedPage.module.css';

export function HomeFeedPage() {
  return (
    <DesktopShell>
      <section className={styles.column}>
        <ComposerCard />
        {feedPosts.map((post) => (
          <FeedCard key={post.id} post={post} />
        ))}
      </section>
    </DesktopShell>
  );
}
