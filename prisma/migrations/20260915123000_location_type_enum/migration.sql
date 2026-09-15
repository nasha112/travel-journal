-- 地点类型：自由字符串 → 枚举（LocationType）
-- 现有数据已由脚本映射为枚举值：'景点'→'ATTRACTION'、'购物'→'SHOPPING'
ALTER TABLE `locations` MODIFY `type` ENUM('ATTRACTION','RESTAURANT','HOTEL','SHOPPING','STATION','AIRPORT','PARK','MUSEUM','OTHER') NULL;
