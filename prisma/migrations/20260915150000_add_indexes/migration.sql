-- 首页/旅行列表：按用户 + 创建时间排序
CREATE INDEX idx_trip_user_created ON trips(user_id, created_at);
-- 年份筛选：开始日期
CREATE INDEX idx_trip_start_date ON trips(start_date);
-- 消费分类统计
CREATE INDEX idx_expense_category ON expenses(category);
-- 地点类型筛选
CREATE INDEX idx_location_type ON locations(type);
