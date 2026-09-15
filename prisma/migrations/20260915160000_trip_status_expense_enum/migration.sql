-- ① 消费分类：存量中文映射为枚举值
UPDATE expenses SET category='TRANSPORT' WHERE category='交通';
UPDATE expenses SET category='ACCOMMODATION' WHERE category='住宿';
UPDATE expenses SET category='FOOD' WHERE category='餐饮';
UPDATE expenses SET category='TICKET' WHERE category='门票';
UPDATE expenses SET category='SHOPPING' WHERE category='购物';
UPDATE expenses SET category='OTHER' WHERE category='其他';

-- ② 消费分类改为枚举
ALTER TABLE expenses MODIFY category ENUM('TRANSPORT','ACCOMMODATION','FOOD','TICKET','SHOPPING','OTHER') NOT NULL;

-- ③ 旅行增加状态字段（默认计划中）
ALTER TABLE trips ADD COLUMN status ENUM('PLANNED','ONGOING','COMPLETED') NOT NULL DEFAULT 'PLANNED' AFTER end_date;

-- ④ 按起止日期回填存量旅行状态
UPDATE trips SET status='COMPLETED' WHERE end_date IS NOT NULL AND end_date < NOW();
UPDATE trips SET status='ONGOING' WHERE start_date IS NOT NULL AND end_date IS NOT NULL AND start_date <= NOW() AND end_date >= NOW();
