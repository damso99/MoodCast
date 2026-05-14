import { DesktopShell } from '../../components/layout/DesktopShell';
import { ComposerCard } from '../../components/common/ComposerCard';
import { FeedCard } from '../../components/common/FeedCard';
import { feedPosts } from '../../data/moodcastData';
import styles from './HomeFeedPage.module.css';

export function HomeFeedPage() {
  return (
    <DesktopShell splitLayout topContent={<ComposerCard />}>
      <section className={styles.column}>
        {feedPosts.map((post) => (
          <FeedCard key={post.id} post={post} />
        ))}
      </section>
    </DesktopShell>
  );
}
