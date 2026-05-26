package com.moodcast.post.controller;

import com.moodcast.post.dto.CreatePostRequest;
import com.moodcast.post.service.PostService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@CrossOrigin(
        origins = {"http://localhost:5173", "http://127.0.0.1:5173"},
        allowCredentials = "true"
)
@RequestMapping("posts")
public class PostController {

    @Autowired
    private PostService postService;

    @PostMapping
    public ResponseEntity<?> createPost(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
            @RequestBody CreatePostRequest request
    ) {
        Long postId = postService.createPost(authorizationHeader, request);
        return ResponseEntity.ok(
                Map.of(
                        "success", true,
                        "message", "게시물이 저장되었습니다.",
                        "postId", postId
                )
        );
    }

    @GetMapping
    public ResponseEntity<?> getRecentPosts(@RequestParam(value = "memberId", required = false) Long memberId) {
        if (memberId != null) {
            return ResponseEntity.ok(
                    Map.of(
                            "success", true,
                            "results", postService.getPostsByMember(memberId)
                    )
            );
        }

        return ResponseEntity.ok(
                Map.of(
                        "success", true,
                        "results", postService.getRecentPosts()
                )
        );
    }
}
