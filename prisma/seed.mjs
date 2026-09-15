/**
 * 演示数据种子脚本
 * 运行：node prisma/seed.mjs
 * 会清空 demo@travel.com 用户下的全部数据，重新生成 3 趟旅行演示数据
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const DEMO_EMAIL = "demo@travel.com";

const trips = [
  {
    title: "云南七日游 · 昆明大理丽江",
    status: "COMPLETED",
    description:
      "第一次去云南，从春城昆明一路向西，在大理洱海边骑行，在丽江古城发呆，最后登上了玉龙雪山。一路蓝天白云，印象深刻。",
    startDate: "2026-07-01",
    endDate: "2026-07-07",
    days: [
      {
        title: "抵达昆明，滇池观鸥",
        date: "2026-07-01",
        note: "下午抵达长水机场，入住滇池附近民宿。傍晚去海埂大坝看红嘴鸥，日落很美。",
        locations: [
          {
            name: "滇池海埂大坝",
            country: "中国",
            city: "昆明",
            lat: 24.9507,
            lng: 102.6999,
            type: "ATTRACTION",
            note: "傍晚的红嘴鸥很多，风大记得带外套",
            blogs: [
              {
                title: "在滇池边等一场日落",
                content:
                  "## 海埂大坝的傍晚\n\n下飞机的第一站就是滇池。**海埂大坝的风很大**，但是红嘴鸥真的很多，买了两包鸥粮，它们一点都不怕人。\n\n> 夕阳把水面染成金色的时候，觉得这趟旅行值了。\n\n晚上在附近吃了正宗的**过桥米线**，汤底很鲜。",
              },
              {
                title: "红嘴鸥的清晨，滇池的另一面",
                content:
                  "## 清晨的滇池\n\n第二天一早又去了一次大坝，和傍晚完全不同。\n\n- **7:00** 到的时候雾还没散，湖面像盖了一层纱\n- 红嘴鸥在晨光里特别白，抢食也特别凶\n- 买了一瓶鸥粮，它们会落在手上啄\n\n> 建议清晨来一次、傍晚来一次，两个滇池都值得。",
              },
            ],
          },
        ],
        expenses: [
          { category: "TRANSPORT", amount: 860, note: "广州→昆明 机票", locationIdx: null },
          { category: "ACCOMMODATION", amount: 238, note: "滇池边民宿（第1晚）", locationIdx: null },
          { category: "FOOD", amount: 78, note: "晚餐 过桥米线", locationIdx: 0 },
        ],
      },
      {
        title: "昆明→大理，夜游古城",
        date: "2026-07-02",
        note: "上午高铁到大理，入住古城客栈。晚上逛大理古城，人民路的小酒馆很热闹。",
        locations: [
          {
            name: "大理古城",
            country: "中国",
            city: "大理",
            lat: 25.6926,
            lng: 100.1585,
            type: "ATTRACTION",
            note: "夜晚的古城比白天更有味道",
          },
        ],
        expenses: [
          { category: "TRANSPORT", amount: 145, note: "昆明→大理 高铁", locationIdx: null },
          { category: "ACCOMMODATION", amount: 268, note: "古城客栈（第2晚）", locationIdx: null },
          { category: "FOOD", amount: 96, note: "大理古城晚餐", locationIdx: 0 },
          { category: "SHOPPING", amount: 65, note: "古城买的手工扎染", locationIdx: 0 },
        ],
      },
      {
        title: "洱海环湖骑行",
        date: "2026-07-03",
        note: "租了电动车环洱海，从才村码头出发到喜洲古镇再回来，全程约 60 公里，累但值得。",
        locations: [
          {
            name: "洱海",
            country: "中国",
            city: "大理",
            lat: 25.7986,
            lng: 100.2115,
            type: "ATTRACTION",
            note: "环湖路上随手一拍都是屏保",
          },
        ],
        expenses: [
          { category: "TRANSPORT", amount: 80, note: "租电动车", locationIdx: 0 },
          { category: "FOOD", amount: 45, note: "喜洲粑粑和凉粉", locationIdx: 0 },
          { category: "ACCOMMODATION", amount: 268, note: "古城客栈（第3晚）", locationIdx: null },
        ],
      },
      {
        title: "大理→丽江，古城漫步",
        date: "2026-07-04",
        note: "高铁一小时到丽江。下午开始逛丽江古城，四方街、大水车，晚上听了一路民谣。",
        locations: [
          {
            name: "丽江古城",
            country: "中国",
            city: "丽江",
            lat: 26.8731,
            lng: 100.2308,
            type: "ATTRACTION",
            note: "晚上酒吧街太吵，喜欢安静可以去狮子山看夜景",
            blog: {
              title: "丽江古城的一夜",
              content:
                "## 四方街的晚上\n\n丽江的夜晚属于**民谣**。坐在小酒馆门口，听驻唱歌手弹着吉他唱《南方姑娘》，突然理解了为什么那么多人来了就不想走。\n\n- 大水车附近拍照人最多\n- 狮子山上看古城全景很赞\n- 第二天早上一定要去吃**鸡豆凉粉**",
            },
          },
        ],
        expenses: [
          { category: "TRANSPORT", amount: 34, note: "大理→丽江 动车", locationIdx: null },
          { category: "ACCOMMODATION", amount: 320, note: "古城客栈（第4晚）", locationIdx: null },
          { category: "FOOD", amount: 88, note: "丽江腊排骨火锅", locationIdx: 0 },
        ],
      },
      {
        title: "玉龙雪山一日",
        date: "2026-07-05",
        note: "报了一日游小团，索道上到 4506 米，虽然高反有点晕，但看到雪山的那一刻一切都值了。",
        locations: [
          {
            name: "玉龙雪山",
            country: "中国",
            city: "丽江",
            lat: 27.1,
            lng: 100.18,
            type: "ATTRACTION",
            note: "一定要提前买氧气瓶",
            blog: {
              title: "登顶玉龙雪山 4506 米",
              content:
                "## 缺氧但震撼\n\n坐大索道一路攀升，窗外的植被从森林变成草甸再变成**岩石和雪**。\n\n到了 4506 米的观景台，风很大，但眼前的冰川和蓝天让所有的高反都值得了。\n\n**Tips：**\n\n1. 氧气瓶提前在古城买，景区贵一倍\n2. 穿防风外套，山顶风真的很大\n3. 体力允许可以走栈道再往上爬一段",
            },
          },
        ],
        expenses: [
          { category: "TICKET", amount: 480, note: "玉龙雪山一日团（含索道）", locationIdx: 0 },
          { category: "FOOD", amount: 35, note: "山上简餐", locationIdx: 0 },
          { category: "ACCOMMODATION", amount: 320, note: "古城客栈（第5晚）", locationIdx: null },
        ],
      },
      {
        title: "束河古镇，慢下来",
        date: "2026-07-06",
        note: "从丽江古城打车去束河，比大研安静很多。在河边咖啡馆坐了一下午，喝了两杯手冲。",
        locations: [
          {
            name: "束河古镇",
            country: "中国",
            city: "丽江",
            lat: 26.9,
            lng: 100.22,
            type: "ATTRACTION",
            note: "比大研安静，适合发呆",
          },
        ],
        expenses: [
          { category: "TRANSPORT", amount: 25, note: "打车去束河", locationIdx: 0 },
          { category: "FOOD", amount: 62, note: "束河咖啡馆+小吃", locationIdx: 0 },
          { category: "ACCOMMODATION", amount: 320, note: "古城客栈（第6晚）", locationIdx: null },
        ],
      },
      {
        title: "返程",
        date: "2026-07-07",
        note: "上午丽江直飞广州，云南之旅结束。",
        locations: [],
        expenses: [{ category: "TRANSPORT", amount: 920, note: "丽江→广州 机票", locationIdx: null }],
      },
    ],
  },
  {
    title: "北京文化三日游",
    status: "COMPLETED",
    description: "三月末的北京，故宫的杏花开了。把最经典的路线走了一遍，长城比想象中更震撼。",
    startDate: "2026-04-03",
    endDate: "2026-04-05",
    days: [
      {
        title: "天安门-故宫",
        date: "2026-04-03",
        note: "一早看升旗，然后逛故宫一整天。珍宝馆和钟表馆一定要去。",
        locations: [
          {
            name: "天安门广场",
            country: "中国",
            city: "北京",
            lat: 39.9087,
            lng: 116.3975,
            type: "ATTRACTION",
            note: "看升旗要提前一小时去排队",
          },
          {
            name: "故宫博物院",
            country: "中国",
            city: "北京",
            lat: 39.9163,
            lng: 116.3972,
            type: "ATTRACTION",
            note: "门票要提前预约",
            blog: {
              title: "故宫的杏花与红墙",
              content:
                "## 在故宫走了一整天\n\n从午门进去的那一刻，就被**红墙黄瓦**震撼到了。三月底正好赶上杏花季，御花园的杏花开得正好。\n\n> 站在太和殿广场中央，想象几百年前的朝会，历史感扑面而来。\n\n**推荐路线：**\n\n1. 中轴线（太和殿→乾清宫→坤宁宫）\n2. 东六宫（珍宝馆、钟表馆）\n3. 御花园出口",
            },
          },
        ],
        expenses: [
          { category: "TRANSPORT", amount: 880, note: "广州→北京 高铁", locationIdx: null },
          { category: "ACCOMMODATION", amount: 420, note: "前门附近酒店（第1晚）", locationIdx: null },
          { category: "TICKET", amount: 60, note: "故宫门票", locationIdx: 1 },
          { category: "FOOD", amount: 75, note: "故宫冰窖餐厅", locationIdx: 1 },
          { category: "TRANSPORT", amount: 12, note: "地铁 3 日卡", locationIdx: 0 },
        ],
      },
      {
        title: "颐和园-圆明园",
        date: "2026-04-04",
        note: "上午颐和园昆明湖划船，下午圆明园看西洋楼遗址。",
        locations: [
          {
            name: "颐和园",
            country: "中国",
            city: "北京",
            lat: 39.9998,
            lng: 116.2755,
            type: "ATTRACTION",
            note: "昆明湖划船很惬意",
          },
          {
            name: "圆明园",
            country: "中国",
            city: "北京",
            lat: 40.0082,
            lng: 116.2999,
            type: "ATTRACTION",
            note: "西洋楼遗址很震撼",
          },
        ],
        expenses: [
          { category: "TICKET", amount: 50, note: "颐和园联票", locationIdx: 0 },
          { category: "TICKET", amount: 25, note: "圆明园门票", locationIdx: 1 },
          { category: "FOOD", amount: 98, note: "烤鸭晚餐", locationIdx: 0 },
          { category: "ACCOMMODATION", amount: 420, note: "前门附近酒店（第2晚）", locationIdx: null },
        ],
      },
      {
        title: "八达岭长城",
        date: "2026-04-05",
        note: "早起坐高铁去八达岭，爬北线到好汉坡。下午返程回广州。",
        locations: [
          {
            name: "八达岭长城",
            country: "中国",
            city: "北京",
            lat: 40.3542,
            lng: 116.0126,
            type: "ATTRACTION",
            note: "北线比南线陡，风景也更好",
            blog: {
              title: "不到长城非好汉",
              content:
                "## 好汉坡打卡\n\n坐高铁 20 分钟就到八达岭了，比想象中方便。\n\n爬北线到好汉坡，站在城墙上往两边看，**长城蜿蜒在群山之间**，那种壮阔真的无法用照片表达。\n\n> 建议早点出发，中午以后人太多。\n\n下山的时候腿都在抖，但值得！",
            },
          },
        ],
        expenses: [
          { category: "TRANSPORT", amount: 46, note: "北京北→八达岭 高铁往返", locationIdx: 0 },
          { category: "TICKET", amount: 40, note: "八达岭长城门票", locationIdx: 0 },
          { category: "FOOD", amount: 55, note: "长城脚下午餐", locationIdx: 0 },
          { category: "TRANSPORT", amount: 880, note: "北京→广州 高铁", locationIdx: null },
        ],
      },
    ],
  },
  {
    title: "成都吃货之旅",
    status: "ONGOING",
    description: "九月中旬错峰去的成都。火锅、串串、兔头、冰粉，三天胖三斤，但真的快乐。",
    startDate: "2026-09-13",
    endDate: "2026-09-16",
    days: [
      {
        title: "宽窄巷子-锦里",
        date: "2026-10-01",
        note: "上午宽窄巷子，下午锦里。晚上排队两小时吃到了网红火锅。",
        locations: [
          {
            name: "宽窄巷子",
            country: "中国",
            city: "成都",
            lat: 30.6698,
            lng: 104.0571,
            type: "ATTRACTION",
            note: "商业化比较重，但第一次来还是值得逛",
          },
          {
            name: "锦里古街",
            country: "中国",
            city: "成都",
            lat: 30.6386,
            lng: 104.047,
            type: "ATTRACTION",
            note: "晚上的红灯笼很好看",
          },
        ],
        expenses: [
          { category: "TRANSPORT", amount: 700, note: "广州→成都 机票", locationIdx: null },
          { category: "ACCOMMODATION", amount: 350, note: "春熙路附近酒店（第1晚）", locationIdx: null },
          { category: "FOOD", amount: 180, note: "网红火锅（排队2小时）", locationIdx: 1 },
          { category: "SHOPPING", amount: 90, note: "宽窄巷子买的熊猫玩偶", locationIdx: 0 },
        ],
      },
      {
        title: "熊猫基地-春熙路",
        date: "2026-10-02",
        note: "早上七点出门去看熊猫，赶上了熊猫吃早饭。下午春熙路太古里逛街。",
        locations: [
          {
            name: "成都大熊猫繁育研究基地",
            country: "中国",
            city: "成都",
            lat: 30.7353,
            lng: 104.1444,
            type: "ATTRACTION",
            note: "一定要早去！晚了熊猫就睡了",
            blog: {
              title: "看熊猫吃竹子看到发呆",
              content:
                "## 圆滚滚的治愈时刻\n\n早上 7 点入园直奔月亮产房，正好赶上熊猫开饭。\n\n看着它们**抱着竹子啃得津津有味**，然后翻个身躺下，一整天的疲惫都没了。\n\n> 幼年熊猫最可爱，一定要去太阳产房和月亮产房。\n\n买了只熊猫发箍戴了一整天，回头率超高。",
            },
          },
          {
            name: "春熙路太古里",
            country: "中国",
            city: "成都",
            lat: 30.6551,
            lng: 104.0809,
            type: "SHOPPING",
            note: "网红熊猫爬墙雕塑在 IFS",
          },
        ],
        expenses: [
          { category: "TICKET", amount: 55, note: "熊猫基地门票", locationIdx: 0 },
          { category: "TRANSPORT", amount: 30, note: "打车去熊猫基地", locationIdx: 0 },
          { category: "FOOD", amount: 150, note: "太古里川菜馆", locationIdx: 1 },
          { category: "SHOPPING", amount: 260, note: "太古里买的衣服", locationIdx: 1 },
          { category: "ACCOMMODATION", amount: 350, note: "春熙路附近酒店（第2晚）", locationIdx: null },
        ],
      },
      {
        title: "人民公园喝茶-返程",
        date: "2026-10-03",
        note: "上午人民公园鹤鸣茶社喝茶采耳，下午机场返程。",
        locations: [
          {
            name: "人民公园",
            country: "中国",
            city: "成都",
            lat: 30.6543,
            lng: 104.0523,
            type: "ATTRACTION",
            note: "鹤鸣茶社一碗盖碗茶 20 块，能坐一下午",
          },
        ],
        expenses: [
          { category: "FOOD", amount: 42, note: "鹤鸣茶社盖碗茶+采耳", locationIdx: 0 },
          { category: "TRANSPORT", amount: 700, note: "成都→广州 机票", locationIdx: null },
        ],
      },
    ],
  },
  {
    title: "2026 国庆 · 西安古城之旅",
    description: "计划中：兵马俑、城墙、回民街，想去看一眼长安的秋天。",
    startDate: "2026-10-01",
    endDate: "2026-10-05",
    status: "PLANNED",
    days: [],
  },
];
async function main() {
  // 1. 确保演示用户存在
  let user = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } });
  if (!user) {
    const hashed = await bcrypt.hash("123456", 10);
    user = await prisma.user.create({
      data: { email: DEMO_EMAIL, password: hashed, name: "DemoUser" },
    });
  }

  // 2. 清空该用户原有数据（级联删除）
  await prisma.trip.deleteMany({ where: { userId: user.id } });

  // 3. 重建演示数据
  for (const trip of trips) {
    const t = await prisma.trip.create({
      data: {
        userId: user.id,
        title: trip.title,
        description: trip.description,
        startDate: new Date(`${trip.startDate}T00:00:00`),
        endDate: new Date(`${trip.endDate}T00:00:00`),
        status: trip.status ?? "PLANNED",
      },
    });

    for (let di = 0; di < trip.days.length; di++) {
      const day = trip.days[di];
      const d = await prisma.tripDay.create({
        data: {
          tripId: t.id,
          dayNumber: di + 1,
          title: day.title,
          date: new Date(`${day.date}T00:00:00`),
          note: day.note,
        },
      });

      // 地点
      const locationIds = [];
      for (const loc of day.locations) {
        const l = await prisma.location.create({
          data: {
            tripDayId: d.id,
            name: loc.name,
            country: loc.country,
            city: loc.city,
            lat: loc.lat,
            lng: loc.lng,
            type: loc.type,
            note: loc.note,
          },
        });
        locationIds.push(l.id);

        // 游记（一个地点可有多篇）
        const blogList = loc.blog ? [loc.blog] : loc.blogs ?? [];
        for (const b of blogList) {
          await prisma.blog.create({
            data: { locationId: l.id, title: b.title, content: b.content },
          });
        }
      }

      // 消费（locationIdx 指向当天第几个地点）
      for (const exp of day.expenses) {
        await prisma.expense.create({
          data: {
            tripId: t.id,
            tripDayId: d.id,
            locationId: exp.locationIdx != null ? locationIds[exp.locationIdx] : null,
            category: exp.category,
            amount: exp.amount,
            note: exp.note,
            date: new Date(`${day.date}T00:00:00`),
          },
        });
      }
    }
  }

  const summary = await prisma.trip.findMany({
    where: { userId: user.id },
    include: {
      _count: { select: { days: true } },
      days: { include: { _count: { select: { locations: true, expenses: true } } } },
    },
  });

  console.log("✅ 演示数据生成完成");
  for (const t of summary) {
    const locs = t.days.reduce((s, d) => s + d._count.locations, 0);
    const exps = t.days.reduce((s, d) => s + d._count.expenses, 0);
    console.log(`  - ${t.title}：${t._count.days} 天 / ${locs} 地点 / ${exps} 笔消费`);
  }
}

main()
  .catch((e) => {
    console.error("❌ 生成失败：", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
