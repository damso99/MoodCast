package com.moodcast.report.dao;

import com.moodcast.report.domain.Report;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface ReportDao {
    int insertReport(Report report);

    int existsPostById(@Param("postId") Long postId);

    int existsCommentById(@Param("commentId") Long commentId);
}
