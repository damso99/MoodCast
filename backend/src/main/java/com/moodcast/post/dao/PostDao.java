package com.moodcast.post.dao;

import com.moodcast.post.vo.CommentSummary;
import com.moodcast.post.vo.Hashtag;
import com.moodcast.post.vo.PostDetail;
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

    PostDetail selectPostById(@Param("postId") Long postId, @Param("viewerId") Long viewerId);

    int updatePost(Post post);

    int deletePostHashtagsByPostId(@Param("postId") Long postId);

    int softDeletePost(@Param("postId") Long postId);

    List<PostSummary> selectRecentPosts(@Param("viewerId") Long viewerId);

    List<PostSummary> selectPostsByMember(@Param("memberId") Long memberId, @Param("viewerId") Long viewerId);

    List<CommentSummary> selectCommentsByPostId(@Param("postId") Long postId);

    int insertComment(CommentSummary comment);

    int selectPostLikeByPostAndMember(@Param("postId") Long postId, @Param("memberId") Long memberId);

    int insertPostLike(@Param("postId") Long postId, @Param("memberId") Long memberId);

    int deletePostLike(@Param("postId") Long postId, @Param("memberId") Long memberId);

    int selectSavedPostByPostAndMember(@Param("postId") Long postId, @Param("memberId") Long memberId);

    int insertSavedPost(@Param("postId") Long postId, @Param("memberId") Long memberId);

    int deleteSavedPost(@Param("postId") Long postId, @Param("memberId") Long memberId);

    List<PostSummary> selectSavedPostsByMember(@Param("memberId") Long memberId, @Param("viewerId") Long viewerId);
}
