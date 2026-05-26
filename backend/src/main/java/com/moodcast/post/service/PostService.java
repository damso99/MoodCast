package com.moodcast.post.service;

import com.moodcast.member.dto.login.LoginMemberResponse;
import com.moodcast.member.service.AuthService;
import com.moodcast.post.dao.PostDao;
import com.moodcast.post.dto.CreatePostRequest;
import com.moodcast.post.vo.Hashtag;
import com.moodcast.post.vo.PostDetail;
import com.moodcast.post.vo.Post;
import com.moodcast.post.vo.PostSummary;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class PostService {

    @Autowired
    private PostDao postDao;

    @Autowired
    private AuthService authService;

    @Transactional
    public Long createPost(String authorizationHeader, CreatePostRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("게시물 정보를 입력해주세요.");
        }

        LoginMemberResponse loginMember = authService.getLoginMember(authorizationHeader);
        Long memberId = loginMember.getMemberId();

        String title = request.getTitle() != null ? request.getTitle().trim() : null;
        String content = request.getContent() != null ? request.getContent().trim() : null;

        if ((title == null || title.isEmpty()) && (content == null || content.isEmpty())) {
            throw new IllegalArgumentException("제목 또는 본문을 입력해주세요.");
        }

        Post post = new Post();
        post.setMemberId(memberId);
        post.setTitle(title);
        post.setContent(content);
        post.setVisibility("PUBLIC");
        post.setEmotionId(request.getEmotionId()); // 감정 설정

        int inserted = postDao.insertPost(post);
        if (inserted != 1 || post.getPostId() == null) {
            throw new IllegalStateException("게시물 저장에 실패했습니다.");
        }

        Long postId = post.getPostId();
        List<String> hashtags = parseHashtags(request.getTags());
        for (String hashtagText : hashtags) {
            Long hashtagId = postDao.findHashtagIdByText(hashtagText);
            if (hashtagId == null) {
                Hashtag hashtag = new Hashtag();
                hashtag.setHashtag(hashtagText);
                int hashtagInserted = postDao.insertHashtag(hashtag);
                if (hashtagInserted != 1 || hashtag.getHashtagId() == null) {
                    throw new IllegalStateException("해시태그 저장에 실패했습니다.");
                }
                hashtagId = hashtag.getHashtagId();
            }
            postDao.insertPostHashtag(postId, hashtagId);
        }

        return postId;
    }

    private List<String> parseHashtags(String tags) {
        if (tags == null || tags.trim().isEmpty()) {
            return List.of();
        }

        // #으로 시작하는 해시태그를 추출 (예: #hello #world #test)
        return Arrays.stream(tags.split("\\s+"))
                .map(String::trim)
                .filter(tag -> tag.startsWith("#"))  // #으로 시작하는 태그만
                .map(tag -> tag.replaceAll("^#+", ""))  // # 기호 제거
                .map(String::toLowerCase)
                .filter(tag -> !tag.isEmpty() && tag.length() <= 50)  // 빈 태그, 50자 초과 제거
                .distinct()
                .collect(Collectors.toList());
    }

    public List<PostSummary> getRecentPosts() {
        return postDao.selectRecentPosts();
    }

    public List<PostSummary> getPostsByMember(Long memberId) {
        if (memberId == null) {
            throw new IllegalArgumentException("회원 ID가 필요합니다.");
        }
        return postDao.selectPostsByMember(memberId);
    }

    public PostDetail getPostById(Long postId) {
        if (postId == null) {
            throw new IllegalArgumentException("게시물 ID가 필요합니다.");
        }

        PostDetail post = postDao.selectPostById(postId);
        if (post == null) {
            throw new IllegalArgumentException("게시물을 찾을 수 없습니다.");
        }

        return post;
    }

    @Transactional
    public PostDetail updatePost(String authorizationHeader, Long postId, CreatePostRequest request) {
        if (postId == null) {
            throw new IllegalArgumentException("게시물 ID가 필요합니다.");
        }
        if (request == null) {
            throw new IllegalArgumentException("게시물 정보를 입력해주세요.");
        }

        LoginMemberResponse loginMember = authService.getLoginMember(authorizationHeader);
        PostDetail currentPost = getPostById(postId);
        if (!currentPost.getMemberId().equals(loginMember.getMemberId())) {
            throw new IllegalArgumentException("본인이 작성한 게시물만 수정할 수 있습니다.");
        }

        String title = request.getTitle() != null ? request.getTitle().trim() : null;
        String content = request.getContent() != null ? request.getContent().trim() : null;

        if ((title == null || title.isEmpty()) && (content == null || content.isEmpty())) {
            throw new IllegalArgumentException("제목 또는 본문을 입력해주세요.");
        }

        Post post = new Post();
        post.setPostId(postId);
        post.setTitle(title);
        post.setContent(content);
        post.setEmotionId(request.getEmotionId());

        int updated = postDao.updatePost(post);
        if (updated != 1) {
            throw new IllegalStateException("게시물 수정에 실패했습니다.");
        }

        postDao.deletePostHashtagsByPostId(postId);
        List<String> hashtags = parseHashtags(request.getTags());
        for (String hashtagText : hashtags) {
            Long hashtagId = postDao.findHashtagIdByText(hashtagText);
            if (hashtagId == null) {
                Hashtag hashtag = new Hashtag();
                hashtag.setHashtag(hashtagText);
                int hashtagInserted = postDao.insertHashtag(hashtag);
                if (hashtagInserted != 1 || hashtag.getHashtagId() == null) {
                    throw new IllegalStateException("해시태그 저장에 실패했습니다.");
                }
                hashtagId = hashtag.getHashtagId();
            }
            postDao.insertPostHashtag(postId, hashtagId);
        }

        return getPostById(postId);
    }

    @Transactional
    public void deletePost(String authorizationHeader, Long postId) {
        if (postId == null) {
            throw new IllegalArgumentException("게시물 ID가 필요합니다.");
        }

        LoginMemberResponse loginMember = authService.getLoginMember(authorizationHeader);
        PostDetail currentPost = getPostById(postId);
        if (!currentPost.getMemberId().equals(loginMember.getMemberId())) {
            throw new IllegalArgumentException("본인이 작성한 게시물만 삭제할 수 있습니다.");
        }

        postDao.softDeletePost(postId);
    }
}
