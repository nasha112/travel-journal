-- 性能测试数据集：50 地点 / 100 游记 / 500 图片 / 500 消费
USE travel_journal;

SET @uid = (SELECT id FROM users WHERE email = 'demo@travel.com' LIMIT 1);

-- 清理旧的性能测试数据（可重复执行）
DELETE FROM trips WHERE title LIKE '【性能测试】%';

-- 主旅行
INSERT INTO trips (title, description, status, start_date, end_date, created_at, user_id)
VALUES ('【性能测试】大规模数据集', '50 地点 / 100 游记 / 500 图片 / 500 消费', 'COMPLETED', '2025-01-01', '2025-01-05', NOW(), @uid);
SET @tid = LAST_INSERT_ID();

-- 5 个旅行日
INSERT INTO trip_days (day_number, title, date, trip_id) VALUES
(1, 'Day 1', '2025-01-01', @tid),
(2, 'Day 2', '2025-01-02', @tid),
(3, 'Day 3', '2025-01-03', @tid),
(4, 'Day 4', '2025-01-04', @tid),
(5, 'Day 5', '2025-01-05', @tid);

DELIMITER //
DROP PROCEDURE IF EXISTS perf_seed//
CREATE PROCEDURE perf_seed(IN tid INT)
BEGIN
  DECLARE d INT DEFAULT 1;
  DECLARE l INT DEFAULT 1;
  DECLARE i INT DEFAULT 1;
  DECLARE day_id INT;
  DECLARE loc_id INT;
  DECLARE blog_a INT;
  DECLARE blog_b INT;

  WHILE d <= 5 DO
    SELECT id INTO day_id FROM trip_days WHERE trip_id = tid AND day_number = d;
    SET l = 1;
    WHILE l <= 10 DO
      INSERT INTO locations (name, country, city, lat, lng, type, note, trip_day_id)
      VALUES (CONCAT('性能测试地点 D', d, '-L', l), '中国', '测试城市',
              20 + d + l * 0.1, 100 + l * 0.2, 'ATTRACTION', NULL, day_id);
      SET loc_id = LAST_INSERT_ID();

      -- 每地点 2 篇游记
      INSERT INTO blogs (title, content, created_at, updated_at, location_id) VALUES
      (CONCAT('性能测试游记 ', loc_id, ' A'),
       CONCAT('# 测试游记\n\n这是第 ', loc_id, ' 个地点的第一篇游记。\n\n- 项目一\n- 项目二\n\n> 引用内容\n\n![图片说明](/uploads/perf-', loc_id, '-1.png)'),
       NOW(), NOW(), loc_id),
      (CONCAT('性能测试游记 ', loc_id, ' B'),
       CONCAT('# 测试游记\n\n第二篇内容，包含**加粗**和[链接](https://example.com)。\n\n1. 第一站\n2. 第二站'),
       NOW(), NOW(), loc_id);
      SELECT id INTO blog_a FROM blogs WHERE location_id = loc_id ORDER BY id LIMIT 1 OFFSET 0;
      SELECT id INTO blog_b FROM blogs WHERE location_id = loc_id ORDER BY id LIMIT 1 OFFSET 1;

      -- 每篇 5 张图（共 500）
      SET i = 1;
      WHILE i <= 5 DO
        INSERT INTO blog_images (url, blog_id) VALUES
        (CONCAT('/uploads/perf-', loc_id, '-a', i, '.png'), blog_a),
        (CONCAT('/uploads/perf-', loc_id, '-b', i, '.png'), blog_b);
        SET i = i + 1;
      END WHILE;

      SET l = l + 1;
    END WHILE;
    SET d = d + 1;
  END WHILE;

  -- 500 笔消费
  SET i = 1;
  WHILE i <= 500 DO
    INSERT INTO expenses (category, amount, note, date, trip_id, trip_day_id, location_id)
    VALUES (ELT(1 + MOD(i, 6), 'TRANSPORT', 'ACCOMMODATION', 'FOOD', 'TICKET', 'SHOPPING', 'OTHER'),
            i, CONCAT('性能测试消费 ', i), DATE_ADD('2025-01-01', INTERVAL MOD(i, 5) DAY), tid, NULL, NULL);
    SET i = i + 1;
  END WHILE;
END//
DELIMITER ;

CALL perf_seed(@tid);
DROP PROCEDURE perf_seed;

-- 校验数量
SELECT 'locations' AS k, COUNT(*) AS v FROM locations WHERE trip_day_id IN (SELECT id FROM trip_days WHERE trip_id = @tid)
UNION ALL SELECT 'blogs', COUNT(*) FROM blogs WHERE location_id IN (SELECT id FROM locations WHERE trip_day_id IN (SELECT id FROM trip_days WHERE trip_id = @tid))
UNION ALL SELECT 'blog_images', COUNT(*) FROM blog_images WHERE blog_id IN (SELECT id FROM blogs WHERE location_id IN (SELECT id FROM locations WHERE trip_day_id IN (SELECT id FROM trip_days WHERE trip_id = @tid)))
UNION ALL SELECT 'expenses', COUNT(*) FROM expenses WHERE trip_id = @tid;
