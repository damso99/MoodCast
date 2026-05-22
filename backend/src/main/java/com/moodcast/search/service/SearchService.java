package com.moodcast.search.service;

import com.moodcast.search.dao.SearchDao;
import com.moodcast.search.vo.SearchHashtagResult;
import com.moodcast.search.vo.SearchPostResult;
import com.moodcast.search.vo.SearchUserResult;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;

@Service
public class SearchService {
    @Autowired
    private SearchDao searchDao;

    // 검색어가 없으면 빈 리스트를 반환하고, 있으면 DAO를 통해 DB에서 검색합니다.
    public List<SearchPostResult> searchPosts(String query) {
        if (query == null || query.trim().isEmpty()) {
            return Collections.emptyList();
        }
        return searchDao.searchPosts(query.trim());
    }

    public List<SearchUserResult> searchUsers(String query) {
        if (query == null || query.trim().isEmpty()) {
            return Collections.emptyList();
        }
        return searchDao.searchUsers(query.trim());
    }

    public List<SearchHashtagResult> searchHashtags(String query) {
        if (query == null || query.trim().isEmpty()) {
            return Collections.emptyList();
        }
        return searchDao.searchHashtags(query.trim());
    }
}
