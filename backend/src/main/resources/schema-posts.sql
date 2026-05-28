-- 추가된 게시물 상호작용 테이블

CREATE TABLE IF NOT EXISTS post_like (
  post_like_id BIGINT NOT NULL AUTO_INCREMENT,
  post_id BIGINT NOT NULL,
  member_id BIGINT NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (post_like_id),
  UNIQUE KEY uniq_post_member_like (post_id, member_id),
  FOREIGN KEY (post_id) REFERENCES post_tbl(post_id),
  FOREIGN KEY (member_id) REFERENCES members(member_id)
);

CREATE TABLE IF NOT EXISTS comment_tbl (
  comment_id BIGINT NOT NULL AUTO_INCREMENT,
  post_id BIGINT NOT NULL,
  member_id BIGINT NOT NULL,
  parent_id BIGINT NULL,
  content TEXT NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  deleted_yn CHAR(1) NOT NULL DEFAULT 'N',
  PRIMARY KEY (comment_id),
  FOREIGN KEY (post_id) REFERENCES post_tbl(post_id),
  FOREIGN KEY (member_id) REFERENCES members(member_id)
);

CREATE TABLE IF NOT EXISTS saved_post (
  saved_post_id BIGINT NOT NULL AUTO_INCREMENT,
  post_id BIGINT NOT NULL,
  member_id BIGINT NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (saved_post_id),
  UNIQUE KEY uniq_post_member_saved (post_id, member_id),
  FOREIGN KEY (post_id) REFERENCES post_tbl(post_id),
  FOREIGN KEY (member_id) REFERENCES members(member_id)
);
