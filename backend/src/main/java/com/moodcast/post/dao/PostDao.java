package com.moodcast.post.dao;

import com.moodcast.post.vo.Hashtag;
import com.moodcast.post.vo.Post;
import com.moodcast.post.vo.PostSummary;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface PostDao {
    int insertPost(Post post);

    Long findHashtagIdByText(@Param("hashtag") String hashtag);

    int insertHashtag(Hashtag hashtag);

    int insertPostHashtag(@Param("postId") Long postId, @Param("hashtagId") Long hashtagId);

    List<PostSummary> selectRecentPosts();

    List<PostSummary> selectPostsByMember(@Param("memberId") Long memberId);
}
