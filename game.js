const app = document.querySelector("#app");

const state = {
  screen: "title",
  selectedCharacter: 0,
  selectedReward: null,
  selectedAudience: [],
  rewardChoices: [],
  audienceChoices: [],
  player: null,
  battle: null,
  cardPoolFilter: { rarity: "all", series: "all" },
  cardPoolOrigin: "title",
  showRunDeck: false,
  showBackpack: false,
};

const assetPaths = {
  titleCover: "assets/chinchinko-title.png?v=20260503-title-refresh",
  titleCoverFallback: "assets/title-cover.png?v=20260503-title-refresh",
  titleLeft: "assets/title-left-locked.png",
  titleCenter: "assets/chinchinko-title.png",
  titleRight: "assets/title-right-locked.png",
  characterSelect: "assets/character-select.png?v=20260502-1",
  chinchinkoProfile: "assets/chinchinko-profile.png",
  chinchinkoBattleAvatar: "assets/chinchinko-battle-head.png",
  introVideo: "assets/intro-xd-hq.mp4",
  hqExterior: "assets/xd-hq-exterior.png",
  mentor: "assets/xiao-zhengming.png",
  supportTable: "assets/support-table.png",
  supportEnergyDrink: "assets/support-energy-drink.png",
  supportUglyPillow: "assets/support-ugly-pillow.png",
  supportMoney: "assets/support-money.png",
  supportTablet: "assets/support-tablet.png",
  supportMentorBlessing: "assets/support-mentor-blessing.png",
  supportScissors: "assets/support-scissors.png",
  supportT1vBadge: "assets/support-t1v-badge.png",
  uglyPillow: "assets/ugly-pillow.png",
  kutaBoss: "assets/kuta-boss.png",
};

function imageWithFallback(src, alt, className, fallback = "") {
  return `<img class="${className}" src="${src}" alt="${alt}" onerror="this.remove()" />${fallback}`;
}

const traits = {
  "大乾爹": "回合結束時此單位給予你 100 元。",
  "嘴砲高手": "具有嘲諷。",
  "戀愛粉": "攻擊 +2，生命 +7，但強制上場。",
  "危險斗內份子": "攻擊 +3，每回合失去 4 點生命。",
  "善良觀眾": "每回合開始提供出道 VT 2 點防禦。",
  "檢舉幫": "攻擊時使隨機角色攻擊 -2。",
  "潛水仔": "其他角色存活時不能被選中。",
  "誇誇幫": "攻擊後使隨機 1 名我方角色本回合攻擊 +2。",
  "跟風仔": "每回合暫時模仿己方上場觀眾特性。",
  "肥宅": "回合結束時，回復 3 點生命。",
};

const traitNames = Object.keys(traits);

const prefixPool = ["大六的", "危險的", "亂源的", "暈船的", "路過的", "爆肝的", "按下檢舉的", "延畢的", "愛妳的", "只說不做的", "愛喝奶茶的"];
const suffixPool = ["高葉貝", "吐司龍", "秋夜冰心", "妹可", "吉仙人", "丸少幫", "受受", "趴啪", "焦糖微甜", "老趙阿公", "42OWEN", "穆麻", "小花貓", "雲寶"];

const enemyTraitPools = {
  normal: [
    { name: "大乾爹", text: "回合結束時此單位給予你 100 元。" },
    { name: "嘴砲高手", text: "此單位具有嘲諷。", apply(unit) { unit.taunt = true; } },
    { name: "戀愛粉", text: "攻擊 +2，生命 +7。", apply(unit) { unit.attack += 2; unit.maxHp += 7; unit.hp += 7; } },
    { name: "危險斗內份子", text: "攻擊 +5。每回合開始時失去 4 點生命。", apply(unit) { unit.attack += 5; } },
    { name: "善良觀眾", text: "只是個善良觀眾。" },
    { name: "檢舉幫", text: "攻擊 +3。登場時使自己之外隨機 1 名角色攻擊 -2，持續 1 回合。", apply(unit) { unit.attack += 3; } },
    { name: "雲玩家", text: "每回合受到的第一次攻擊傷害減半。" },
    { name: "誇誇幫", text: "攻擊後使我方隨機 1 名角色攻擊 +2，持續 1 回合。" },
    { name: "跟風仔", text: "登場時複製旁邊人的 1 個特性。" },
    { name: "肥宅", text: "回合結束時，回復 3 點生命。" },
  ],
  rare: [
    { name: "水軍", text: "攻擊 +6。攻擊後奪取玩家 100 元。", apply(unit) { unit.attack += 6; } },
    { name: "打字高手", text: "每回合能多攻擊一次。" },
    { name: "衝塔人", text: "攻擊 +5。攻擊無法被阻礙。", apply(unit) { unit.attack += 5; } },
    { name: "剪輯幫", text: "每當 VT 擊倒角色，給予該 VT 200 元。" },
    { name: "丟球高手", text: "攻擊 +5。回合結束後自爆。", apply(unit) { unit.attack += 5; } },
    { name: "通靈仔", text: "回合開始時，隨機 1 張玩家手牌耗能 +1。" },
    { name: "暈船仔", text: "當 VT 生命低於 50% 時，停止攻擊。" },
  ],
  epic: [
    { name: "傳話幫", text: "隔壁單位可以重新行動一次。" },
    { name: "釣魚高手", text: "回合開始時，隨機使 1 名角色無法攻擊。" },
    { name: "黑E幫幫主", text: "攻擊有負面狀態的目標時，造成雙倍傷害。" },
    { name: "漢堡", text: "攻擊 -5，受到傷害減少 3，生命 +12。", apply(unit) { unit.attack = Math.max(0, unit.attack - 5); unit.maxHp += 12; unit.hp += 12; unit.damageReduction = Math.max(unit.damageReduction || 0, 3); } },
    { name: "小號大師", text: "生命低於 50% 時，分裂出 2 位複製體。" },
  ],
  legendary: [
    { name: "路過VT", text: "攻擊 +15，生命 +25。", apply(unit) { unit.attack += 15; unit.maxHp += 25; unit.hp += 25; unit.name = sample(["What皮革", "爛泥妹妹", "熊班長"]); } },
    { name: "廠商爸爸", text: "攻擊固定為 5。依在場回合給予金錢，受傷時扣除 300 元。", apply(unit) { unit.attack = 5; unit.fixedAttack = 5; } },
    { name: "專業後勤", text: "登場時使其他同陣營角色受到的下一次傷害轉化為同等數值的治癒。" },
  ],
};

const bodyQualityRanges = {
  normal: { attack: [4, 6], hp: [17, 23], money: 100 },
  rare: { attack: [7, 8], hp: [23, 27], money: 200 },
  epic: { attack: [9, 11], hp: [28, 35], money: 300 },
  legendary: { attack: [11, 15], hp: [35, 50], money: 400 },
};

const traitMoney = { normal: 50, rare: 100, epic: 150, legendary: 200 };

const enemyProgressionRates = [
  { min: 1, max: 2, rates: { normal: 100, rare: 0, epic: 0, legendary: 0 } },
  { min: 3, max: 5, rates: { normal: 70, rare: 25, epic: 5, legendary: 0 } },
  { min: 6, max: 8, rates: { normal: 55, rare: 33, epic: 10, legendary: 2 } },
  { min: 9, max: 10, rates: { normal: 43, rare: 35, epic: 15, legendary: 7 } },
  { min: 11, max: 13, rates: { normal: 35, rare: 27, epic: 25, legendary: 13 } },
  { min: 14, max: Infinity, rates: { normal: 20, rare: 25, epic: 35, legendary: 20 } },
];

const runRoute = [
  { type: "tutorial", battleIndex: 1, label: "新手教學戰鬥 1" },
  { type: "smallBattle", battleIndex: 2, label: "小戰鬥 2" },
  { type: "smallBattle", battleIndex: 3, label: "小戰鬥 3" },
  { type: "shop", id: "shop1", label: "蕭證明商店", checkId: "shop1" },
  { type: "smallBattle", battleIndex: 4, label: "小戰鬥 4" },
  { type: "smallBattle", battleIndex: 5, label: "小戰鬥 5" },
  { type: "miniboss", id: "miniboss1", label: "小頭目 1", checkId: "miniboss1" },
  { type: "minibossReward", id: "minibossReward1", label: "小頭目獎勵" },
  { type: "area", label: "第 2 區" },
  { type: "smallBattle", battleIndex: 6, label: "小戰鬥 6" },
  { type: "smallBattle", battleIndex: 7, label: "小戰鬥 7" },
  { type: "smallBattle", battleIndex: 8, label: "小戰鬥 8" },
  { type: "shop", id: "shop2", label: "蕭證明商店", checkId: "shop2" },
  { type: "smallBattle", battleIndex: 9, label: "小戰鬥 9" },
  { type: "smallBattle", battleIndex: 10, label: "小戰鬥 10" },
  { type: "miniboss", id: "miniboss2", label: "小頭目 2", checkId: "miniboss2" },
  { type: "minibossReward", id: "minibossReward2", label: "小頭目獎勵" },
  { type: "area", label: "第 3 區" },
  { type: "smallBattle", battleIndex: 11, label: "小戰鬥 11" },
  { type: "smallBattle", battleIndex: 12, label: "小戰鬥 12" },
  { type: "smallBattle", battleIndex: 13, label: "小戰鬥 13" },
  { type: "shop", id: "shop3", label: "蕭證明商店", checkId: "shop3" },
  { type: "smallBattle", battleIndex: 14, label: "小戰鬥 14" },
  { type: "smallBattle", battleIndex: 15, label: "小戰鬥 15" },
  { type: "miniboss", id: "miniboss3", label: "小頭目 3", checkId: "miniboss3" },
  { type: "ending", label: "結束遊戲" },
];

const minibosses = {
  kuta: {
    id: "kuta",
    name: "久田",
    hp: 60,
    attack: 7,
    image: assetPaths.kutaBoss,
    traits: ["天籟美聲", "粉絲服務", "專業主播"],
    traitText: {
      "天籟美聲": "每回合無效對手給予我方其他角色的負面效果一次。",
      "粉絲服務": "每回合恢復擁有久田戀愛粉特性的單位 2 點生命。",
      "專業主播": "自己回合開始時減少自身最高數值的負面效果 3 層。",
    },
    intentCycle: ["thigh", "attack", "world", "reincarnate", "defend"],
  },
};

const fameLevels = [
  { level: 0, name: "你是誰啊", rates: { normal: 100, rare: 0, epic: 0, legendary: 0 } },
  { level: 1, name: "默默無聞", rates: { normal: 70, rare: 25, epic: 5, legendary: 0 } },
  { level: 2, name: "初出茅廬", rates: { normal: 60, rare: 33, epic: 12, legendary: 0 } },
  { level: 3, name: "小有名氣", rates: { normal: 45, rare: 35, epic: 15, legendary: 5 } },
  { level: 4, name: "展露頭角", rates: { normal: 35, rare: 28, epic: 25, legendary: 12 } },
  { level: 5, name: "明日之星", rates: { normal: 25, rare: 25, epic: 32, legendary: 18 } },
  { level: 6, name: "舞則天", rates: { normal: 15, rare: 20, epic: 35, legendary: 25 } },
];

const fameThresholds = [
  { level: 0, min: 0, max: 0, name: "你是誰啊" },
  { level: 1, min: 1, max: 15, name: "默默無聞" },
  { level: 2, min: 16, max: 40, name: "初出茅廬" },
  { level: 3, min: 41, max: 65, name: "小有名氣" },
  { level: 4, min: 66, max: 90, name: "展露頭角" },
  { level: 5, min: 91, max: Infinity, name: "明日之星" },
];

const graduationChecks = [
  { id: "tutorial", label: "新手戰鬥結束後", requiredLevel: 1, requiredName: "默默無聞" },
  { id: "shop1", label: "第一次商店", requiredLevel: 2, requiredName: "初出茅廬" },
  { id: "miniboss1", label: "第一次小BOSS", requiredLevel: 3, requiredName: "小有名氣" },
  { id: "shop2", label: "第二次商店", requiredLevel: 4, requiredName: "展露頭角" },
  { id: "miniboss2", label: "第二次小BOSS戰", requiredLevel: 5, requiredName: "明日之星" },
  { id: "shop3", label: "第三次商店", requiredLevel: 5, requiredName: "明日之星" },
  { id: "miniboss3", label: "第三次小BOSS戰", requiredLevel: 5, requiredName: "明日之星" },
];

const rarityLabels = {
  normal: "普通",
  rare: "精良",
  epic: "史詩",
  legendary: "傳說",
};

const keywordDescriptions = {
  "剪剪系": "親親子的攻擊與剪刀連動牌系。",
  "小菸系": "以失去生命、抽牌、能量與防守交換節奏的牌系。",
  "魅惑系": "累積魅惑並用魅惑擊敗普通敵人的牌系。",
  "魅惑": "當單位魅惑值大於等於剩餘血量時觸發，親親子擊倒該單位。",
  "小剪刀": "0 能量衍生牌，造成 6 點攻擊傷害，打出後消失。",
  "凝滯": "回合結束不會進入棄牌堆。",
  "燒毀": "打出後不進入棄牌堆，消失在本場戰鬥，戰鬥結束後回歸牌組。",
  "必有": "在牌庫時抽牌，優先抽取。",
  "增益牌": "打出後本場戰鬥給予自身能力。",
  "蕭證明支援卡": "蕭證明商店販賣的支援卡。",
  "防禦": "優先抵擋受到的傷害，一場戰鬥內會永久堆疊。",
  "能量": "打出卡牌耗能的資源。",
  "手牌上限": "手牌最多 10 張。",
  "開場會抽到手中": "戰鬥開始時會優先出現在起手手牌。",
};

const runRules = {
  postBattleActions: 2,
  postBattleActionTypes: [
    { id: "wander", name: "外出閒逛", description: "30% 沒事發生，70% 觸發事件。" },
    { id: "upgrade", name: "精進自己", description: "升級 1 張卡牌。" },
    { id: "rest", name: "休息一下", description: "回復最大生命值 15%。" },
  ],
  shopAfterSmallBattles: 3,
  firstShopsThatRaiseFame: 2,
  firstMinibossRewardsThatRaiseFame: 2,
  firstMinibossCardReward: { legendary: 2, epic: 1 },
  maxStoryFameLevel: 4,
};

const runEvents = [
  {
    id: "global-buffet",
    name: "吃到飽",
    category: "永久事件",
    scope: "global",
    text: "今天是個風光明媚風和日麗的日子，你決定要讓自己的胃滿足，大滿足。",
    lines: [
      "今天是個風光明媚風和日麗的日子，你決定要讓自己的胃滿足，大滿足。",
      "所以今天你決定吃哪一餐？",
    ],
    options: [
      {
        label: "早餐吃到飽",
        outcome: "",
        lines: ["你花了500元，你吃得很滿足。你生命值上限提高10點並恢復50%最大生命。"],
        effects: [{ type: "money", amount: -500 }, { type: "maxHp", amount: 10 }, { type: "healPercentMax", percent: 0.5 }],
      },
      {
        label: "午餐吃到飽",
        outcome: "",
        lines: ["你吃太飽了，為了趕回家你花了1000元叫車回家，加上餐費總計支出2000元。"],
        effects: [{ type: "money", amount: -2000 }],
      },
      {
        label: "晚餐吃到飽",
        outcome: "",
        lines: ["你花了1000元在自助餐大快朵頤，但是吃太飽導致直播遲到，減少3點名氣值。"],
        effects: [{ type: "money", amount: -1000 }, { type: "fame", amount: -3 }],
      },
    ],
  },
  {
    id: "global-foreign-encounter",
    name: "異國奇遇",
    category: "永久事件",
    scope: "global",
    text: "為了放鬆心情你決定出國旅遊，正在街頭漫步時你突然被一家小店吸引了注意。",
    lines: [
      "為了放鬆心情你決定出國旅遊，正在街頭漫步時你突然被一家小店吸引了注意。",
      "小店裡煙霧繚繞看不清店內裝潢，但卻傳出陣陣悅耳琴聲。",
      "你推開店門踏了進去。琴聲戛然而止，接著響起一道滄桑的男聲：孩子，相逢就是有緣，接受吧。",
      "男聲話音剛落，店內的菸霧隨即退去，只留下空盪的店內與櫃檯上的一包香菸。",
      "你選擇接受獎勵，或是不接受獎勵？",
    ],
    options: [
      {
        label: "接受獎勵",
        outcome: "",
        lines: ["你收下了櫃檯上的一包香菸。"],
        effects: [{ type: "addItem", item: "一包香菸" }],
      },
      {
        label: "不接受獎勵",
        outcome: "",
        lines: ["男聲再度響起：不要這個嗎，那讓我為你獻上祝福！"],
        effects: [{ type: "storeBlessing", blessing: "暴雪祝福" }],
      },
    ],
  },
  {
    id: "global-ji-immortal",
    name: "偶遇吉仙人",
    category: "永久事件",
    scope: "global",
    text: "今天你出門逛街放鬆心情時遇到一個熱情推銷員。",
    lines: [
      "今天你出門逛街放鬆心情時遇到一個熱情推銷員。",
      "推銷員詢問你要不要看他養的吉娃娃。",
    ],
    options: [
      {
        label: "拒絕看吉娃",
        outcome: "",
        lines: ["雖然你果斷拒絕，但推銷員強迫你要觀看，你只好轉身逃跑。逃跑過程中你不小心跌倒，損失8點血量。"],
        effects: [{ type: "hp", amount: -8 }],
      },
      {
        label: "接受看吉娃",
        outcome: "",
        lines: ["推銷員抱歉一笑說：其實我沒養吉娃啦，哈哈。說完後他塞給你一張卡牌並轉身離去。"],
        effects: [{ type: "addSpecificCard", name: "可愛吉娃" }],
      },
    ],
  },
  {
    id: "global-xiao-huizi",
    name: "偶遇小輝子",
    category: "永久事件",
    scope: "global",
    text: "今天你在網路上衝浪，遇到一位自稱大師的人物小輝子。",
    lines: [
      "今天你在網路上衝浪，遇到一位自稱大師的人物小輝子。",
      "小輝子自稱有賭球名牌，信他準沒錯。",
      "你選擇相信他，還是不相信？",
    ],
    options: [
      {
        label: "相信他",
        outcome: "",
        lines: ["你掏出500元購買了小輝子推薦名牌。"],
        effects: [{ type: "money", amount: -500 }],
        randomResults: [
          { weight: 1, text: "你獲得了10000元！", outcome: "獲得 10000 元。", effects: [{ type: "money", amount: 10000 }] },
          { weight: 2, text: "你獲得了5000元！", outcome: "獲得 5000 元。", effects: [{ type: "money", amount: 5000 }] },
          { weight: 3, text: "你獲得了2500元！", outcome: "獲得 2500 元。", effects: [{ type: "money", amount: 2500 }] },
          { weight: 4, text: "你獲得了1000元！", outcome: "獲得 1000 元。", effects: [{ type: "money", amount: 1000 }] },
          { weight: 90, text: "你獲得了0元！", outcome: "獲得 0 元。", effects: [] },
        ],
      },
      {
        label: "不相信",
        outcome: "",
        lines: ["怪人一個，你關閉了聊天室。"],
        effects: [],
      },
    ],
  },
  {
    id: "fame-witchcon",
    name: "參加witchcon",
    category: "名氣事件",
    scope: "fame",
    maxFameValue: 35,
    text: "今天是直播界一年一度的盛事WITCHCON，為了流量你吸引關注。",
    lines: ["今天是直播界一年一度的盛事WITCHCON，為了流量你吸引關注。"],
    randomResults: [
      { weight: 34, text: "你大放異彩，名氣值增加5。", outcome: "名氣值增加 5。", effects: [{ type: "fame", amount: 5 }] },
      { weight: 33, text: "你徒勞無功，名氣值不變。", outcome: "名氣值不變。", effects: [] },
      { weight: 33, text: "你弄巧成拙，名氣值降低3。", outcome: "名氣值降低 3。", effects: [{ type: "fame", amount: -3 }] },
    ],
  },
  {
    id: "fame-inflammatory-marketing",
    name: "炎上商法",
    category: "名氣事件",
    scope: "fame",
    maxFameValue: 35,
    text: "今天你觀看風鴿影片，領悟了炎上商法。",
    lines: ["今天你觀看風鴿影片，領悟了炎上商法。", "你使用了炎上商法，下場戰鬥受到傷害與獲取名氣值翻倍。"],
    outcome: "下場戰鬥受到的傷害翻倍，下場戰鬥獲取名氣值翻倍。",
    effects: [
      { type: "nextBattleDamageTakenMultiplier", amount: 2 },
      { type: "nextBattleFameMultiplier", amount: 2 },
    ],
  },
  {
    id: "fame-meko-observer",
    name: "小V觀察家妹可",
    category: "名氣事件",
    scope: "fame",
    maxFameValue: 35,
    text: "雖然看的人寥寥無幾，但你依舊努力開台。今天有位神秘觀眾造訪了你的直播台。",
    lines: [
      "雖然看的人寥寥無幾，但你依舊努力開台。今天有位神秘觀眾造訪了你的直播台。",
      "他自稱小V觀察家妹可。他帶來的親親幫讓你收穫不少關注，名氣值提高七點。",
    ],
    outcome: "名氣提高 7 點。",
    effects: [{ type: "fame", amount: 7 }],
  },
  {
    id: "global-world-champion-training",
    name: "世界冠軍的特訓",
    category: "永久事件",
    scope: "global",
    text: "今天你到公園散步，有個在公園散步的國字臉阿伯叫住了你。",
    lines: [
      "今天你到公園散步，有個在公園散步的國字臉阿伯叫住了你。",
      "我從妳的眼中看出了熱愛卡牌的心，或許我能助妳一臂之力。",
      "你選擇接受阿伯好意，或是不接受阿伯好意？",
    ],
    options: [
      {
        label: "接受阿伯好意",
        outcome: "",
        lines: ["表情認真的阿伯原來曾經是世界冠軍！他的訓練十分嚴格，但讓你收穫良多。你的血量上限減少15點，獲得卡片「有放就會來」三張。"],
        effects: [{ type: "maxHp", amount: -15 }, { type: "addSpecificCard", name: "有放就會來", count: 3 }],
      },
      {
        label: "不接受阿伯好意",
        outcome: "",
        lines: ["你掉頭就走，無事發生。"],
        effects: [],
      },
    ],
  },
  {
    id: "global-sisters-argument",
    name: "姊妹的爭吵",
    category: "永久事件",
    scope: "global",
    text: "在街頭閒逛的你突然聽到激烈的爭吵聲。",
    lines: [
      "在街頭閒逛的你突然聽到激烈的爭吵聲。",
      "你連忙上前湊熱鬧。人群圍著兩名女子議論紛紛，一名女子下跪拉著另一名女子說：求求妳告訴我，我做錯什麼。被拉住的女子看起來並不想理會。",
      "你決定幫助下跪的女生、幫助站著的女生，或是旁觀？",
    ],
    options: [
      {
        label: "幫助下跪的女生",
        outcome: "",
        lines: ["雖然依舊還是沒能留住女子，但下跪的女生很感激，送給你一張亂畫的地圖。"],
        effects: [{ type: "addItem", item: "亂畫的地圖" }],
      },
      {
        label: "幫助站著的女生",
        outcome: "",
        lines: ["女子很感謝你的解圍，傳授了你可愛秘訣！"],
        effects: [{ type: "addItem", item: "裝可愛心機" }],
      },
      {
        label: "旁觀",
        outcome: "",
        lines: ["你看得很愉悅，心情大好。你血量上限提高8點，生命值回復8點。"],
        effects: [{ type: "maxHp", amount: 8 }, { type: "heal", amount: 8 }],
      },
    ],
  },
  {
    id: "global-hit-by-pitch",
    name: "觸身球",
    category: "永久事件",
    scope: "global",
    text: "因為在直播時因為沒注意到觀眾斗內的觸身球影片，你慘遭封禁一天。",
    lines: [
      "因為在直播時因為沒注意到觀眾斗內的觸身球影片，你慘遭封禁一天。",
      "你的名氣值提高了1，但是失去500元。",
    ],
    outcome: "名氣值提高 1，失去 500 元。",
    effects: [{ type: "fame", amount: 1 }, { type: "money", amount: -500 }],
  },
  {
    id: "global-three-color-dumpling",
    name: "三色豆水餃",
    category: "永久事件",
    scope: "global",
    text: "觀看別人的精華影片讓你對片中食物產生了濃厚興趣。",
    lines: [
      "觀看別人的精華影片讓你對片中食物產生了濃厚興趣。",
      "自己動手做的你成功製作了三色豆水餃！",
      "你在嘗過後發現味道微妙，決定留給觀眾吃。",
      "你獲得了三色豆水餃。",
    ],
    outcome: "獲得三色豆水餃。",
    effects: [{ type: "addItem", item: "三色豆水餃" }],
  },
  {
    id: "initial-street-man",
    name: "流落街頭的男子",
    category: "初始事件",
    scope: "initial",
    text: "你在寒冷的夜裡下樓買消夜，到便利商店時你看到一名獐頭鼠目的男子抱著身體蹲在門外。",
    lines: [
      "你在寒冷的夜裡下樓買消夜，到便利商店時你看到一名獐頭鼠目的男子抱著身體蹲在門外。",
      "你好心詢問男子需要幫助嗎。男子胡言亂語說著他是什麼冬雞冠均，只是因為一些事情被暫時趕出家門，只要你給他一些錢。",
      "男子大吼：皇帝必有重賞！你選擇給他1000元、給他3000元，或是不給他？",
    ],
    options: [
      {
        label: "給他1000元",
        outcome: "",
        lines: ["男子說1000也太少了，這個給你吧。男子不屑地丟了一張卡片在地上後罵罵咧咧地走了。獲得卡片「踢破骨灰罈」。"],
        effects: [{ type: "money", amount: -1000 }, { type: "addSpecificCard", name: "踢破骨灰罈" }],
      },
      {
        label: "給他3000元",
        outcome: "",
        lines: ["男子說有點意思，麻吉你值得這個。男子塞了一張卡片給你後便轉身離去。獲得卡片「比人生」。"],
        effects: [{ type: "money", amount: -3000 }, { type: "addSpecificCard", name: "比人生" }],
      },
      {
        label: "不給他",
        outcome: "",
        lines: ["你自言自語：又是一個怪人……。你買完消夜就匆匆離去。"],
        effects: [],
      },
    ],
  },
  {
    id: "initial-ramen-lost-man",
    name: "吃拉麵迷路的男人",
    category: "初始事件",
    scope: "initial",
    text: "今天你依照IG美食名家M98的推薦前往探店，在路上你看到一位大腹便便的男子表情慌恐地四處張望。",
    lines: [
      "今天你依照IG美食名家M98的推薦前往探店，在路上你看到一位大腹便便的男子表情慌恐地四處張望。",
      "男子看起來是迷路了，他不斷掏出手機查看，你走上前詢問男子目的地。",
      "男子說他要進行一場拉麵之旅，沒想到卻迷路了。他告訴了你要去的店家，剛好你之前有在M98的文章裡看到地址。",
      "你決定不理他、告訴他路，或是帶他去？",
    ],
    options: [
      {
        label: "不理他",
        outcome: "",
        lines: ["你假裝忘記，找藉口離開。"],
        effects: [],
      },
      {
        label: "告訴他路",
        outcome: "",
        lines: ["男子很感謝你的幫助並告訴你說之後去撲克協會找他，到時他會厚禮道謝。"],
        effects: [{ type: "setForcedNextWanderEvent", eventId: "followup-poker-association-empty" }],
      },
      {
        label: "帶他去",
        outcome: "",
        lines: ["男子十分感謝，給予你祝福。你獲得要拼祝福。"],
        effects: [{ type: "storeBlessing", blessing: "要拼祝福" }],
      },
    ],
  },
  {
    id: "initial-dog-training-master",
    name: "訓犬高手",
    category: "初始事件",
    scope: "initial",
    text: "你在通訊軟體CISDORO的群組閒逛時看到有人在打字分享訓犬心得。",
    lines: [
      "你在通訊軟體CISDORO的群組閒逛時看到有人在打字分享訓犬心得。",
      "停下來觀看的你領悟了訓犬寶典！",
    ],
    outcome: "獲得訓犬寶典。",
    effects: [{ type: "addItem", item: "訓犬寶典" }],
  },
  {
    id: "initial-threads-promo",
    name: "辦threads宣傳",
    category: "初始事件",
    scope: "initial",
    text: "為了提升人氣你決定辦threads宣傳。",
    lines: ["為了提升人氣你決定辦threads宣傳。"],
    randomResults: [
      {
        weight: 50,
        text: "你吸引了不少人，但仔細一看都是實況主角帳。你的名氣值沒有變化。",
        outcome: "名氣值沒有變化。",
        effects: [],
      },
      {
        weight: 50,
        text: "文章飄出去了！你的名氣值增加3。",
        outcome: "名氣值增加 3。",
        effects: [{ type: "fame", amount: 3 }],
      },
    ],
  },
  {
    id: "followup-poker-association-empty",
    name: "吃拉麵迷路的男人後續事件A",
    category: "後續事件",
    scope: "forced",
    text: "你依照男子的說法來到了撲克協會，卻沒有看到男子出現。",
    lines: ["你依照男子的說法來到了撲克協會，卻沒有看到男子出現。"],
    effects: [],
  },
];

const rewards = [
  {
    name: "醜臉抱枕",
    icon: "🥴",
    image: assetPaths.supportUglyPillow,
    desc: "不知道是誰的臉，看了很想扁，能吸引火力。",
    effect: "每場戰鬥受到的第一次傷害減半。",
  },
  {
    name: "不知名的護貝費",
    icon: "💵",
    image: assetPaths.supportMoney,
    desc: "不知道誰給的護貝費...看起來不少。",
    effect: "獲得 2000 元。",
    apply(player) {
      player.money += 2000;
    },
  },
  {
    name: "剪紙剪刀",
    icon: "✂",
    image: assetPaths.supportScissors,
    desc: "很鋒利的剪刀，不管是什麼紙都能剪開。",
    effect: "從牌組刪除 2 張牌，失去 10 點血量上限。",
    apply(player) {
      player.maxHp -= 10;
      player.hp = Math.min(player.hp, player.maxHp);
      player.pendingRemove = 2;
    },
  },
  {
    name: "台一V認證",
    icon: "🏅",
    image: assetPaths.supportT1vBadge,
    desc: "蕭證明認證台一V，數量跟路邊的老鼠一樣多。",
    effect: "卡牌獎勵等級提升一階。",
    apply(player) {
      player.cardRewardBonus = 1;
    },
  },
  {
    name: "提神飲料",
    icon: "🍋",
    image: assetPaths.supportEnergyDrink,
    desc: "狗才喝水。",
    effect: "每場戰鬥第一次生命低於一半時，回復 1 點生命並獲得 1 能量、抽 1 張牌。",
    apply(player) {
      player.items.push("提神飲料");
    },
  },
  {
    name: "神秘的平板",
    icon: "📱",
    image: assetPaths.supportTablet,
    desc: "不知道是誰的平板...，水時間的利器。",
    effect: "每場戰鬥開始時，抽 2張牌。",
    apply(player) {
      player.items.push("神秘的平板");
    },
  },
  {
    name: "導師的祝福",
    icon: "🎴",
    image: assetPaths.supportMentorBlessing,
    desc: "來自O鬼冠軍導師的祝福。",
    effect: "獲得一張隨機傳說卡。",
    apply(player) {
      player.deck.push(makeCard(sample(cardPools.legendary)));
    },
  },
];

const eventItems = {
  "一包香菸": {
    name: "一包香菸",
    icon: "🚬",
    desc: "異國小店留下的香菸，味道聞起來有點不真實。",
    effect: "前 2 次小菸牌失去生命效果改成回血。",
    apply(player) {
      player.items.push("一包香菸");
      player.cigarettePackCharges = (player.cigarettePackCharges || 0) + 2;
    },
  },
  "亂畫的地圖": {
    name: "亂畫的地圖",
    icon: "🗺",
    desc: "下跪的女生亂畫的地圖，看起來不像能指路。",
    effect: "戰鬥中使敵方第一個有攻擊意圖的敵人目標混亂。",
    apply(player) {
      player.items.push("亂畫的地圖");
    },
  },
  "裝可愛心機": {
    name: "裝可愛心機",
    icon: "💗",
    desc: "站著的女生傳授的可愛秘訣。",
    effect: "之後小頭目獎勵可以多選一件。",
    apply(player) {
      player.items.push("裝可愛心機");
      player.minibossRewardBonusPick = (player.minibossRewardBonusPick || 0) + 1;
    },
  },
  "訓犬寶典": {
    name: "訓犬寶典",
    icon: "📘",
    desc: "從CISDORO群組領悟的訓犬心得。",
    effect: "戰鬥刷新戀愛粉時，該戀愛粉會代替親親子承受一次傷害。",
    apply(player) {
      player.items.push("訓犬寶典");
    },
  },
  "三色豆水餃": {
    name: "三色豆水餃",
    icon: "🥟",
    desc: "味道微妙的三色豆水餃，決定留給觀眾吃。",
    effect: "戰鬥中使用，對 1 名敵方單位造成 20 點傷害。",
    usableInBattle: true,
    apply() {},
  },
};

const shopItems = {
  "美食名簿": {
    name: "美食名簿",
    rarity: "普通",
    category: "通用道具",
    icon: "📓",
    desc: "一本記載著許多食記的筆記本。",
    effect: "外出閒逛時如果無事發生則觸發探店，最大生命上限 +3，回復 3 點生命。",
    price: 2500,
    apply(player) {
      addPersistentItem(player, "美食名簿");
    },
  },
  "累累病藥水": {
    name: "累累病藥水",
    rarity: "精良",
    category: "通用道具",
    icon: "🧪",
    desc: "喝下去累累病就會發作，能馬上下播。",
    effect: "戰鬥中使用，名氣值 -5，該場戰鬥立刻結算。",
    price: 2000,
    usableInBattle: true,
    requiresTarget: false,
    apply() {},
  },
  "神秘資料夾": {
    name: "神秘資料夾",
    rarity: "史詩",
    category: "通用道具",
    icon: "💼",
    desc: "神秘的資料夾，裡面裝著許多人的黑料。",
    effect: "小頭目戰開打時讓小頭目失去 15% 最大血量。",
    price: 4000,
    apply(player) {
      addPersistentItem(player, "神秘資料夾");
    },
  },
  "可愛狗狗雕像": {
    name: "可愛狗狗雕像",
    rarity: "傳說",
    category: "通用道具",
    icon: "🐶",
    desc: "可愛狗狗雕像。",
    effect: "戰鬥中受到傷害減少 2，造成攻擊傷害增加 2，最大生命值上限 +2。",
    price: 6000,
    apply(player) {
      addPersistentItem(player, "可愛狗狗雕像");
      player.maxHp += 2;
      player.hp += 2;
    },
  },
  "手槍": {
    name: "手槍",
    rarity: "普通",
    category: "通用道具",
    icon: "🔫",
    desc: "一把手槍，裡面還有三發子彈。",
    effect: "戰鬥中使用，讓一名敵人意圖變成倒地。",
    price: 2000,
    usableInBattle: true,
    apply() {},
  },
  "加水祝福": {
    name: "加水祝福",
    rarity: "史詩",
    category: "通用道具",
    icon: "🌊",
    desc: "蕭證明的祝福。",
    effect: "獲得加水祝福。",
    price: 4500,
    apply(player) {
      player.storedBlessings ||= [];
      player.storedBlessings.push("加水祝福");
    },
  },
  "第二套V皮": {
    name: "第二套V皮",
    rarity: "精良",
    category: "通用道具",
    icon: "🎭",
    desc: "備用V皮，出事時可以重新開始？",
    effect: "戰鬥中被擊倒時滿生命值復活，但失去一半名氣值。",
    price: 5000,
    apply(player) {
      addPersistentItem(player, "第二套V皮");
    },
  },
  "波貝貝守護": {
    name: "波貝貝守護",
    rarity: "史詩",
    category: "親親子專屬道具",
    icon: "🎭",
    desc: "親親子好友的守護，戴上它不管何時都可以好好休息。",
    effect: "選擇精進自己時回復 5 點生命。",
    price: 4000,
    apply(player) {
      addPersistentItem(player, "波貝貝守護");
    },
  },
  "親親獸玩偶": {
    name: "親親獸玩偶",
    rarity: "傳說",
    category: "親親子專屬道具",
    icon: "🧸",
    desc: "親親子最愛的玩偶，不知道為什麼會出現在商店。",
    effect: "戰鬥開始時給予親親子 15 點防禦值。",
    price: 5000,
    apply(player) {
      addPersistentItem(player, "親親獸玩偶");
    },
  },
  "暴頭七星": {
    name: "暴頭七星",
    rarity: "普通",
    category: "親親子專屬道具",
    icon: "🚬",
    desc: "親親子最喜歡的口味。",
    effect: "戰鬥開始時抽取 1 張小菸牌到手中。",
    price: 3000,
    apply(player) {
      addPersistentItem(player, "暴頭七星");
    },
  },
  "露腳趾": {
    name: "露腳趾",
    rarity: "普通",
    category: "親親子專屬道具",
    icon: "🦶",
    desc: "不知道為什麼觀眾很喜歡....",
    effect: "戰鬥開始時給予隨機 1 名敵人 8 點魅惑。",
    price: 2500,
    apply(player) {
      addPersistentItem(player, "露腳趾");
    },
  },
  "玩具剪刀": {
    name: "玩具剪刀",
    rarity: "普通",
    category: "親親子專屬道具",
    icon: "✂",
    desc: "不鋒利的小剪刀。",
    effect: "戰鬥開始時生成 2 張小剪刀到親親子手牌中。",
    price: 2500,
    apply(player) {
      addPersistentItem(player, "玩具剪刀");
    },
  },
};

const shopItemPools = {
  common: ["美食名簿", "累累病藥水", "神秘資料夾", "可愛狗狗雕像", "手槍", "加水祝福", "第二套V皮"],
  chinchinko: ["波貝貝守護", "親親獸玩偶", "暴頭七星", "露腳趾", "玩具剪刀"],
};

const cards = {
  "剪剪": {
    name: "剪剪",
    cost: 1,
    type: "剪剪系",
    text: "對敵方單體造成 13 點攻擊傷害。",
    upgradeText: "對敵方單體造成 15 點攻擊傷害。",
    target: "enemy",
    play(target) {
      dealAttack(target, this.upgraded ? 15 : 13, "親親子");
    },
  },
  "我不知道誒": {
    name: "我不知道誒",
    cost: 1,
    type: "",
    text: "親親子獲得 7 點防禦。",
    upgradeText: "親親子獲得 9 點防禦。",
    target: "self",
    play() {
      state.battle.player.block += 7;
      log("親親子獲得 7 點防禦。");
    },
  },
  "最喜歡你了": {
    name: "最喜歡你了",
    cost: 0,
    type: "魅惑系",
    text: "給予 1 名敵方單位 6 魅惑。",
    upgradeText: "給予 1 名敵方單位 8 魅惑。",
    target: "enemy",
    play(target) {
      addCharm(target, this.upgraded ? 8 : 6);
    },
  },
  "小菸時間": {
    name: "小菸時間",
    cost: 1,
    type: "小菸系",
    text: "親親子回復 4 點生命。抽 1 張牌。",
    upgradeText: "親親子回復 6 點生命。抽 1 張牌。",
    target: "self",
    play() {
      heal(state.battle.player, this.upgraded ? 6 : 4);
      draw(1);
    },
  },
  "煙霧瀰漫": {
    name: "煙霧瀰漫",
    cost: 1,
    type: "小菸系",
    rarity: "普通",
    text: "親親子獲得 8 點防禦。本回合受到所有傷害減少 1。",
    upgradeText: "親親子獲得 8 點防禦。本回合受到所有傷害減少 2。",
    target: "self",
    play() {
      state.battle.player.block += 8;
      state.battle.player.damageReduction = Math.max(state.battle.player.damageReduction || 0, 1);
      log("親親子獲得 8 點防禦，本回合受到所有傷害減少 1。");
    },
  },
  "小剪刀": {
    name: "小剪刀",
    cost: 0,
    type: "剪剪系 / 衍生牌",
    text: "對敵方單體造成 6 點攻擊傷害。打出後消失。燒毀。凝滯。",
    target: "enemy",
    retain: true,
    exhaustForBattle: true,
    generated: true,
    play(target) {
      dealAttack(target, 6, "小剪刀");
    },
  },
  "透心涼茶": {
    name: "透心涼茶",
    cost: 0,
    type: "蕭證明支援卡",
    rarity: "普通",
    text: "淨化自身隨機 1 個負面效果。凝滯。燒毀。",
    target: "self",
    retain: true,
    exhaustForBattle: true,
    play() {
      cleanseRandomPlayerDebuff();
    },
  },
  "E樂饗宴": {
    name: "E樂饗宴",
    cost: 1,
    type: "蕭證明支援卡",
    rarity: "普通",
    text: "使敵方隨機單體意圖轉變為摀住耳朵。",
    target: "self",
    play() {
      const enemies = liveEnemyUnits();
      if (!enemies.length) return;
      const picked = sample(enemies);
      setEnemyIntent(picked, "coverEars", { persistNextTurn: true });
      log(`${picked.name} 的意圖轉變為摀住耳朵。`);
    },
  },
  "廣告國": {
    name: "廣告國",
    cost: 1,
    type: "蕭證明支援卡",
    rarity: "普通",
    text: "降低 1 名氣值，獲得 500 元。燒毀。",
    target: "self",
    exhaustForBattle: true,
    play() {
      state.player.fameValue = Math.max(0, (state.player.fameValue || 0) - 1);
      state.player.money += 500;
      log("廣告國：名氣值 -1，獲得 500 元。");
    },
  },
  "睡眠療法": {
    name: "睡眠療法",
    cost: 1,
    type: "蕭證明支援卡",
    rarity: "普通",
    text: "回復 7 點生命值。",
    target: "self",
    play() {
      heal(state.battle.player, 7);
    },
  },
  "雀潮狂湧": {
    name: "雀潮狂湧",
    cost: 0,
    type: "蕭證明支援卡",
    rarity: "精良",
    text: "獲得 2 點能量。燒毀。",
    target: "self",
    exhaustForBattle: true,
    play() {
      state.battle.energy += 2;
      log("雀潮狂湧：獲得 2 點能量。");
    },
  },
  "賊仙一生囂": {
    name: "賊仙一生囂",
    cost: 1,
    type: "蕭證明支援卡",
    rarity: "精良",
    text: "對敵方單體造成 6 點攻擊傷害。從棄牌堆選取 1 張牌加入手牌，該牌本回合耗能 -1。",
    target: "enemy",
    play(target) {
      dealAttack(target, 6, "親親子");
      const b = state.battle;
      if (!b.discard.length) {
        log("棄牌堆目前沒有可選擇的牌。");
        return;
      }
      b.deckChoice = {
        title: "賊仙一生囂",
        message: "選擇棄牌堆中的 1 張牌加入手牌，該牌本回合耗能 -1。",
        pile: "discard",
        costModifier: -1,
      };
    },
  },
  "嚴厲斥責": {
    name: "嚴厲斥責",
    cost: 0,
    type: "蕭證明支援卡",
    rarity: "精良",
    text: "使 1 名敵方單位降低 10 攻擊力一回合。燒毀。",
    target: "enemy",
    exhaustForBattle: true,
    play(target) {
      addAttackDown(target, 10);
      log(`${target.name} 攻擊力降低 10。`);
    },
  },
  "消費天才": {
    name: "消費天才",
    cost: 1,
    type: "蕭證明支援卡 / 增益牌",
    rarity: "史詩",
    text: "每回合第一次造成攻擊傷害時，獲得造成傷害量 ×50 的金錢。燒毀。",
    target: "self",
    exhaustForBattle: true,
    play() {
      state.battle.powers.consumptionGenius = true;
      state.battle.consumptionGeniusUsed = false;
      log("獲得增益：消費天才。");
    },
  },
  "親親幫支援": {
    name: "親親幫支援",
    cost: 2,
    type: "蕭證明支援卡",
    rarity: "史詩",
    text: "使 1 名敵方單位轉生為帶有親親幫特性的單位。燒毀。",
    target: "enemy",
    exhaustForBattle: true,
    play(target) {
      transformEnemyToKissSupport(target);
    },
  },
  "神剪武具": {
    name: "神剪武具",
    cost: 3,
    type: "蕭證明支援卡",
    rarity: "傳說",
    text: "使 1 名敵方單位失去一半生命值。必有。燒毀。",
    target: "enemy",
    mustDraw: true,
    exhaustForBattle: true,
    play(target) {
      const loss = Math.floor(target.hp / 2);
      target.hp = Math.max(0, target.hp - loss);
      log(`${target.name} 失去 ${loss} 點生命。`);
      checkCharmExecute(target);
      if (target.hp <= 0) handleUnitDefeated(target);
    },
  },
  "可愛吉娃": {
    name: "可愛吉娃",
    cost: 1,
    type: "",
    rarity: "event",
    text: "將場上所有敵方意圖改成摀住耳朵。燒毀。",
    target: "self",
    exhaustForBattle: true,
    play() {
      liveEnemyUnits().forEach((enemy) => {
        setEnemyIntent(enemy, "coverEars", { persistNextTurn: true });
      });
      log("所有敵方意圖改成摀住耳朵。");
    },
  },
  "有放就會來": {
    name: "有放就會來",
    cost: 0,
    type: "",
    rarity: "event",
    text: "從牌庫選擇 1 張牌加入手牌。凝滯。燒毀。",
    target: "self",
    retain: true,
    exhaustForBattle: true,
    play() {
      const b = state.battle;
      if (!b.deck.length) {
        log("牌庫目前沒有可選擇的牌。");
        return;
      }
      b.deckChoice = {
        title: "有放就會來",
        message: "選擇牌庫中的 1 張牌加入手牌。",
      };
      log("有放就會來：選擇牌庫中的 1 張牌加入手牌。");
    },
  },
  "踢破骨灰罈": {
    name: "踢破骨灰罈",
    cost: 0,
    type: "",
    rarity: "event",
    text: "對敵方單體造成 12 點攻擊傷害。",
    target: "enemy",
    play(target) {
      dealAttack(target, 12, "親親子");
    },
  },
  "比人生": {
    name: "比人生",
    cost: 1,
    type: "",
    rarity: "event",
    text: "擊敗 1 名當前生命值低於你的普通敵方單位。燒毀。",
    target: "enemy",
    exhaustForBattle: true,
    play(target) {
      const b = state.battle;
      if (!target || target.side !== "enemy" || target.isMiniboss || target.kind === "boss" || target.hp >= b.player.hp) {
        log("比人生沒有成功。");
        return;
      }
      target.hp = 0;
      handleUnitDefeated(target);
      log(`比人生擊敗了 ${target.name}。`);
    },
  },
  "一刀兩斷": {
    name: "一刀兩斷",
    cost: 1,
    type: "剪剪系",
    rarity: "普通",
    text: "對敵方單體造成 12 點攻擊傷害，生成 1 張小剪刀。",
    upgradeText: "對敵方單體造成 14 點攻擊傷害，生成 1 張小剪刀。",
    target: "enemy",
    play(target) {
      dealAttack(target, this.upgraded ? 14 : 12, "親親子");
      addToHand("小剪刀");
    },
  },
  "讓我來親你們一下": {
    name: "讓我來親你們一下",
    cost: 1,
    type: "魅惑系",
    rarity: "普通",
    text: "給予敵方全體 3 點魅惑，並依據各敵方單位身上魅惑累積量減少等額攻擊一回合。",
    upgradeText: "給予敵方全體 4 點魅惑，並依據各敵方單位身上魅惑累積量減少等額攻擊一回合。",
    target: "self",
    play() {
      liveEnemyUnits().forEach((unit) => {
        addCharm(unit, this.upgraded ? 4 : 3);
        if (unit.hp <= 0) return;
        const loss = unit.charm || 0;
        addAttackDown(unit, loss);
        log(`${unit.name} 因魅惑攻擊力 -${loss}。`);
      });
    },
  },
  "煙切": {
    name: "煙切",
    cost: 2,
    type: "小菸系 + 剪剪系",
    rarity: "普通",
    text: "對敵方單體造成 7 點攻擊傷害，讓該單位本回合無法造成傷害。",
    upgradeText: "耗能 1。對敵方單體造成 7 點攻擊傷害，讓該單位本回合無法造成傷害。",
    target: "enemy",
    play(target) {
      dealAttack(target, 7, "親親子");
      if (kutaVoiceNegatesDebuff(target, "無法造成傷害")) return;
      target.noAttack = true;
      target.noCounter = true;
      target.noDamage = true;
      log(`${target.name} 本回合無法造成傷害。`);
    },
  },
  "私訊": {
    name: "私訊",
    cost: 2,
    type: "魅惑系",
    rarity: "普通",
    text: "給予敵方單體 18 魅惑。",
    upgradeText: "給予敵方單體 25 魅惑。",
    target: "enemy",
    play(target) {
      addCharm(target, this.upgraded ? 25 : 18);
    },
  },
  "人家想要這個": {
    name: "人家想要這個",
    cost: 1,
    type: "魅惑系",
    rarity: "普通",
    text: "給予我方單體 7 層幹勁，並使該單位失去等額生命。升級：9 層幹勁。",
    target: "ally",
    play(target) {
      addMotivation(target, 7);
      damage(target, 7);
    },
  },
  "狂風暴剪": {
    name: "狂風暴剪",
    cost: 1,
    type: "剪剪系",
    rarity: "普通",
    text: "打出此牌後，本回合每造成 1 次攻擊傷害，生成 1 張小剪刀到親親子手牌中。",
    upgradeText: "耗能 0。打出此牌後，本回合每造成 1 次攻擊傷害，生成 1 張小剪刀到親親子手牌中。",
    target: "self",
    play() {
      state.battle.scissorStorm = true;
      log("本回合每次攻擊傷害都會生成小剪刀。");
    },
  },
  "剪到錢": {
    name: "剪到錢",
    cost: 1,
    type: "剪剪系",
    rarity: "普通",
    text: "對敵方單體造成 10 點攻擊傷害。若擊敗目標獲得 300 元。",
    upgradeText: "對敵方單體造成 13 點攻擊傷害。若擊敗目標獲得 500 元。",
    target: "enemy",
    play(target) {
      const before = target.hp;
      dealAttack(target, this.upgraded ? 13 : 10, "親親子");
      if (before > 0 && target.hp <= 0) {
        const reward = this.upgraded ? 500 : 300;
        state.player.money += reward;
        log(`剪到錢觸發，獲得 ${reward} 元。`);
      }
    },
  },
  "我的刀盾": {
    name: "我的刀盾",
    cost: 2,
    type: "剪剪系 / 增益牌",
    rarity: "普通",
    text: "本場戰鬥每當打出剪剪系牌，獲得 3 點防禦。燒毀。",
    upgradeText: "本場戰鬥每當打出剪剪系牌，獲得 5 點防禦。燒毀。",
    target: "self",
    exhaustForBattle: true,
    play() {
      state.battle.powers.knifeShield = 3;
      log("獲得增益：我的刀盾。");
    },
  },
  "最愛大家了": {
    name: "最愛大家了",
    cost: 2,
    type: "魅惑系",
    rarity: "精良",
    text: "給予敵方全體 7 點魅惑，並依據敵方全體身上魅惑累積量 / 10 回復生命。",
    upgradeText: "給予敵方全體 9 點魅惑，並依據敵方全體身上魅惑累積量 / 10 回復生命。",
    target: "self",
    play() {
      const enemies = liveEnemyUnits();
      enemies.forEach((unit) => addCharm(unit, 7));
      const totalCharm = enemies.reduce((sum, unit) => sum + (unit.charm || 0), 0);
      heal(state.battle.player, Math.round(totalCharm / 10));
    },
  },
  "暈頭轉向": {
    name: "暈頭轉向",
    cost: 1,
    type: "魅惑系",
    rarity: "精良",
    text: "使 1 名敵方單位變更意圖為暈船。",
    upgradeText: "使 1 名敵方單位變更意圖為暈船，不會選到親親子。",
    target: "enemy",
    play(target) {
      setEnemyIntent(target, "seasick", { persistNextTurn: true, seasickNoPlayer: Boolean(this.upgraded) });
      log(`${target.name} 的意圖變更為暈船。`);
    },
  },
  "我的小妞妞": {
    name: "我的小妞妞",
    cost: 2,
    type: "魅惑系",
    rarity: "精良",
    text: "給予敵方全體 16 層魅惑。此牌本場戰鬥每打出 1 次減少 4 魅惑。",
    upgradeText: "給予敵方全體 20 層魅惑。此牌本場戰鬥每打出 1 次減少 4 魅惑。",
    target: "self",
    play() {
      const used = state.battle.myGirlUses || 0;
      const amount = Math.max(0, (this.upgraded ? 20 : 16) - used * 4);
      state.battle.myGirlUses = used + 1;
      liveEnemyUnits().forEach((unit) => addCharm(unit, amount));
    },
  },
  "檔一根": {
    name: "檔一根",
    cost: 1,
    type: "小菸系",
    rarity: "普通",
    text: "親親子回復 5 點生命。若本回合已打出小菸系牌，抽 1 張牌。",
    upgradeText: "親親子回復 7 點生命。若本回合已打出小菸系牌，抽 1 張牌。",
    target: "self",
    play() {
      heal(state.battle.player, 5);
      if (state.battle.playedTags?.includes("小菸系")) draw(1);
    },
  },
  "你不是還有生命嗎": {
    name: "你不是還有生命嗎",
    cost: 3,
    type: "魅惑系 / 增益牌",
    rarity: "傳說",
    text: "本場戰鬥當給予敵方魅惑值時，敵方失去同等生命，親親子回復同等生命。燒毀。",
    upgradeText: "開場會抽到手中。本場戰鬥當給予敵方魅惑值時，敵方失去同等生命，親親子回復同等生命。燒毀。",
    target: "self",
    exhaustForBattle: true,
    play() {
      state.battle.powers.lifeCharm = true;
      log("獲得增益：你不是還有生命嗎。");
    },
  },
  "磨利": {
    name: "磨利",
    cost: 1,
    type: "剪剪系",
    rarity: "精良",
    text: "下次攻擊牌造成的傷害增加 6。",
    upgradeText: "下次攻擊牌造成的傷害增加 8。",
    target: "self",
    play() {
      const amount = this.upgraded ? 8 : 6;
      state.battle.attackDamageBonus = (state.battle.attackDamageBonus || 0) + amount;
      log(`下次攻擊牌造成的傷害 +${amount}。`);
    },
  },
  "刀刃亂舞": {
    name: "刀刃亂舞",
    cost: 1,
    type: "剪剪系",
    rarity: "精良",
    text: "對敵方全體造成 1 點攻擊傷害。每對 1 名敵方單位造成傷害，獲得 1 張小剪刀。",
    upgradeText: "對敵方全體造成 3 點攻擊傷害。每對 1 名敵方單位造成傷害，獲得 1 張小剪刀。",
    target: "self",
    play() {
      const enemies = liveEnemyUnits();
      const amount = this.upgraded ? 3 : 1;
      enemies.forEach((enemy) => {
        const dealt = dealAttack(enemy, amount, "親親子");
        if (dealt > 0) addToHand("小剪刀");
      });
    },
  },
  "借火一下": {
    name: "借火一下",
    cost: 0,
    type: "小菸系",
    rarity: "普通",
    text: "親親子失去 4 點生命，獲得 2 點能量。",
    upgradeText: "親親子失去 2 點生命，獲得 2 點能量。",
    target: "self",
    play() {
      damage(state.battle.player, 4);
      state.battle.energy += 2;
      log("親親子獲得 2 點能量。");
    },
  },
  "再來一根": {
    name: "再來一根",
    cost: 1,
    type: "小菸系",
    rarity: "普通",
    text: "親親子失去 2 點生命，抽 1 張牌。如果本回合打出過小菸系卡牌，耗能 -1。",
    upgradeText: "親親子失去 1 點生命，抽 1 張牌。如果本回合打出過小菸系卡牌，耗能 -1。",
    target: "self",
    play() {
      damage(state.battle.player, 2);
      draw(1);
    },
  },
  "吐煙圈": {
    name: "吐煙圈",
    cost: 1,
    type: "小菸系 + 魅惑系",
    rarity: "普通",
    text: "給予敵方單體 3 點魅惑，抽 1 張牌。本回合先前打出過小菸系與魅惑系，耗能 -1。",
    upgradeText: "給予敵方單體 5 點魅惑，抽 1 張牌。本回合先前打出過小菸系與魅惑系，耗能 -1。",
    target: "enemy",
    play(target) {
      addCharm(target, this.upgraded ? 5 : 3);
      draw(1);
    },
  },
  "愛的傳教士": {
    name: "愛的傳教士",
    cost: 2,
    type: "魅惑系",
    rarity: "普通",
    text: "給予敵方單體 15 點魅惑，並給予負面效果：當該敵方單位被魅惑擊敗時，傳播該單位魅惑累積量到其他敵方 1 名單位。",
    upgradeText: "耗能 1。給予敵方單體 15 點魅惑，並給予負面效果：當該敵方單位被魅惑擊敗時，傳播該單位魅惑累積量到其他敵方 1 名單位。",
    target: "enemy",
    play(target) {
      addCharm(target, 15);
      target.lovePreacherMark = true;
      state.battle.powers.lovePreacher = true;
      log(`${target.name} 被愛的傳教士標記。`);
    },
  },
  "隨手亂剪": {
    name: "隨手亂剪",
    cost: 0,
    type: "剪剪系",
    rarity: "精良",
    text: "對隨機單位造成 3 點攻擊傷害 3 次。目標包含己方。",
    upgradeText: "對隨機單位造成 3 點攻擊傷害 4 次。目標包含己方。",
    randomTargetCard: true,
    target: "self",
    play(target) {
      for (let i = 0; i < (this.upgraded ? 4 : 3); i += 1) {
        if (this.blessing === "暴雪祝福" && target?.hp > 0) {
          dealAttack(target, 3, "隨手亂剪");
        } else {
          const targets = [state.battle.player, ...state.battle.allies, ...state.battle.enemies].filter((unit) => unit.hp > 0);
          if (!targets.length) return;
          dealAttack(sample(targets), 3, "隨手亂剪");
        }
      }
    },
  },
  "擦邊主播": {
    name: "擦邊主播",
    cost: 1,
    type: "魅惑系 / 增益牌",
    rarity: "普通",
    text: "本場戰鬥魅惑系卡牌給予敵方單位的魅惑量 +1。燒毀。",
    upgradeText: "本場戰鬥魅惑系卡牌給予敵方單位的魅惑量 +2。燒毀。",
    target: "self",
    exhaustForBattle: true,
    play() {
      state.battle.powers.charmBonus = 1;
      log("獲得增益：擦邊主播，魅惑量 +1。");
    },
  },
  "斗內費": {
    name: "斗內費",
    cost: 1,
    type: "魅惑系 / 增益牌",
    rarity: "史詩",
    text: "親親子打倒敵方單位時，依據該單位身上魅惑累積量，獲得魅惑累積量 ×10 的金錢。燒毀。",
    upgradeText: "耗能 0。親親子打倒敵方單位時，依據該單位身上魅惑累積量，獲得魅惑累積量 ×10 的金錢。燒毀。",
    target: "self",
    exhaustForBattle: true,
    play() {
      state.battle.powers.donationFee = true;
      log("獲得增益：斗內費。");
    },
  },
  "劍刃風暴": {
    name: "劍刃風暴",
    cost: 1,
    type: "剪剪系 / 增益牌",
    rarity: "史詩",
    text: "當打出剪剪系卡牌時，獲得 1 張小剪刀。燒毀。",
    upgradeText: "開場會抽到手中。必有。當打出剪剪系卡牌時，獲得 1 張小剪刀。燒毀。",
    target: "self",
    exhaustForBattle: true,
    play() {
      state.battle.powers.bladeStorm = true;
      log("獲得增益：劍刃風暴。");
    },
  },
  "剪愛": {
    name: "剪愛",
    cost: 1,
    type: "魅惑系 + 剪剪系",
    rarity: "普通",
    text: "對隨機敵方單位造成 2 次 3 點攻擊傷害以及 2 魅惑。",
    upgradeText: "對隨機敵方單位造成 3 次 3 點攻擊傷害以及 2 魅惑。",
    randomTargetCard: true,
    target: "self",
    play(target) {
      for (let i = 0; i < 2; i += 1) {
        const targets = liveEnemyUnits();
        if (!targets.length) return;
        const picked = this.blessing === "暴雪祝福" && target?.hp > 0 ? target : sample(targets);
        dealAttack(picked, 3, "剪愛");
        addCharm(picked, 2);
      }
    },
  },
  "煙霧屏障": {
    name: "煙霧屏障",
    cost: 1,
    type: "小菸系",
    rarity: "精良",
    text: "親親子失去 6 點生命。敵方目前場上單位無法攻擊。",
    upgradeText: "親親子失去 4 點生命。敵方目前場上單位無法攻擊。",
    target: "self",
    play() {
      damage(state.battle.player, 6);
      liveEnemyUnits().forEach((unit) => {
        if (kutaVoiceNegatesDebuff(unit, "無法攻擊")) return;
        unit.noAttack = true;
      });
      log("敵方目前場上單位本回合無法攻擊。");
    },
  },
  "菸捐": {
    name: "菸捐",
    cost: 2,
    type: "小菸系",
    rarity: "精良",
    text: "本回合打出小菸牌後回復 1 能量，同時損失 200 元。",
    target: "self",
    play() {
      state.battle.powers.smokeTax = true;
      log("本回合打出小菸牌後回復 1 能量，但會損失 200 元。");
    },
  },
  "二手菸": {
    name: "二手菸",
    cost: 1,
    type: "小菸系 + 魅惑系",
    rarity: "精良",
    text: "下次當小菸牌使親親子失去血量時，給予隨機 1 名敵方單位親親子失去血量的魅惑值。",
    upgradeText: "下兩次當小菸牌使親親子失去血量時，給予隨機 1 名敵方單位親親子失去血量的魅惑值。",
    target: "self",
    play() {
      state.battle.smokeCharmTriggers = (state.battle.smokeCharmTriggers || 0) + 1;
      log("下次小菸失血會轉為隨機對手魅惑。");
    },
  },
  "紙片人殺手": {
    name: "紙片人殺手",
    cost: 2,
    type: "剪剪系 + 魅惑系",
    rarity: "精良",
    text: "對敵方單體造成 8 點攻擊傷害。目標每有 2 點魅惑，額外造成 1 點攻擊傷害。",
    upgradeText: "對敵方單體造成 8 點攻擊傷害。目標每有 2 點魅惑，額外造成 2 點攻擊傷害。",
    target: "enemy",
    play(target) {
      dealAttack(target, 8 + Math.floor((target.charm || 0) / 2), "親親子");
    },
  },
  "肺活量訓練": {
    name: "肺活量訓練",
    cost: 1,
    type: "小菸系",
    rarity: "精良",
    text: "親親子失去 5 點生命。本場戰鬥能量上限 +1。",
    upgradeText: "親親子失去 5 點生命。本場戰鬥能量上限 +1。必有。",
    target: "self",
    exhaustForBattle: true,
    play() {
      damage(state.battle.player, 5);
      state.battle.maxEnergy += 1;
      state.battle.energy += 1;
      log("本場戰鬥能量上限 +1。");
    },
  },
  "尼古丁爆發": {
    name: "尼古丁爆發",
    cost: 0,
    type: "小菸系",
    rarity: "史詩",
    text: "親親子失去 8 點生命。下一張卡牌重複打出兩次。",
    upgradeText: "親親子失去 6 點生命。下一張卡牌重複打出兩次。",
    target: "self",
    play() {
      damage(state.battle.player, 8);
      state.battle.repeatNextCard = 2;
      log("下一張卡牌會重複打出兩次。");
    },
  },
  "這根給你": {
    name: "這根給你",
    cost: 2,
    type: "小菸系 + 魅惑系 / 增益牌",
    rarity: "史詩",
    text: "當小菸系卡片使親親子失去血量時，改成使隨機敵方單位失去同等生命。燒毀。",
    upgradeText: "耗能 1。當小菸系卡片使親親子失去血量時，改成使隨機敵方單位失去同等生命。燒毀。",
    target: "self",
    exhaustForBattle: true,
    play() {
      state.battle.powers.giveYouSmoke = true;
      log("獲得增益：這根給你。");
    },
  },
  "煙灰缸格檔": {
    name: "煙灰缸格檔",
    cost: 1,
    type: "小菸系 + 剪剪系",
    rarity: "史詩",
    text: "本回合敵方全體攻擊傷害 -4。親親子每受到 1 次敵方攻擊，在手牌中加入 1 張小剪刀。",
    upgradeText: "本回合敵方全體攻擊傷害 -5。親親子每受到 1 次敵方攻擊，在手牌中加入 1 張小剪刀。",
    target: "self",
    play() {
      const amount = this.upgraded ? 5 : 4;
      state.battle.enemyDamageReduction = Math.max(state.battle.enemyDamageReduction || 0, amount);
      state.battle.powers.ashtrayBlock = true;
      log(`本回合敵方攻擊傷害 -${amount}，受到敵方攻擊時生成小剪刀。`);
    },
  },
  "煙中剪影": {
    name: "煙中剪影",
    cost: 3,
    type: "小菸系 + 剪剪系",
    rarity: "精良",
    text: "對敵方單體造成 13 點攻擊傷害 2 次，並生成 2 張小剪刀。本回合若打出過小菸系牌，耗能 -1。",
    upgradeText: "耗能 2。對敵方單體造成 13 點攻擊傷害 2 次，並生成 2 張小剪刀。本回合若打出過小菸系牌，耗能 -1。",
    target: "enemy",
    play(target) {
      dealAttack(target, 13, "煙中剪影");
      if (target.hp > 0) dealAttack(target, 13, "煙中剪影");
      addToHand("小剪刀");
      addToHand("小剪刀");
    },
  },
  "放鬆時光": {
    name: "放鬆時光",
    cost: 0,
    type: "小菸系",
    rarity: "史詩",
    text: "親親子獲得 1 點生命上限，回復 1 點生命，抽 1 張牌。",
    upgradeText: "親親子獲得 2 點生命上限，回復 2 點生命，抽 2 張牌。",
    target: "self",
    play() {
      state.player.maxHp += 1;
      state.battle.player.maxHp += 1;
      heal(state.battle.player, 1);
      draw(1);
    },
  },
  "一瞬V殺": {
    name: "一瞬V殺",
    cost: 2,
    type: "剪剪系",
    rarity: "傳說",
    text: "對敵方單體打出本場戰鬥你打出過的小剪刀。打出後消失。",
    upgradeText: "對敵方單體打出本場戰鬥你打出過的小剪刀。打出後不再消失。",
    target: "enemy",
    exhaustForBattle: true,
    play(target) {
      const count = state.battle.playedSmallScissors || 0;
      for (let i = 0; i < count; i += 1) {
        if (target.hp > 0) dealAttack(target, 3, "一瞬V殺");
      }
    },
  },
  "歐歐歐愛": {
    name: "歐歐歐愛",
    cost: 2,
    type: "魅惑系 + 剪剪系 / 增益牌",
    rarity: "傳說",
    text: "本場戰鬥當對敵方單位造成魅惑時，生成 1 張小剪刀到親親子手中。燒毀。",
    upgradeText: "耗能 1。本場戰鬥當對敵方單位造成魅惑時，生成 1 張小剪刀到親親子手中。燒毀。",
    target: "self",
    exhaustForBattle: true,
    play() {
      state.battle.powers.oooLove = true;
      log("獲得增益：歐歐歐愛。");
    },
  },
  "事後菸": {
    name: "事後菸",
    cost: 1,
    type: "小菸系 + 魅惑系",
    rarity: "傳說",
    text: "選擇 1 名敵方單位減少 15 點魅惑。親親子本回合無法受到敵方傷害。打出本卡後結束此回合。",
    upgradeText: "選擇 1 名敵方單位減少 10 點魅惑。親親子本回合無法受到敵方傷害。打出本卡後結束此回合。",
    target: "enemy",
    play(target) {
      target.charm = Math.max(0, (target.charm || 0) - 15);
      state.battle.playerImmuneToEnemyDamage = true;
      state.battle.endTurnAfterCard = true;
      log(`${target.name} 魅惑減少 15。親親子本回合無法受到敵方傷害。`);
    },
  },
  "菸花燙燙燙": {
    name: "菸花燙燙燙",
    cost: 1,
    type: "小菸系 + 剪剪系",
    rarity: "傳說",
    text: "親親子失去 4 點生命。對敵方單體造成 10 點攻擊傷害。本回合打出此牌前每打出過 1 張小菸系牌，生成 1 張小剪刀。",
    upgradeText: "親親子失去 4 點生命。對敵方單體造成 15 點攻擊傷害。本回合打出此牌前每打出過 1 張小菸系牌，生成 1 張小剪刀。",
    target: "enemy",
    play(target) {
      const smokeCount = (state.battle.playedTags || []).filter((tag) => tag === "小菸系").length;
      damage(state.battle.player, 4);
      dealAttack(target, 10, "菸花燙燙燙");
      for (let i = 0; i < smokeCount; i += 1) addToHand("小剪刀");
    },
  },
  "華麗殞落": {
    name: "華麗殞落",
    cost: 2,
    type: "小菸系 + 魅惑系 + 剪剪系",
    rarity: "傳說",
    text: "親親子失去 5 點生命。對敵方單體造成 20 點攻擊傷害，並給予該單位 15 魅惑。若此牌觸發魅惑擊敗，抽 1 張牌。",
    upgradeText: "親親子失去 5 點生命。對敵方單體造成 20 點攻擊傷害，並給予該單位 15 魅惑。若此牌觸發魅惑擊敗，抽 2 張牌。",
    target: "enemy",
    play(target) {
      damage(state.battle.player, 5);
      dealAttack(target, 20, "華麗殞落");
      if (target.hp <= 0) return;
      if (addCharm(target, 15)) draw(1);
    },
  },
  "晚安啾啾": {
    name: "晚安啾啾",
    cost: 2,
    type: "魅惑系",
    rarity: "史詩",
    text: "給予敵方單體 20 魅惑。目標身上每有 5 點魅惑，額外給予 1 魅惑。",
    upgradeText: "耗能 1。給予敵方單體 20 魅惑。目標身上每有 5 點魅惑，額外給予 1 魅惑。",
    target: "enemy",
    exhaustForBattle: true,
    play(target) {
      const bonus = Math.floor((target.charm || 0) / 5);
      addCharm(target, 20 + bonus);
    },
  },
  "VT都是騙錢的!": {
    name: "VT都是騙錢的!",
    cost: 2,
    type: "魅惑系 + 剪剪系",
    rarity: "史詩",
    text: "使敵方單體失去所有魅惑值，下次攻擊牌會附加等額傷害。",
    upgradeText: "耗能 1。使敵方單體失去所有魅惑值，下次攻擊牌會附加等額傷害。",
    target: "enemy",
    play(target) {
      const charm = target.charm || 0;
      target.charm = 0;
      state.battle.nextCardDamageBonus = (state.battle.nextCardDamageBonus || 0) + Math.round(charm);
      log(`${target.name} 失去 ${charm} 魅惑，下次攻擊牌附加 ${Math.round(charm)} 傷害。`);
    },
  },
  "DJ小婷不要停": {
    name: "DJ小婷不要停",
    cost: 0,
    type: "小菸系",
    rarity: "傳說",
    text: "親親子失去 8 點生命。抽牌直到手牌上限。",
    upgradeText: "親親子失去 6 點生命。抽牌直到手牌上限。",
    target: "self",
    play() {
      damage(state.battle.player, 8);
      draw(Math.max(0, (state.battle.handLimit || 10) - state.battle.hand.length));
    },
  },
  "奪命剪刀": {
    name: "奪命剪刀",
    cost: 1,
    type: "剪剪系",
    rarity: "史詩",
    text: "對敵方單體造成 15 點攻擊傷害。此卡牌命中敵方單位時，親親子獲得 3 點生命上限。",
    upgradeText: "對敵方單體造成 18 點攻擊傷害。此卡牌命中敵方單位時，親親子獲得 3 點生命上限。",
    target: "enemy",
    play(target) {
      dealAttack(target, 15, "親親子");
      if (target.side === "enemy") {
        state.player.maxHp += 3;
        state.battle.player.maxHp += 3;
        state.battle.player.hp += 3;
        log("奪命剪刀命中，親親子生命上限 +3。");
      }
    },
  },
};

function rand(max) {
  return Math.floor(Math.random() * max);
}

function sample(arr) {
  return arr[rand(arr.length)];
}

function randBetween(min, max) {
  return min + rand(max - min + 1);
}

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = rand(i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function makeCard(name) {
  return { ...cards[name], id: crypto.randomUUID() };
}

function isBattleExhaustCard(card) {
  return card.exhaustForBattle || card.type.includes("增益牌");
}

const starterDeckNames = [
  "剪剪",
  "剪剪",
  "剪剪",
  "剪剪",
  "我不知道誒",
  "我不知道誒",
  "我不知道誒",
  "我不知道誒",
  "最喜歡你了",
  "小菸時間",
];

const cardPools = {
  normal: ["一刀兩斷", "狂風暴剪", "剪到錢", "我的刀盾", "讓我來親你們一下", "私訊", "愛的傳教士", "擦邊主播", "煙霧瀰漫", "再來一根", "借火一下", "檔一根", "煙切", "吐煙圈", "剪愛"],
  rare: ["隨手亂剪", "刀刃亂舞", "磨利", "暈頭轉向", "最愛大家了", "我的小妞妞", "煙霧屏障", "菸捐", "肺活量訓練", "紙片人殺手", "煙中剪影", "二手菸"],
  epic: ["奪命剪刀", "劍刃風暴", "晚安啾啾", "斗內費", "尼古丁爆發", "放鬆時光", "VT都是騙錢的!", "這根給你", "煙灰缸格檔"],
  legendary: ["你不是還有生命嗎", "一瞬V殺", "DJ小婷不要停", "歐歐歐愛", "事後菸", "菸花燙燙燙", "華麗殞落"],
};

const mentorSupportCardPools = {
  normal: ["透心涼茶", "E樂饗宴", "廣告國", "睡眠療法"],
  rare: ["雀潮狂湧", "賊仙一生囂", "嚴厲斥責"],
  epic: ["消費天才", "親親幫支援"],
  legendary: ["神剪武具"],
};

function currentFameLevel(player = state.player) {
  const baseLevel = baseFameLevel(player);
  const hasT1v = Boolean(player?.cardRewardBonus);
  const effectiveLevel = hasT1v && baseLevel >= 5 ? 6 : baseLevel;
  return fameLevels[Math.max(0, Math.min(effectiveLevel, fameLevels.length - 1))];
}

function baseFameLevel(player = state.player) {
  const fame = player?.fameValue || 0;
  return fameThresholds.find((range) => fame >= range.min && fame <= range.max)?.level || 0;
}

function effectiveFameLevel(player = state.player) {
  return currentFameLevel(player).level;
}

function addFameValue(amount, player = state.player) {
  if (!player || amount <= 0) return 0;
  player.fameValue = (player.fameValue || 0) + amount;
  return amount;
}

function passesFameCheck(requiredLevel, player = state.player) {
  return baseFameLevel(player) >= requiredLevel;
}

function triggerGraduationCheck(checkId) {
  const check = graduationChecks.find((entry) => entry.id === checkId);
  if (!check || passesFameCheck(check.requiredLevel)) return false;
  state.graduation = {
    check,
    fameValue: state.player.fameValue || 0,
    fameName: currentFameLevel().name,
    stage: "dismissal",
  };
  state.screen = "graduation";
  state.battle = null;
  render();
  return true;
}

function currentRouteIndex() {
  if (Number.isInteger(state.player?.routeIndex)) return state.player.routeIndex;
  const battleIndex = state.player?.battleIndex || 1;
  const index = runRoute.findIndex((node) => node.battleIndex === battleIndex);
  return index >= 0 ? index : 0;
}

function enterRouteNode(node) {
  if (!node) {
    state.screen = "rebuild";
    state.routeNotice = { label: "目前內容結束", description: "後續區域與最終 BOSS 之後繼續製作。" };
    render();
    return;
  }
  if (node.checkId && triggerGraduationCheck(node.checkId)) return;
  state.routeNotice = null;
  if (node.type === "smallBattle" || node.type === "tutorial") {
    state.player.battleIndex = node.battleIndex;
    startBattle([], { type: node.type });
    return;
  }
  if (node.type === "miniboss") {
    state.player.battleIndex = node.battleIndex || state.player.battleIndex;
    if (node.id === "miniboss1" && !state.player.miniboss1PreludeSeen) {
      state.player.miniboss1PreludeSeen = true;
      state.pendingRouteNode = node;
      state.minibossPreludeStep = 0;
      state.screen = "minibossPrelude";
      render();
      return;
    }
    startBattle([], { type: "miniboss" });
    return;
  }
  if (node.type === "shop") {
    if (node.id === "shop1" && !state.player.minibossStorySeen) {
      state.player.minibossStorySeen = true;
      state.player.selectedMiniboss1 = "kuta";
      state.pendingShopNode = node;
      state.screen = "shopIntroStory";
      render();
      return;
    }
    state.shopStock = generateShopStock();
    state.screen = "shop";
    render();
    return;
  }
  state.screen = "rebuild";
  state.routeNotice = {
    label: node.label,
    description: node.type === "shop"
      ? "這裡會進入蕭證明商店。商店內容之後補上。"
      : "這個節點的內容之後補上。",
  };
  render();
}

function advanceRunRoute() {
  if (!state.player) return;
  const nextIndex = currentRouteIndex() + 1;
  state.player.routeIndex = nextIndex;
  enterRouteNode(runRoute[nextIndex]);
}

function rollRarityForFame(fameLevel = effectiveFameLevel()) {
  const rates = fameLevels[Math.max(0, Math.min(fameLevel, fameLevels.length - 1))].rates;
  return rollRarityFromRates(rates);
}

function generateShopStock() {
  const usedCards = new Set();
  const usedItems = new Set();
  return {
    cards: Array.from({ length: 5 }, () => generateShopCardOffer(usedCards)),
    items: Array.from({ length: 5 }, () => generateShopItemOffer(usedItems)),
    usedRemove: false,
    usedBackpack: false,
  };
}

function generateShopCardOffer(usedCards = new Set()) {
  const rarity = rollRarityForFame();
  const pool = [...(cardPools[rarity] || []), ...(mentorSupportCardPools[rarity] || [])];
  const fallback = [...Object.values(cardPools).flat(), ...Object.values(mentorSupportCardPools).flat()];
  const candidates = (pool.length ? pool : fallback).filter((name) => !usedCards.has(name));
  const name = sample(candidates.length ? candidates : fallback);
  usedCards.add(name);
  const rarityKey = cardRarityKey(name, rarity);
  return { type: "card", name, rarity: rarityKey, price: rollShopCardPrice(rarityKey), sold: false };
}

function generateShopItemOffer(usedItems = new Set()) {
  const availableNames = [...shopItemPools.common, ...(state.player?.name === "親親子" ? shopItemPools.chinchinko : [])];
  const desiredRarity = rarityLabels[rollRarityForFame()];
  const matching = availableNames.filter((name) => shopItems[name]?.rarity === desiredRarity && !usedItems.has(name));
  const fallback = availableNames.filter((name) => !usedItems.has(name));
  const name = sample(matching.length ? matching : fallback.length ? fallback : availableNames);
  usedItems.add(name);
  const item = shopItems[name];
  return { type: "item", name, rarity: item.rarity, price: item.price, sold: false };
}

function cardRarityKey(name, fallback = "normal") {
  for (const [rarity, names] of Object.entries(cardPools)) {
    if (names.includes(name)) return rarity;
  }
  for (const [rarity, names] of Object.entries(mentorSupportCardPools)) {
    if (names.includes(name)) return rarity;
  }
  return fallback;
}

function rollShopCardPrice(rarity) {
  const ranges = {
    normal: [1500, 2000],
    rare: [2000, 2500],
    epic: [3000, 3500],
    legendary: [4000, 4500],
  };
  const [min, max] = ranges[rarity] || ranges.normal;
  return min + rand(Math.floor((max - min) / 100) + 1) * 100;
}

function rollRarityFromRates(rates) {
  const total = Object.values(rates).reduce((sum, value) => sum + value, 0);
  const roll = Math.random() * total;
  let cursor = 0;
  for (const rarity of ["normal", "rare", "epic", "legendary"]) {
    cursor += rates[rarity];
    if (roll < cursor) return rarity;
  }
  return "normal";
}

function enemyRatesForBattle(battleIndex = state.player?.battleIndex || 1) {
  return enemyProgressionRates.find((tier) => battleIndex >= tier.min && battleIndex <= tier.max)?.rates || enemyProgressionRates[0].rates;
}

function generateCardRewardChoices({ count = 3, fameLevel = effectiveFameLevel(), forcedRarities = [] } = {}) {
  const picked = new Set();
  const choices = [];
  while (choices.length < count) {
    const rarity = forcedRarities[choices.length] || rollRarityForFame(fameLevel);
    const pool = cardPools[rarity].filter((name) => !picked.has(name));
    const fallbackPool = Object.values(cardPools).flat().filter((name) => !picked.has(name));
    const name = sample(pool.length ? pool : fallbackPool);
    picked.add(name);
    choices.push({ rarity, card: makeCard(name) });
  }
  return choices;
}

function generateMinibossCardReward(minibossIndex) {
  if (minibossIndex <= 2) {
    return generateCardRewardChoices({ forcedRarities: ["legendary", "legendary", "epic"] });
  }
  return generateCardRewardChoices();
}

function generateMinibossChoices() {
  return shuffle(["kuta", "locked", "locked"]);
}

function onXiaoShopVisited(player = state.player) {
  if (!player) return;
  player.xiaoShopVisits = (player.xiaoShopVisits || 0) + 1;
}

function onMinibossRewardClaimed(player = state.player) {
  if (!player) return;
  player.minibossRewardsClaimed = (player.minibossRewardsClaimed || 0) + 1;
}

function createPlayer() {
  const deck = starterDeckNames.map(makeCard);
  return {
    name: "親親子",
    maxHp: 70,
    hp: 70,
    baseAttack: 0,
    money: 2000,
    deck,
    handLimit: 10,
    maxHandLimit: 12,
    items: [],
    inventory: [],
    inventoryCapacity: 5,
    cardRewardBonus: 0,
    fameValue: 0,
    fameLevel: 0,
    enemyLevel: 0,
    battleIndex: 1,
    smallBattlesWon: 0,
    xiaoShopVisits: 0,
    shopRemovePurchases: 0,
    shopBackpackPurchases: 0,
    minibossRewardsClaimed: 0,
    routeIndex: 0,
    seenEvents: [],
  };
}

function createShopTestRun() {
  state.player = createPlayer();
  state.player.fameValue = 45;
  state.player.money = 12000;
  state.shopStock = generateShopStock();
  state.screen = "shop";
}

function createBattleTestRun() {
  state.player = createPlayer();
  state.player.fameValue = 20;
  state.player.money = 5000;
  addRewardToBackpack(shopItems["手槍"]);
  addRewardToBackpack(shopItems["累累病藥水"]);
  addRewardToBackpack(eventItems["三色豆水餃"]);
  state.player.battleIndex = 1;
  startBattle();
}

function createMinibossTestRun() {
  state.player = createPlayer();
  state.player.fameValue = 45;
  state.player.money = 8000;
  state.player.selectedMiniboss1 = "kuta";
  addRewardToBackpack(shopItems["手槍"]);
  addRewardToBackpack(shopItems["累累病藥水"]);
  addRewardToBackpack(eventItems["三色豆水餃"]);
  state.player.battleIndex = 5;
  startBattle([], { type: "miniboss" });
}

function createEventTestRun() {
  state.player = createPlayer();
  state.player.fameValue = 20;
  state.player.money = 5000;
  state.player.routeIndex = 1;
  state.postBattle = {
    battleIndex: 0,
    result: "test",
    recovered: 0,
    rawMoney: 0,
    moneyRate: 1,
    moneyReward: 0,
    fameReward: 0,
    actionsLeft: 99,
    log: ["事件測試模式：已跳過戰鬥，可直接外出閒逛測試事件。"],
  };
  state.screen = "postbattle";
}

function createAudience(forcedTraits, forcedSuffix) {
  const t1 = forcedTraits?.[0] || sample(traitNames);
  let t2 = forcedTraits?.[1] || sample(traitNames);
  while (t2 === t1) t2 = sample(traitNames);
  let attack = 3 + rand(3);
  let maxHp = 17 + rand(4);
  if (t1 === "戀愛粉" || t2 === "戀愛粉") {
    attack += 2;
    maxHp += 7;
  }
  if (t1 === "危險斗內份子" || t2 === "危險斗內份子") attack += 3;
  attack = Math.max(0, attack);
  return {
    id: crypto.randomUUID(),
    side: "ally",
    kind: "audience",
    name: `${sample(prefixPool)}${forcedSuffix || sample(suffixPool)}`,
    attack,
    baseAttack: attack,
    maxHp,
    hp: maxHp,
    block: 0,
    traits: [t1, t2],
    acted: false,
    taunt: t1 === "嘴砲高手" || t2 === "嘴砲高手",
    avatar: {
      skin: sample(["#e6b18b", "#f1c4a2", "#d99a7a", "#c78565"]),
      hair: sample(["#17171b", "#3a2520", "#6e4a32", "#222a3c"]),
      shirt: sample(["#4867b1", "#6f4aa5", "#4f8b69", "#914c5d", "#a0813f"]),
    },
  };
}

function createEnemy(index, battleIndex = state.player?.battleIndex || 1, traitCounts = {}) {
  const rates = enemyRatesForBattle(battleIndex);
  const bodyRarity = rollRarityFromRates(rates);
  const body = bodyQualityRanges[bodyRarity];
  const traitRarities = [rollRarityFromRates(rates), rollRarityFromRates(rates)];
  const pickedTraitNames = new Set();
  const traitDetails = traitRarities.map((rarity) => {
    const trait = pickEnemyTrait(rarity, pickedTraitNames, traitCounts);
    pickedTraitNames.add(trait.name);
    traitCounts[trait.name] = (traitCounts[trait.name] || 0) + 1;
    return { ...trait, rarity };
  });
  const maxHp = randBetween(body.hp[0], body.hp[1]);
  const unit = {
    id: `enemy-${battleIndex}-${index}`,
    side: "enemy",
    kind: "goblin",
    name: `${sample(prefixPool)}${sample(suffixPool)}`,
    bodyRarity,
    hp: maxHp,
    maxHp,
    attack: randBetween(body.attack[0], body.attack[1]),
    baseAttack: 0,
    block: 0,
    charm: 0,
    acted: false,
    turnIndex: 0,
    traits: traitDetails.map((trait) => trait.name),
    traitDetails,
    moneyReward: body.money + traitDetails.reduce((sum, trait) => sum + traitMoney[trait.rarity], 0),
  };
  traitDetails.forEach((trait) => trait.apply?.(unit));
  enforceFixedAttack(unit);
  unit.baseAttack = unit.attack;
  unit.intent = (bodyRarity === "epic" || bodyRarity === "legendary") && Math.random() < 0.1 ? "heavy" : sample(["attack", "defend", "counter"]);
  return unit;
}

function createMinibossUnit(id = "kuta") {
  const data = minibosses[id] || minibosses.kuta;
  return {
    id: `boss-${data.id}`,
    side: "enemy",
    kind: "boss",
    isMiniboss: true,
    noFameOnDefeat: true,
    name: data.name,
    hp: data.hp,
    maxHp: data.hp,
    attack: data.attack,
    baseAttack: data.attack,
    block: 0,
    charm: 0,
    bodyRarity: "epic",
    image: data.image,
    traits: [...data.traits],
    traitDetails: data.traits.map((name) => ({ name, rarity: "special", text: data.traitText[name] || "" })),
    intentCycle: [...data.intentCycle],
    intentCycleIndex: 0,
  };
}

function createKutaFan(index = 1) {
  const rarity = rollRarityFromRates(enemyRatesForBattle(state.player?.battleIndex || 1));
  const randomTrait = pickEnemyTrait(rarity, new Set(["久田戀愛粉"]), getEnemyTraitCounts(state.battle?.enemies || []));
  const unit = {
    id: `kuta-fan-${crypto.randomUUID()}`,
    side: "enemy",
    kind: "goblin",
    name: "久田戀愛粉",
    bodyRarity: "normal",
    hp: 25,
    maxHp: 25,
    attack: 3,
    baseAttack: 3,
    block: 0,
    charm: 0,
    acted: false,
    turnIndex: 0,
    traits: ["久田戀愛粉", randomTrait.name],
    traitDetails: [
      { name: "久田戀愛粉", rarity: "special", text: "代為承受久田受到的一半攻擊傷害。" },
      { ...randomTrait, rarity },
    ],
    moneyReward: 100 + (traitMoney[rarity] || 0),
  };
  randomTrait.apply?.(unit);
  unit.baseAttack = unit.attack;
  setEnemyIntent(unit, "defend", { persistNextTurn: true });
  return unit;
}

function pickEnemyTrait(rarity, pickedTraitNames, traitCounts) {
  const preferred = (enemyTraitPools[rarity] || []).filter((trait) => canUseEnemyTrait(trait, pickedTraitNames, traitCounts));
  if (preferred.length) return sample(preferred);
  const fallback = Object.values(enemyTraitPools)
    .flat()
    .filter((trait) => canUseEnemyTrait(trait, pickedTraitNames, traitCounts));
  if (fallback.length) return sample(fallback);
  const sameRarityFallback = (enemyTraitPools[rarity] || enemyTraitPools.normal).filter((trait) => !pickedTraitNames.has(trait.name));
  return sample(sameRarityFallback.length ? sameRarityFallback : enemyTraitPools.normal);
}

function canUseEnemyTrait(trait, pickedTraitNames, traitCounts) {
  return !pickedTraitNames.has(trait.name) && (traitCounts[trait.name] || 0) < 2;
}

function createAudienceChoices() {
  const choices = [];
  const traitCounts = {};
  const traitCombos = new Set();
  const suffixes = shuffle(suffixPool).slice(0, 5);
  const combos = shuffle(
    traitNames.flatMap((first, i) => traitNames.slice(i + 1).map((second) => [first, second]))
  );

  for (const combo of combos) {
    if (choices.length >= 5) break;
    const audience = createAudience(combo, suffixes[choices.length]);
    const wouldOverfill = audience.traits.some((trait) => (traitCounts[trait] || 0) >= 2);
    const comboKey = [...audience.traits].sort().join("|");
    if (wouldOverfill || traitCombos.has(comboKey)) continue;

    choices.push(audience);
    traitCombos.add(comboKey);
    audience.traits.forEach((trait) => {
      traitCounts[trait] = (traitCounts[trait] || 0) + 1;
    });
  }

  return choices;
}

function render() {
  if (state.screen === "title") renderTitle();
  if (state.screen === "character") renderCharacterSelect();
  if (state.screen === "characterProfile") renderCharacterProfile();
  if (state.screen === "introCutscene") renderIntroCutscene();
  if (state.screen === "mentor") renderMentor();
  if (state.screen === "rewards") renderRewards();
  if (state.screen === "supportBriefing") renderSupportBriefing();
  if (state.screen === "shopIntroStory") renderShopIntroStory();
  if (state.screen === "minibossPrelude") renderMinibossPrelude();
  if (state.screen === "firestormEnding") renderFirestormEnding();
  if (state.screen === "versionEnd") renderVersionEnd();
  if (state.screen === "cardpoolCharacter") renderCardPoolCharacterSelect();
  if (state.screen === "cardpool") renderCardPool();
  if (state.screen === "audience") renderAudience();
  if (state.screen === "battle") renderBattle();
  if (state.screen === "minibossSelect") renderMinibossSelect();
  if (state.screen === "shop") renderShop();
  if (state.screen === "rebuild") renderRebuildNotice();
  if (state.screen === "postbattle") renderPostBattle();
  if (state.screen === "cardReward") renderCardReward();
  if (state.screen === "upgrade") renderUpgradeCards();
  if (state.screen === "event") renderRunEvent();
  if (state.screen === "blessing") renderBlessingCards();
  if (state.screen === "removeCard") renderRemoveCard();
  if (state.screen === "graduation") renderGraduationEnding();
  renderFameBadge();
}

function renderFameBadge() {
  document.querySelector(".fame-badge")?.remove();
  document.querySelector(".run-status")?.remove();
  document.querySelector(".global-deck-overlay")?.remove();
  document.querySelector(".global-backpack-overlay")?.remove();
  document.querySelector(".floating-backpack-button")?.remove();
  const visibleScreens = ["supportBriefing", "cardReward", "postbattle", "upgrade", "event", "blessing", "rebuild", "shop", "removeCard", "minibossSelect", "shopIntroStory", "minibossPrelude"];
  const shouldShow = Boolean(state.player && visibleScreens.includes(state.screen));
  document.body.classList.toggle("has-run-status", shouldShow);
  if (!shouldShow) {
    state.showRunDeck = false;
    state.showBackpack = false;
    return;
  }
  const fame = currentFameLevel();
  const fameLabel = `${fame.name}(${state.player.fameValue || 0})-${state.player.name}-${state.player.hp}/${state.player.maxHp}-${state.player.money}元`;
  const status = document.createElement("div");
  status.className = "run-status";
  status.innerHTML = `
    <div class="run-status-left">
      <span>${fameLabel}</span>
    </div>
    <div class="run-status-right">
      <button class="deck-button" data-run-deck>牌組</button>
    </div>`;
  document.body.appendChild(status);
  const backpackButton = document.createElement("button");
  backpackButton.className = "floating-backpack-button";
  backpackButton.type = "button";
  backpackButton.dataset.backpack = "true";
  backpackButton.setAttribute("aria-label", "背包");
  backpackButton.textContent = "背包";
  document.body.appendChild(backpackButton);
  backpackButton.onclick = () => {
    state.showBackpack = true;
    state.showRunDeck = false;
    render();
  };
  status.querySelector("[data-run-deck]").onclick = () => {
    state.showRunDeck = true;
    state.showBackpack = false;
    render();
  };
  if (state.showRunDeck) {
    const overlay = document.createElement("div");
    overlay.className = "global-deck-overlay";
    overlay.innerHTML = renderDeckOverlay();
    document.body.appendChild(overlay);
    overlay.querySelector("[data-close-deck]").onclick = () => {
      state.showRunDeck = false;
      render();
    };
    overlay.querySelectorAll("[data-select-stored-blessing]").forEach((button) => {
      button.onclick = () => {
        state.pendingBlessing = button.dataset.selectStoredBlessing;
        state.blessingNext = state.screen;
        state.showRunDeck = false;
        state.showBackpack = false;
        state.screen = "blessing";
        render();
      };
    });
  }
  if (state.showBackpack) {
    const overlay = document.createElement("div");
    overlay.className = "global-backpack-overlay";
    overlay.innerHTML = renderBackpackOverlay();
    document.body.appendChild(overlay);
    overlay.querySelector("[data-close-backpack]").onclick = () => {
      state.showBackpack = false;
      render();
    };
    overlay.querySelectorAll("[data-discard-item]").forEach((button) => {
      button.onclick = () => {
        discardBackpackItem(Number(button.dataset.discardItem));
      };
    });
    overlay.querySelectorAll("[data-use-item]").forEach((button) => {
      button.onclick = () => {
        startBattleItemTargeting(Number(button.dataset.useItem));
      };
    });
  }
}

function renderTitle() {
  app.innerHTML = `
    <main class="screen temple-bg">
      <section class="cover-menu">
        <img class="cover-image" src="${assetPaths.titleCover}" alt="台V戰記開場封面" onerror="if (!this.dataset.fallback) { this.dataset.fallback = '1'; this.src = '${assetPaths.titleCoverFallback}'; } else { this.closest('.cover-menu').classList.add('fallback'); }" />
        <button class="cover-hit start" data-action="start" aria-label="開始直播">開始直播</button>
        <button class="cover-hit continue" data-cardpool aria-label="查看卡片">查看卡片</button>
        <button class="cover-hit close" data-action="close" aria-label="結束直播">結束直播</button>
        <div class="cover-fallback">
          <section class="title-wrap">
            <h1 class="logo"><small>BECOME TIV</small>台V戰記</h1>
            <div class="hero-row">
              <div class="portrait-card green">${imageWithFallback(assetPaths.titleLeft, "未解鎖角色", "portrait-image contain", `<div class="silhouette"></div>`)}</div>
              <div class="title-menu">
                <button class="stone-button" data-action="start">開始直播</button>
                <button class="stone-button" data-cardpool>查看卡片</button>
                <button class="stone-button" data-action="close">結束直播</button>
              </div>
              <div class="portrait-card purple">${imageWithFallback(assetPaths.titleRight, "未解鎖角色", "portrait-image contain", `<div class="silhouette cat"></div>`)}</div>
            </div>
          </section>
        </div>
      </section>
      <div class="footer-bar"><span>Thanks XD-Entertainment</span><span>Ver. 0.1.0</span></div>
    </main>`;
  app.querySelector("[data-action='start']").onclick = () => {
    state.player = createPlayer();
    state.screen = "character";
    render();
  };
  app.querySelector("[data-action='close']").onclick = () => alert("瀏覽器版不能真的關閉，先當作關台成功。");
  app.querySelector("[data-cardpool]").onclick = () => {
    state.cardPoolOrigin = "title";
    state.screen = "cardpoolCharacter";
    render();
  };
}

function initializeApp() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("test") === "battle") {
    createBattleTestRun();
  } else if (params.get("test") === "miniboss") {
    createMinibossTestRun();
  } else if (params.get("test") === "shop") {
    createShopTestRun();
  } else if (params.get("test") === "events") {
    createEventTestRun();
  }
  render();
}

function renderCharacterSelect() {
  const characters = [
    { name: "親親子", locked: false },
    { name: "????", locked: true },
    { name: "????", locked: true },
  ];
  const selected = characters[state.selectedCharacter];
  app.innerHTML = `
    <main class="screen">
      <section class="page">
        <div class="topbar">
          <h1>選擇出道角色</h1>
          <button class="ghost-button" data-back>返回</button>
        </div>
        <div class="character-layout select-only">
          <div class="character-stage">
            <img class="character-stage-image" src="${assetPaths.characterSelect}" alt="角色三選一" onerror="this.closest('.character-stage').classList.add('fallback')" />
            <button class="character-hotspot left ${state.selectedCharacter === 0 ? "selected" : ""}" data-character="0" aria-label="親親子"></button>
            <button class="character-hotspot center ${state.selectedCharacter === 1 ? "selected" : ""}" data-character="1" aria-label="未解鎖角色"></button>
            <button class="character-hotspot right ${state.selectedCharacter === 2 ? "selected" : ""}" data-character="2" aria-label="未解鎖角色"></button>
            <div class="character-fallback">
              <div class="portrait-card character-option ${state.selectedCharacter === 0 ? "selected" : ""}" data-character="0">
                ${imageWithFallback(assetPaths.chinchinkoProfile, "親親子", "portrait-image contain", `<div class="chinchin"><div class="hair"></div><div class="face"></div><div class="eye left"></div><div class="eye right"></div><div class="mouth"></div><div class="body"></div><div class="skirt"></div></div>`)}
              </div>
              <div class="portrait-card green character-option ${state.selectedCharacter === 1 ? "selected" : ""}" data-character="1">${imageWithFallback(assetPaths.titleLeft, "未解鎖角色", "portrait-image contain", `<div class="silhouette"></div>`)}</div>
              <div class="portrait-card purple character-option ${state.selectedCharacter === 2 ? "selected" : ""}" data-character="2">${imageWithFallback(assetPaths.titleRight, "未解鎖角色", "portrait-image contain", `<div class="silhouette cat"></div>`)}</div>
            </div>
          </div>
        </div>
        ${selected.locked ? `<aside class="info-panel" style="margin:18px auto 0; width:min(520px,100%)"><div><h2>${selected.name}</h2><p>人物介紹<br>????</p><p>解鎖條件<br>????</p></div><button class="primary-button" disabled>尚未解鎖</button></aside>` : ""}
      </section>
    </main>`;
  app.querySelectorAll("[data-character]").forEach((el) => {
    el.onclick = () => {
      const index = Number(el.dataset.character);
      state.selectedCharacter = index;
      if (index === 0) {
        state.screen = "characterProfile";
      }
      render();
    };
  });
  app.querySelector("[data-back]").onclick = () => {
    state.screen = "title";
    render();
  };
}

function renderCharacterProfile() {
  app.innerHTML = `
    <main class="screen">
      <section class="page">
        <div class="topbar">
          <h1>親親子</h1>
          <button class="ghost-button" data-back>返回角色選擇</button>
        </div>
        <div class="profile-screen-card">
          <img src="${assetPaths.chinchinkoProfile}" alt="親親子人物介紹" onerror="this.closest('.profile-screen-card').classList.add('fallback')" />
          <button class="profile-confirm-hotspot" data-confirm aria-label="選擇她出道">選擇她出道</button>
          <div class="profile-fallback">
            <div>
              <h2>親親子</h2>
              <p>擅長剪剪的 VTuber。<br>以魅惑削弱對手，並強化己方觀眾。<br>必要時也會來跟小菸，提升自己的續航能力。</p>
            </div>
            <button class="primary-button" data-confirm>選擇她出道</button>
          </div>
        </div>
      </section>
    </main>`;
  app.querySelector("[data-back]").onclick = () => {
    state.screen = "character";
    render();
  };
  app.querySelectorAll("[data-confirm]").forEach((button) => {
    button.onclick = () => {
      state.screen = "introCutscene";
      state.cutsceneStep = 0;
      state.cutsceneMode = "still";
      render();
    };
  });
}

function renderIntroCutscene() {
  (state.cutsceneTimers || []).forEach((timer) => clearTimeout(timer));
  state.cutsceneTimers = [];
  const lines = [
    "親親子：這就是 XD集團總部嗎？好高阿....",
    "親親子：傳說中創辦人身家三千萬億，要是我成為台一V，我也能這樣嗎...",
  ];
  const mode = state.cutsceneMode || "still";
  if (mode === "video") {
    app.innerHTML = `
      <main class="screen">
        <section class="cutscene-screen video-mode">
          <div class="cutscene-art">
            <video class="cutscene-video" data-intro-video src="${assetPaths.introVideo}" autoplay muted playsinline preload="auto"></video>
            <div class="cutscene-fade" data-cutscene-fade></div>
          </div>
        </section>
      </main>`;
    const video = app.querySelector("[data-intro-video]");
    video.currentTime = 0;
    video.play?.().catch(() => {});
    state.cutsceneTimers.push(setTimeout(() => {
      if (state.screen !== "introCutscene") return;
      video.pause?.();
      app.querySelector("[data-cutscene-fade]")?.classList.add("active");
    }, 3000));
    state.cutsceneTimers.push(setTimeout(() => {
      if (state.screen !== "introCutscene") return;
      state.screen = "mentor";
      state.mentorStep = 0;
      state.cutsceneMode = "still";
      render();
    }, 4100));
    return;
  }
  const step = state.cutsceneStep || 0;
  app.innerHTML = `
    <main class="screen">
      <section class="cutscene-screen still-mode">
        <div class="cutscene-art">
          <video class="cutscene-video" data-intro-still src="${assetPaths.introVideo}" muted playsinline preload="metadata"></video>
          <div class="cutscene-fallback">
            <div class="hq-building">
              <div class="hq-sign">XD集團</div>
              <div class="hq-door"></div>
            </div>
            <div class="hq-plaza"></div>
          </div>
          <div class="cutscene-fade" data-cutscene-fade></div>
        </div>
        <div class="dialogue-panel cutscene-dialogue">
          <div class="dialogue-text">${lines[step]}</div>
          <button class="primary-button" data-next>${step < lines.length - 1 ? "繼續" : "進入總部"}</button>
        </div>
      </section>
    </main>`;
  const stillVideo = app.querySelector("[data-intro-still]");
  stillVideo.addEventListener("loadedmetadata", () => {
    stillVideo.currentTime = 0;
    stillVideo.pause?.();
  }, { once: true });
  app.querySelector("[data-next]").onclick = () => {
    if (step < lines.length - 1) {
      state.cutsceneStep = step + 1;
      render();
      return;
    }
    state.cutsceneMode = "video";
    render();
  };
}

function renderMentor() {
  const lines = [
    "蕭證明：妳就是今天出道的新人嗎？",
    "蕭證明：公司給妳準備了一點東西。",
    "蕭證明：選完就可以滾了。",
  ];
  app.innerHTML = `
    <main class="screen">
      <section class="page office">
        <div class="mentor-art">
          <img class="portrait-image" src="${assetPaths.mentor}" alt="蕭證明休息室" onerror="this.closest('.mentor-art').classList.add('fallback')" />
          <div class="monitor"></div>
          <div class="bottles">▯▯▯</div>
          <div class="mentor"><div class="hair"></div><div class="head"></div><div class="body"></div><div class="shirt">發</div></div>
          <div class="desk"></div>
        </div>
        <div class="dialogue-panel">
          <div class="dialogue-text">${lines[state.mentorStep]}</div>
          <button class="primary-button" data-next>繼續</button>
        </div>
      </section>
    </main>`;
  app.querySelector("[data-next]").onclick = () => {
    if (state.mentorStep < lines.length - 1) {
      state.mentorStep += 1;
      render();
    } else {
      state.rewardChoices = shuffle(rewards).slice(0, 3);
      state.selectedReward = null;
      state.screen = "rewards";
      render();
    }
  };
}

function renderRewards() {
  const spots = [
    { left: 35, top: 36 },
    { left: 55, top: 43 },
    { left: 76, top: 34 },
  ];
  app.innerHTML = `
    <main class="screen">
      <section class="page support-page">
        <div class="topbar"><h1>桌上的初始支援</h1><span class="pill">三選一</span></div>
        <div class="support-table-scene">
          <img class="support-table-bg" src="${assetPaths.supportTable}" alt="桌面" />
          ${state.rewardChoices
            .map(
              (item, index) => {
                const spot = spots[index];
                return `
            <button class="support-object ${state.selectedReward === index ? "selected" : ""}" style="left:${spot.left}%; top:${spot.top}%;" data-reward="${index}" aria-label="${item.name}">
              ${item.image ? `<img src="${item.image}" alt="${item.name}" />` : `<span>${item.icon}</span>`}
              <span class="support-tooltip">
                <strong>${item.name}</strong>
                <span>${item.desc}</span>
                <em>效果：${item.effect}</em>
              </span>
            </button>`;
              }
            )
            .join("")}
          <button class="support-start-button" data-take ${state.selectedReward === null ? "disabled" : ""}>開始初配信</button>
        </div>
      </section>
    </main>`;
  app.querySelectorAll("[data-reward]").forEach((el) => {
    el.onclick = () => {
      state.selectedReward = Number(el.dataset.reward);
      render();
    };
  });
  app.querySelector("[data-take]").onclick = () => {
    const item = state.rewardChoices[state.selectedReward];
    if (!addRewardToBackpack(item)) {
      alert("背包已滿，無法獲得道具。請先丟棄背包內的道具。");
      return;
    }
    item.apply?.(state.player);
    state.player.battleIndex = 1;
    state.player.routeIndex = 0;
    if (state.player.pendingRemove) {
      state.removeCardNext = "supportBriefing";
      state.screen = "removeCard";
      render();
      return;
    }
    state.supportBriefingStep = 0;
    state.screen = "supportBriefing";
    render();
  };
}

function addRewardToBackpack(item) {
  if (!state.player || !item) return false;
  state.player.inventory ||= [];
  state.player.inventoryCapacity ||= 5;
  if (state.player.inventory.length >= state.player.inventoryCapacity) return false;
  state.player.inventory.push({
    name: item.name,
    rarity: item.rarity,
    category: item.category,
    price: item.price,
    desc: item.desc,
    effect: item.effect,
    image: item.image,
    icon: item.icon,
    usableInBattle: item.usableInBattle,
    requiresTarget: item.requiresTarget,
  });
  return true;
}

function addPersistentItem(player, itemName) {
  player.items ||= [];
  if (!player.items.includes(itemName)) player.items.push(itemName);
}

function discardBackpackItem(index) {
  if (!state.player?.inventory) return;
  const [item] = state.player.inventory.splice(index, 1);
  if (!item) return;
  removePersistentItemEffect(item.name);
  state.showBackpack = true;
  render();
}

function removeItemFromInventoryByIndex(index) {
  const [item] = state.player.inventory.splice(index, 1);
  if (item) removePersistentItemEffect(item.name);
  return item;
}

function startBattleItemTargeting(index) {
  const item = state.player?.inventory?.[index];
  if (state.screen !== "battle" || !item?.usableInBattle) return;
  if (item.requiresTarget === false) {
    useBattleItemWithoutTarget(index);
    return;
  }
  state.battle.itemTargeting = { index, name: item.name };
  state.showBackpack = false;
  state.showRunDeck = false;
  log(`選擇 1 名敵方單位使用「${item.name}」。`);
  render();
}

function useBattleItemOnTarget(target) {
  const b = state.battle;
  const itemTargeting = b?.itemTargeting;
  const item = state.player?.inventory?.[itemTargeting?.index];
  if (!itemTargeting || !item || target?.side !== "enemy" || target.hp <= 0) return false;
  if (item.name === "三色豆水餃") {
    log(`對 ${target.name} 使用三色豆水餃。`);
    damage(target, 20, { side: "item", name: "三色豆水餃" });
    state.player.inventory.splice(itemTargeting.index, 1);
    b.itemTargeting = null;
    checkWinLose();
    render();
    return true;
  }
  if (item.name === "手槍") {
    log(`對 ${target.name} 使用手槍。`);
    setEnemyIntent(target, "knockdown", { persistNextTurn: true });
    removeItemFromInventoryByIndex(itemTargeting.index);
    b.itemTargeting = null;
    render();
    return true;
  }
  return false;
}

function useBattleItemWithoutTarget(index) {
  const b = state.battle;
  const item = state.player?.inventory?.[index];
  if (!b || !item) return;
  if (item.name === "累累病藥水") {
    addFameValue(-5);
    log("累累病藥水發作，名氣值 -5，本場戰鬥立刻結算。");
    removeItemFromInventoryByIndex(index);
    b.phase = "won";
    state.showBackpack = false;
    render();
  }
}

function removePersistentItemEffect(itemName) {
  if (!state.player) return;
  if (["提神飲料", "神秘的平板", "美食名簿", "神秘資料夾", "可愛狗狗雕像", "第二套V皮", "波貝貝守護", "親親獸玩偶", "暴頭七星", "露腳趾", "玩具剪刀"].includes(itemName)) {
    state.player.items = (state.player.items || []).filter((name) => name !== itemName);
  }
  if (itemName === "台一V認證") {
    state.player.cardRewardBonus = 0;
  }
  if (itemName === "醜臉抱枕") {
    state.player.discardedUglyPillow = true;
  }
  if (itemName === "一包香菸") {
    state.player.cigarettePackCharges = 0;
  }
  if (itemName === "亂畫的地圖") {
    state.player.items = (state.player.items || []).filter((name) => name !== itemName);
  }
  if (itemName === "訓犬寶典") {
    state.player.items = (state.player.items || []).filter((name) => name !== itemName);
  }
  if (itemName === "裝可愛心機") {
    state.player.items = (state.player.items || []).filter((name) => name !== itemName);
    state.player.minibossRewardBonusPick = Math.max(0, (state.player.minibossRewardBonusPick || 0) - 1);
  }
  if (itemName === "可愛狗狗雕像") {
    state.player.maxHp = Math.max(1, state.player.maxHp - 2);
    state.player.hp = Math.min(state.player.hp, state.player.maxHp);
  }
}

function renderRebuildNotice() {
  const fame = currentFameLevel();
  app.innerHTML = `
    <main class="screen">
      <section class="page">
        <div class="reward-panel" style="padding:28px">
          <h2>${state.routeNotice?.label || "後續內容準備中"}</h2>
          <p>${state.routeNotice?.description || "下一場戰鬥、事件與商店會接在這裡繼續製作。"}</p>
          <div class="deck-list">
            <article class="deck-entry">
              <span class="pill">名氣</span>
              <div>
                <h3>名氣值 ${state.player.fameValue || 0}：${fame.name}</h3>
                <p>卡片三選一機率：普通 ${fame.rates.normal}% / 精良 ${fame.rates.rare}% / 史詩 ${fame.rates.epic}% / 傳說 ${fame.rates.legendary}%</p>
              </div>
            </article>
            <article class="deck-entry">
              <span class="pill">戰後</span>
              <div>
                <h3>每場戰鬥後 2 次行動</h3>
                <p>外出閒逛、精進自己、休息一下。戰後卡片三選一可選擇不拿。</p>
              </div>
            </article>
            <article class="deck-entry">
              <span class="pill">節奏</span>
              <div>
                <h3>3 場小戰鬥後蕭證明商店</h3>
                <p>賞金的 1/10 會轉為名氣值。進入指定節點前若沒有達到要求稱號，會進入畢業結局。</p>
              </div>
            </article>
          </div>
          <div class="actions">
            <button class="secondary-button" data-cardpool>查看卡池</button>
            <button class="primary-button" data-title>回主選單</button>
          </div>
        </div>
      </section>
    </main>`;
  app.querySelector("[data-cardpool]").onclick = () => {
    state.cardPoolOrigin = "rebuild";
    state.screen = "cardpoolCharacter";
    render();
  };
  app.querySelector("[data-title]").onclick = () => {
    state.screen = "title";
    render();
  };
}

function renderShop() {
  const stock = state.shopStock || (state.shopStock = generateShopStock());
  const backpackPrice = shopBackpackPrice();
  const removePrice = shopRemovePrice();
  app.innerHTML = `
    <main class="screen">
      <section class="page shop-page">
        <div class="topbar">
          <div>
            <h1>蕭證明商店</h1>
            <p class="subtle">金錢 ${state.player.money} 元。卡片售價依稀有度以 100 元浮動。</p>
          </div>
          <span class="pill">商店</span>
        </div>
        <div class="shop-board">
          <div class="shop-card-row">
            ${stock.cards.map((offer, index) => renderShopCardOffer(offer, index)).join("")}
          </div>
          <div class="shop-bottom">
            <div class="shop-item-grid">
              ${stock.items.map((offer, index) => renderShopItemOffer(offer, index)).join("")}
            </div>
            <div class="shop-actions">
              <button class="shop-action-card" data-shop-expand ${stock.usedBackpack || state.player.money < backpackPrice ? "disabled" : ""}>擴充背包<br><small>${stock.usedBackpack ? "本次已使用" : `${backpackPrice} 元 / 容量 +1`}</small></button>
              <button class="shop-action-card" data-shop-remove ${stock.usedRemove || state.player.money < removePrice || !state.player.deck.length ? "disabled" : ""}>刪除卡片<br><small>${stock.usedRemove ? "本次已使用" : `${removePrice} 元 / 移除 1 張`}</small></button>
              <button class="shop-action-card primary-shop-action" data-leave-shop>離開商店</button>
            </div>
          </div>
        </div>
      </section>
    </main>`;
  app.querySelectorAll("[data-buy-card]").forEach((button) => {
    button.onclick = () => buyShopCard(Number(button.dataset.buyCard));
  });
  app.querySelectorAll("[data-buy-item]").forEach((button) => {
    button.onclick = () => buyShopItem(Number(button.dataset.buyItem));
  });
  app.querySelector("[data-shop-expand]").onclick = buyShopBackpack;
  app.querySelector("[data-shop-remove]").onclick = buyShopRemove;
  app.querySelector("[data-leave-shop]").onclick = () => {
    onXiaoShopVisited();
    state.shopStock = null;
    advanceRunRoute();
  };
}

function renderMinibossSelect() {
  const choices = state.minibossChoices || generateMinibossChoices();
  state.minibossChoices = choices;
  app.innerHTML = `
    <main class="screen">
      <section class="page">
        <div class="topbar">
          <div>
            <h1>蕭證明：接下來會碰到麻煩的傢伙。</h1>
            <p class="subtle">系統隨機出現三位小頭目，目前只有久田已製作。</p>
          </div>
        </div>
        <div class="reward-grid">
          ${choices.map((id, index) => {
            const boss = minibosses[id];
            return boss ? `
              <article class="reward-card selectable" data-miniboss-choice="${id}">
                <div class="reward-icon"><img src="${boss.image}" alt="${boss.name}" onerror="this.replaceWith(document.createTextNode('BOSS'))" /></div>
                <h3>${boss.name}</h3>
                <p>生命 ${boss.hp} / 攻擊 ${boss.attack}</p>
                <p>${boss.traits.join("、")}</p>
              </article>`
              : `<article class="reward-card disabled"><div class="reward-icon">?</div><h3>????</h3><p>尚未製作</p></article>`;
          }).join("")}
        </div>
      </section>
    </main>`;
  app.querySelectorAll("[data-miniboss-choice]").forEach((card) => {
    card.onclick = () => {
      state.player.selectedMiniboss1 = card.dataset.minibossChoice;
      state.shopIntroStep = 0;
      state.screen = "shopIntroStory";
      render();
    };
  });
}

function renderStoryScreen({ lines, stepKey, nextLabel = "繼續", finalLabel = "繼續", background = "office", onDone }) {
  const step = state[stepKey] || 0;
  const line = lines[Math.min(step, lines.length - 1)];
  const isFinal = step >= lines.length - 1;
  const bgClass = background === "black" ? "black-story" : "office story-office";
  app.innerHTML = `
    <main class="screen">
      <section class="page ${bgClass}">
        ${background === "office" ? `
          <div class="mentor-art story-art">
            <img class="portrait-image" src="${assetPaths.mentor}" alt="蕭證明休息室" onerror="this.closest('.mentor-art').classList.add('fallback')" />
            <div class="monitor"></div>
            <div class="bottles">▯▯▯</div>
            <div class="mentor"><div class="hair"></div><div class="head"></div><div class="body"></div><div class="shirt">發</div></div>
            <div class="desk"></div>
          </div>` : `<div class="black-story-space"></div>`}
        <div class="dialogue-panel cutscene-dialogue story-dialogue">
          <div class="dialogue-text">${line}</div>
          <button class="primary-button" data-story-next>${isFinal ? finalLabel : nextLabel}</button>
        </div>
      </section>
    </main>`;
  app.querySelector("[data-story-next]").onclick = () => {
    if (!isFinal) {
      state[stepKey] = step + 1;
      render();
      return;
    }
    onDone?.();
  };
}

function renderSupportBriefing() {
  renderStoryScreen({
    stepKey: "supportBriefingStep",
    finalLabel: "開始初配信",
    lines: [
      "你選完了道具正要離開，蕭證明卻喊住了你。",
      "蕭證明：等等！差點忘記這個，拿去看。",
      "蕭證明朝你丟過來一團紙球，你接住並攤開紙球查看其中內容。",
      "五回合的直播中會刷新源源不絕的觀眾，用卡牌擊倒他們可以騙...我是說獲得斗內跟名氣值。",
      "名氣值不只影響物品出現機率，也是公司對你的考核標準。好好加油吧。",
      "你看完後還想再追問，但蕭證明阻止了你。",
      "蕭證明：好了！就這樣，剩下得你自己探索，我要去跟DE電愛了。",
    ],
    onDone: () => {
      state.supportBriefingStep = 0;
      startBattle();
    },
  });
}

function renderShopIntroStory() {
  const bossName = minibosses[state.player?.selectedMiniboss1 || "kuta"]?.name || "久田";
  renderStoryScreen({
    stepKey: "shopIntroStep",
    finalLabel: "進入商店",
    lines: [
      "今天一大早，你就被叫來 XD娛樂辦公室。",
      "蕭證明：幹得不錯，新人。最近你名氣累積得很快，很會蹭嘛..我是說很會連動啦。",
      "蕭證明：所以LINE群..我是說公司決定給你一個小任務。",
      `蕭證明：公司決定要你超越${bossName}。`,
      "你：可是...VT不是都是好朋友嘛。",
      "蕭證明：卡通都這樣演的，好朋友就是要打過一場才會變好朋友。這是公司的決定！",
      "你：可是久田又會唱歌又會吸引粉絲，我要怎麼贏過他？",
      "蕭證明：放心吧，我會告訴你久田的弱點，他會召喚久田戀愛粉幫自己抵擋傷害並強化他們，清除久田戀愛粉將是勝負關鍵！而且公司也為了你準備一批補給！",
    ],
    onDone: () => {
      state.shopIntroStep = 0;
      state.shopStock = generateShopStock();
      state.screen = "shop";
      render();
    },
  });
}

function renderMinibossPrelude() {
  renderStoryScreen({
    stepKey: "minibossPreludeStep",
    background: "black",
    finalLabel: "開始決戰",
    lines: ["這一天...終於來了。跟久田決戰的日子。"],
    onDone: () => {
      const node = state.pendingRouteNode;
      state.pendingRouteNode = null;
      state.minibossPreludeStep = 0;
      state.player.battleIndex = node?.battleIndex || state.player.battleIndex;
      startBattle([], { type: "miniboss" });
    },
  });
}

function renderShopCardOffer(offer, index) {
  const card = cards[offer.name];
  const rarity = offer.rarity || card.rarity || "normal";
  return `
    <article class="shop-card pool-card rarity-border-${rarity} ${offer.sold ? "disabled" : ""}">
      <div class="pool-card-head">
        <h3>${card.name}</h3>
        <span class="pill rarity-${rarity}">${rarityLabels[rarity] || card.rarity || "特殊"}</span>
      </div>
      <dl class="pool-card-spec">
        <div><dt>費用</dt><dd>${cardBaseCost(card)} 能量</dd></div>
        <div><dt>系列</dt><dd>${renderSeriesTags(card.type)}</dd></div>
        <div class="full"><dt>說明</dt><dd>${keywordText(card.text || "")}</dd></div>
      </dl>
      <button class="primary-button" data-buy-card="${index}" ${offer.sold || state.player.money < offer.price ? "disabled" : ""}>${offer.sold ? "已售出" : `${offer.price} 元`}</button>
    </article>`;
}

function renderShopItemOffer(offer, index) {
  const item = shopItems[offer.name];
  const rarityKey = Object.entries(rarityLabels).find(([, label]) => label === item.rarity)?.[0] || "normal";
  return `
    <article class="shop-item ${offer.sold ? "disabled" : ""}">
      <div class="shop-item-icon">${item.icon}</div>
      <h3>${item.name}</h3>
      <p>${item.desc}</p>
      <p><strong>效果：</strong>${item.effect}</p>
      <div class="pool-card-badges"><span class="pill rarity-${rarityKey}">${item.rarity}</span><span class="pill">${item.category}</span></div>
      <button class="primary-button" data-buy-item="${index}" ${offer.sold || state.player.money < offer.price ? "disabled" : ""}>${offer.sold ? "已售出" : `${offer.price} 元`}</button>
    </article>`;
}

function buyShopCard(index) {
  const offer = state.shopStock?.cards?.[index];
  if (!offer || offer.sold || state.player.money < offer.price) return;
  state.player.money -= offer.price;
  state.player.deck.push(makeCard(offer.name));
  offer.sold = true;
  render();
}

function buyShopItem(index) {
  const offer = state.shopStock?.items?.[index];
  const item = shopItems[offer?.name];
  if (!offer || !item || offer.sold || state.player.money < offer.price) return;
  if (!addRewardToBackpack(item)) {
    alert("背包已滿，無法獲得道具。請先丟棄背包內的道具。");
    return;
  }
  state.player.money -= offer.price;
  item.apply?.(state.player);
  offer.sold = true;
  render();
}

function shopRemovePrice() {
  return 1500 + (state.player?.shopRemovePurchases || 0) * 500;
}

function shopBackpackPrice() {
  return 2000 + (state.player?.shopBackpackPurchases || 0) * 500;
}

function buyShopRemove() {
  const stock = state.shopStock;
  const price = shopRemovePrice();
  if (!stock || stock.usedRemove || state.player.money < price || !state.player.deck.length) return;
  state.player.money -= price;
  state.player.shopRemovePurchases = (state.player.shopRemovePurchases || 0) + 1;
  stock.usedRemove = true;
  state.player.pendingRemove = 1;
  state.removeCardNext = "shop";
  state.screen = "removeCard";
  render();
}

function buyShopBackpack() {
  const stock = state.shopStock;
  const price = shopBackpackPrice();
  if (!stock || stock.usedBackpack || state.player.money < price) return;
  state.player.money -= price;
  state.player.shopBackpackPurchases = (state.player.shopBackpackPurchases || 0) + 1;
  stock.usedBackpack = true;
  state.player.inventoryCapacity = (state.player.inventoryCapacity || 5) + 1;
  render();
}

function renderCardPoolCharacterSelect() {
  const selected = state.selectedCardPoolCharacter ?? 0;
  app.innerHTML = `
    <main class="screen">
      <section class="page">
        <div class="topbar">
          <h1>查看卡片</h1>
          <button class="ghost-button" data-back>返回</button>
        </div>
        <div class="character-layout select-only">
          <div class="character-stage">
            <img class="character-stage-image" src="${assetPaths.characterSelect}" alt="卡庫角色三選一" onerror="this.closest('.character-stage').classList.add('fallback')" />
            <button class="character-hotspot left ${selected === 0 ? "selected" : ""}" data-cardpool-character="0" aria-label="親親子卡庫"></button>
            <button class="character-hotspot center ${selected === 1 ? "selected" : ""}" data-cardpool-character="1" aria-label="未解鎖卡庫"></button>
            <button class="character-hotspot right ${selected === 2 ? "selected" : ""}" data-cardpool-character="2" aria-label="未解鎖卡庫"></button>
            <button class="cardpool-in-character left" data-open-cardpool>查看卡庫</button>
            <button class="cardpool-in-character center" disabled>尚未解鎖</button>
            <button class="cardpool-in-character right" disabled>尚未解鎖</button>
            <div class="character-fallback">
              <div class="portrait-card character-option cardpool-fallback-option ${selected === 0 ? "selected" : ""}" data-cardpool-character="0">
                ${imageWithFallback(assetPaths.chinchinkoProfile, "親親子", "portrait-image contain", `<div class="chinchin"><div class="hair"></div><div class="face"></div><div class="eye left"></div><div class="eye right"></div><div class="mouth"></div><div class="body"></div><div class="skirt"></div></div>`)}
                <button class="primary-button" data-open-cardpool>查看卡庫</button>
              </div>
              <div class="portrait-card green character-option ${selected === 1 ? "selected" : ""}" data-cardpool-character="1">${imageWithFallback(assetPaths.titleLeft, "未解鎖卡庫", "portrait-image contain", `<div class="silhouette"></div>`)}</div>
              <div class="portrait-card purple character-option ${selected === 2 ? "selected" : ""}" data-cardpool-character="2">${imageWithFallback(assetPaths.titleRight, "未解鎖卡庫", "portrait-image contain", `<div class="silhouette cat"></div>`)}</div>
            </div>
          </div>
        </div>
        ${selected === 0
          ? `<aside class="info-panel cardpool-select-panel"><div><h2>親親子卡庫</h2><p>目前只能查看親親子的卡片。</p></div></aside>`
          : `<aside class="info-panel cardpool-select-panel"><div><h2>????</h2><p>卡庫介紹<br>????</p><p>解鎖條件<br>????</p></div></aside>`}
      </section>
    </main>`;
  app.querySelectorAll("[data-cardpool-character]").forEach((el) => {
    el.onclick = () => {
      const index = Number(el.dataset.cardpoolCharacter);
      state.selectedCardPoolCharacter = index;
      render();
    };
  });
  app.querySelector("[data-open-cardpool]")?.addEventListener("click", () => {
    state.cardPoolFilter = { rarity: "all", series: "all" };
    state.screen = "cardpool";
    render();
  });
  app.querySelector("[data-back]").onclick = () => {
    state.screen = state.cardPoolOrigin || "title";
    render();
  };
}

function renderCardPool() {
  const rarityFilters = [
    ["starter", "初始"],
    ["normal", "普通"],
    ["rare", "精良"],
    ["epic", "史詩"],
    ["legendary", "傳說"],
  ];
  const seriesFilters = ["剪剪系", "魅惑系", "小菸系"];
  const filter = normalizeCardPoolFilter();
  const view = getCardPoolView(filter);
  app.innerHTML = `
    <main class="screen">
      <section class="page cardpool-page">
        <div class="topbar">
          <div>
            <h1>親親子卡池</h1>
            <p class="subtle">統一格式：名稱 / 費用 / 系列 / 說明。專有名詞可滑鼠移過查看說明。</p>
          </div>
          <button class="ghost-button" data-back>返回</button>
        </div>
        <div class="cardpool-filters">
          <label>
            <span>稀有度</span>
            <select data-filter-rarity>
              <option value="all" ${filter.rarity === "all" ? "selected" : ""}>稀有度</option>
              ${rarityFilters.map(([key, label]) => `<option value="${key}" ${filter.rarity === key ? "selected" : ""}>${label}</option>`).join("")}
            </select>
          </label>
          <label>
            <span>系列</span>
            <select data-filter-series>
              <option value="all" ${filter.series === "all" ? "selected" : ""}>系列</option>
              ${seriesFilters.map((series) => `<option value="${series}" ${filter.series === series ? "selected" : ""}>${series}</option>`).join("")}
            </select>
          </label>
        </div>
        <section class="cardpool-section">
          <div class="pool-heading">
            <h2>${view.title}</h2>
            <span class="pill">${view.entries.length} 張</span>
          </div>
          <div class="cardpool-grid">
            ${view.entries.map(({ name, rarity, count }) => renderPoolCard(cards[name], rarity, count)).join("")}
          </div>
        </section>
      </section>
    </main>`;
  app.querySelector("[data-filter-rarity]").onchange = (event) => {
    state.cardPoolFilter = { ...normalizeCardPoolFilter(), rarity: event.target.value };
    render();
  };
  app.querySelector("[data-filter-series]").onchange = (event) => {
    state.cardPoolFilter = { ...normalizeCardPoolFilter(), series: event.target.value };
    render();
  };
  app.querySelector("[data-back]").onclick = () => {
    state.screen = "cardpoolCharacter";
    render();
  };
}

function normalizeCardPoolFilter() {
  const filter = state.cardPoolFilter || {};
  if ("type" in filter) {
    if (filter.type === "starter") return { rarity: "starter", series: "all" };
    if (filter.type === "rarity") return { rarity: filter.value, series: "all" };
    if (filter.type === "series") return { rarity: "all", series: filter.value };
    return { rarity: "all", series: "all" };
  }
  return {
    rarity: filter.rarity || "all",
    series: filter.series || "all",
  };
}

function getCardPoolView(filter) {
  const rarityNames = { all: "全部卡片", starter: "初始", ...rarityLabels };
  const entries = getAllPoolEntries().filter((entry) => {
    const rarityMatch = filter.rarity === "all" || entry.rarity === filter.rarity;
    const seriesMatch = filter.series === "all" || cardHasSeries(cards[entry.name], filter.series);
    return rarityMatch && seriesMatch;
  });
  const titleParts = [];
  if (filter.rarity !== "all") titleParts.push(rarityNames[filter.rarity]);
  if (filter.series !== "all") titleParts.push(filter.series);
  return {
    title: titleParts.length ? titleParts.join(" / ") : "全部卡片",
    entries,
  };
}

function getAllPoolEntries() {
  const starterCounts = starterDeckNames.reduce((acc, name) => {
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {});
  const starterEntries = Object.entries(starterCounts).map(([name, count]) => ({ name, rarity: "starter", count }));
  const poolEntries = Object.entries(cardPools).flatMap(([rarity, names]) => names.map((name) => ({ name, rarity })));
  return [...starterEntries, ...poolEntries];
}

function cardHasSeries(card, series) {
  return Boolean(card?.type?.includes(series));
}

function renderPoolCard(card, rarity, count = 1) {
  if (!card) return "";
  const rarityLabel = rarity === "starter" ? "初始" : rarityLabels[rarity];
  const countLabel = count > 1 ? `<span class="pill">x${count}</span>` : "";
  const upgradePreview = card.upgradeText
    ? `
      <section class="upgrade-preview">
        <h4>升級後</h4>
        <dl class="pool-card-spec upgrade-spec">
          <div><dt>費用</dt><dd>${card.upgradeCost ?? card.cost} 能量</dd></div>
          <div><dt>系列</dt><dd>${renderSeriesTags(card.type)}</dd></div>
          <div class="full"><dt>說明</dt><dd>${keywordText(card.upgradeText)}</dd></div>
        </dl>
      </section>`
    : "";
  return `
    <article class="pool-card rarity-border-${rarity}">
      <div class="pool-card-head">
        <h3>${card.name}</h3>
        <div class="pool-card-badges">${countLabel}<span class="pill rarity-${rarity}">${rarityLabel}</span></div>
      </div>
      ${renderBlessingBadge(card)}
      <dl class="pool-card-spec">
        <div><dt>費用</dt><dd>${cardBaseCost(card)} 能量</dd></div>
        <div><dt>系列</dt><dd>${renderSeriesTags(card.type)}</dd></div>
        <div class="full"><dt>說明</dt><dd>${keywordText(card.text || "")}</dd></div>
      </dl>
      ${upgradePreview}
    </article>`;
}

function renderSeriesTags(type) {
  if (!type) return "無";
  return type
    .split(/\s*[+/]\s*/)
    .map((tag) => tag.trim())
    .filter(Boolean)
    .map((tag) => keywordDescriptions[tag] ? keywordTag(tag) : `<span class="series-tag">${tag}</span>`)
    .join("");
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function keywordTag(term) {
  return `<span class="keyword keyword-${keywordClass(term)}">${term}<span class="keyword-tooltip"><strong>${term}</strong><br>${keywordDescriptions[term]}</span></span>`;
}

function keywordClass(term) {
  if (term.includes("剪")) return "scissor";
  if (term.includes("菸")) return "smoke";
  if (term.includes("魅惑")) return "charm";
  if (term.includes("增益")) return "power";
  return "rule";
}

function keywordText(text) {
  const terms = Object.keys(keywordDescriptions).sort((a, b) => b.length - a.length);
  const pattern = new RegExp(terms.map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"), "g");
  let cursor = 0;
  let html = "";
  for (const match of String(text).matchAll(pattern)) {
    html += escapeHtml(String(text).slice(cursor, match.index));
    html += keywordTag(match[0]);
    cursor = match.index + match[0].length;
  }
  html += escapeHtml(String(text).slice(cursor));
  return html;
}

function renderAudience() {
  app.innerHTML = `
    <main class="screen">
      <section class="page">
        <div class="topbar">
          <div><h1>初始觀眾 5 選 3</h1><p class="muted">蕭證明：拿了就走，別弄丟。</p></div>
          <span class="pill">已選 ${state.selectedAudience.length} / 3</span>
        </div>
        <div class="audience-grid">
          ${state.audienceChoices.map(renderAudienceCard).join("")}
        </div>
        <div class="actions">
          <button class="primary-button" data-confirm ${state.selectedAudience.length !== 3 ? "disabled" : ""}>確認觀眾，開始初配信</button>
        </div>
      </section>
    </main>`;
  app.querySelectorAll("[data-audience]").forEach((el) => {
    el.onclick = () => {
      const id = el.dataset.audience;
      if (state.selectedAudience.includes(id)) {
        state.selectedAudience = state.selectedAudience.filter((x) => x !== id);
      } else if (state.selectedAudience.length < 3) {
        state.selectedAudience.push(id);
      }
      render();
    };
  });
  app.querySelector("[data-confirm]").onclick = () => {
    const allies = state.audienceChoices.filter((a) => state.selectedAudience.includes(a.id));
    startBattle(allies);
  };
}

function renderAudienceCard(unit) {
  return `
    <article class="unit-card selectable ${state.selectedAudience.includes(unit.id) ? "selected" : ""}" data-audience="${unit.id}">
      <div class="audience-avatar" style="--skin:${unit.avatar.skin};--hair:${unit.avatar.hair};--shirt:${unit.avatar.shirt};"><div class="hair-piece"></div></div>
      <h3>${unit.name}</h3>
      <div class="stat-line"><span class="pill">攻 ${unit.attack}</span><span class="pill">血 ${unit.hp}/${unit.maxHp}</span></div>
      ${unit.traits.map((t) => `<div class="trait"><strong>${t}</strong><br>${traits[t]}</div>`).join("")}
    </article>`;
}

function startBattle(allies = [], options = {}) {
  const battleIndex = state.player.battleIndex || 1;
  const isMinibossBattle = options.type === "miniboss" || options.isMinibossBattle === true;
  const maxTurns = isMinibossBattle ? null : 5;
  const enemyTotal = 10;
  const playerUnit = {
    id: "player",
    side: "ally",
    kind: "vt",
    name: "親親子",
    hp: state.player.hp,
    maxHp: state.player.maxHp,
    attack: 0,
    block: 0,
    acted: false,
    attackDown: 0,
  };
  const boss = isMinibossBattle ? createMinibossUnit(state.player.selectedMiniboss1 || "kuta") : null;
  const enemies = [];
  if (boss?.name === "久田") enemies.push(createKutaFan(1));
  while (enemies.length < 3) {
    enemies.push(createEnemy(enemies.length + 1, battleIndex, getEnemyTraitCounts(enemies)));
  }
  state.battle = {
    battleIndex,
    maxTurns,
    isMinibossBattle,
    turn: 1,
    phase: "player",
    player: playerUnit,
    boss,
    allies: [],
    enemies,
    enemyReserve: enemyTotal - enemies.length,
    enemySpawned: enemies.length,
    deck: shuffle(state.player.deck.map((c) => ({ ...cards[c.name], ...c, id: crypto.randomUUID() }))),
    discard: [],
    hand: [],
    energy: 3,
    maxEnergy: 3,
    handLimit: state.player.handLimit || 10,
    selectedCard: null,
    selectedAttacker: null,
    showDeck: false,
    enemyDamageReduction: 0,
    currentCardType: "",
    attackDamageBonus: 0,
    smokeCharmTriggers: 0,
    myGirlUses: 0,
    playedTags: [],
    powers: {},
    scissorStorm: false,
    playedSmallScissors: 0,
    defeatedMoney: 0,
    defeatedFameMoney: 0,
    damageTakenMultiplier: state.player.nextBattleDamageTakenMultiplier || 1,
    fameRewardMultiplier: state.player.nextBattleFameMultiplier || 1,
    kutaVoiceNegatedThisRound: false,
    log: [],
  };
  state.player.nextBattleDamageTakenMultiplier = 1;
  state.player.nextBattleFameMultiplier = 1;
  applyBattleStartItemEffects();
  applyEntranceTraits();
  assignEnemyIntents();
  applyDrawnMapConfusion();
  draw(5 + (state.player.items.includes("神秘的平板") ? 2 : 0));
  drawSpecificOpeningCardBySeries("暴頭七星", "小菸系");
  if (state.player.items.includes("玩具剪刀")) {
    addToHand("小剪刀");
    addToHand("小剪刀");
  }
  state.screen = "battle";
  log(`第 ${battleIndex} 場戰鬥開始。`);
  render();
}

function applyBattleStartItemEffects() {
  const b = state.battle;
  if (state.player.items.includes("親親獸玩偶")) {
    b.player.block += 15;
    log("親親獸玩偶觸發，親親子獲得 15 點防禦。");
  }
  if (state.player.items.includes("露腳趾")) {
    const enemies = liveEnemyUnits();
    if (enemies.length) {
      const picked = sample(enemies);
      addCharm(picked, 8);
      log(`露腳趾觸發，${picked.name} 獲得 8 魅惑。`);
    }
  }
  if (b.isMinibossBattle && state.player.items.includes("神秘資料夾")) {
    const boss = b.boss || b.enemies.find((enemy) => enemy.isMiniboss || enemy.kind === "boss");
    if (boss) {
      const loss = Math.ceil(boss.maxHp * 0.15);
      boss.hp = Math.max(0, boss.hp - loss);
      log(`神秘資料夾觸發，小頭目失去 ${loss} 點生命。`);
    }
  }
}

function drawSpecificOpeningCardBySeries(itemName, series) {
  if (!state.player.items.includes(itemName)) return;
  const b = state.battle;
  if (b.hand.length >= (b.handLimit || 10)) return;
  const index = b.deck.findIndex((card) => card.type?.includes(series));
  if (index < 0) return;
  const [card] = b.deck.splice(index, 1);
  b.hand.push(card);
  log(`${itemName} 觸發，抽取「${card.name}」到手中。`);
}

function renderBattle() {
  const b = state.battle;
  const fame = currentFameLevel();
  const fameLabel = `${fame.name}(${state.player.fameValue || 0})-${state.player.name}-${b.player.hp}/${b.player.maxHp}-${state.player.money}元`;
  const enemySlots = [0, 1, 2].map((slot) => b.enemies[slot] ? renderBattleEnemySlot(b.enemies[slot]) : `<div class="battle-monster-card empty-enemy-slot">小怪${slot + 1}</div>`);
  const handSlots = Array.from({ length: 12 }, (_, index) => b.hand[index] ? renderHandSlot(b.hand[index]) : `<div class="battle-hand-slot empty"></div>`);
  app.innerHTML = `
    <main class="battle-screen">
      <section class="battle-desk">
        <div class="battle-top-status">
          <div class="battle-status-text">${fameLabel}</div>
          <button class="battle-deck-icon" data-run-deck-local title="查看本局遊戲當前牌組">牌組</button>
        </div>
        ${renderBattleBossArea(b)}
        <div class="battle-turn-label">回合 ${b.turn}/${b.isMinibossBattle ? "無限制" : b.maxTurns}</div>
        <button class="battle-draw-pile-button" data-battle-draw-pile>牌庫剩餘 ${b.deck.length}</button>
        <div class="battle-enemy-slot enemy-slot-left">${enemySlots[0]}</div>
        <div class="battle-enemy-slot enemy-slot-center">${enemySlots[1]}</div>
        <div class="battle-enemy-slot enemy-slot-right">${enemySlots[2]}</div>
        <button class="battle-side-button battle-backpack-zone" data-battle-backpack>背包</button>
        <button class="battle-side-button battle-end-button" data-end ${b.phase !== "player" ? "disabled" : ""}>結束回合</button>
        <button class="battle-side-button battle-discard-zone" data-battle-discard>棄牌堆<br><small>${b.discard.length}</small></button>
        <div class="battle-energy-panel">能量 ${b.energy}/${b.maxEnergy}</div>
        <div class="battle-hero">
          <img class="battle-hero-avatar" src="${assetPaths.chinchinkoBattleAvatar}" alt="親親子頭像" onerror="this.src='${assetPaths.chinchinkoProfile}'" />
          <div class="battle-unit-gauges hero-gauges">${renderBlockBadge(b.player)}${renderHeartBadge(b.player)}</div>
          <div class="hero-status-box">${renderHeroStatusBox(b.player)}</div>
          <div class="statuses battle-hero-statuses">
            ${b.player.charm ? renderCharmStatus(b.player) : ""}
            ${b.player.attackDown ? `<span class="status broken-sword">🗡 ${b.player.attackDown}</span>` : ""}
            ${b.player.noAttack ? `<span class="status">不能攻擊</span>` : ""}
            ${b.player.noDamage ? `<span class="status">不能造成傷害</span>` : ""}
            ${state.battle?.playerImmuneToEnemyDamage ? `<span class="status">敵傷無效</span>` : ""}
          </div>
        </div>
        <div class="battle-hand-area">
          <div class="battle-hand-grid">${handSlots.join("")}</div>
          <div class="actions">
            <button class="ghost-button" data-clear>取消選取</button>
          </div>
        </div>
        <div class="battle-log-panel">${b.log.map((line) => `<div>${line}</div>`).join("")}</div>
        <div class="battle-phase-label">${b.phase === "enemy" ? "敵方行動中" : "親親子行動"}</div>
        <div class="battle-reserve-label">剩餘小怪 ${b.enemyReserve || 0}</div>
      </section>
    </main>
    ${checkBattleEndOverlay()}
    ${renderDeckChoiceOverlay()}
    ${state.showRunDeck ? renderDeckOverlay() : ""}
    ${state.showBackpack ? renderBackpackOverlay() : ""}
    ${b.showDrawPile ? renderBattlePileOverlay("牌庫剩餘", b.deck, "data-close-draw-pile") : ""}
    ${b.showDiscard ? renderBattlePileOverlay("棄牌堆", b.discard, "data-close-discard") : ""}`;

  app.querySelector("[data-end]")?.addEventListener("click", endPlayerTurn);
  app.querySelector("[data-battle-backpack]")?.addEventListener("click", () => {
    state.showBackpack = true;
    state.showRunDeck = false;
    b.showDiscard = false;
    render();
  });
  app.querySelector("[data-battle-discard]")?.addEventListener("click", () => {
    b.showDiscard = true;
    b.showDrawPile = false;
    state.showBackpack = false;
    state.showRunDeck = false;
    render();
  });
  app.querySelector("[data-battle-draw-pile]")?.addEventListener("click", () => {
    b.showDrawPile = true;
    b.showDiscard = false;
    state.showBackpack = false;
    state.showRunDeck = false;
    render();
  });
  app.querySelector("[data-close-draw-pile]")?.addEventListener("click", () => {
    b.showDrawPile = false;
    render();
  });
  app.querySelector("[data-close-discard]")?.addEventListener("click", () => {
    b.showDiscard = false;
    render();
  });
  app.querySelectorAll("[data-clear]").forEach((button) => {
    button.onclick = () => {
      b.selectedCard = null;
      b.selectedAttacker = null;
      render();
    };
  });
  app.querySelectorAll("[data-run-deck-local]").forEach((button) => {
    button.onclick = () => {
      b.selectedCard = null;
      b.selectedAttacker = null;
      state.showRunDeck = true;
      state.showBackpack = false;
      b.showDrawPile = false;
      b.showDiscard = false;
      render();
    };
  });
  attachBattleOverlays();
  app.querySelectorAll("[data-card]").forEach((el) => {
    el.onclick = () => {
      b.selectedAttacker = null;
      b.selectedCard = el.dataset.card;
      const card = b.hand.find((c) => c.id === b.selectedCard);
      const targetMode = effectiveCardTarget(card);
      if (targetMode === "self" || targetMode === "choice") playSelectedCard(b.player);
      else render();
    };
  });
  app.querySelectorAll("[data-pick-deck-card]").forEach((el) => {
    el.onclick = () => chooseDeckCardToHand(el.dataset.pickDeckCard);
  });
  app.querySelector("[data-cancel-deck-choice]")?.addEventListener("click", () => {
    b.deckChoice = null;
    render();
  });
  app.querySelectorAll("[data-unit]").forEach((el) => {
    el.onclick = () => handleUnitClick(el.dataset.unit);
  });
  app.querySelectorAll("[data-unit-action]").forEach((el) => {
    el.onclick = (event) => {
      event.stopPropagation();
      handleAudienceAction(el.dataset.unitId, el.dataset.unitAction);
    };
  });
  app.querySelector("[data-postbattle]")?.addEventListener("click", () => {
    finishBattle();
  });
  app.querySelector("[data-restart]")?.addEventListener("click", () => {
    state.screen = "title";
    state.battle = null;
    render();
  });
}

function renderBattleBossArea(b) {
  if (!b.isMinibossBattle || !b.boss) return "";
  const traitBadges =
    (b.boss.traits?.length)
      ? `<div class="trait-badges">${b.boss.traits
          .map((trait) => `<span class="trait-badge">${trait}<span class="trait-tooltip"><strong>${trait}</strong><br>${traitDescription(b.boss, trait)}</span></span>`)
          .join("")}</div>`
      : `<span>無特性</span>`;
  return `
    <div class="battle-boss-info ${b.boss.hp > 0 ? "targetable" : ""}" data-unit="${b.boss.id}">
      <div class="battle-boss-text">
        <strong>${b.boss.name}</strong>
        ${traitBadges}
        <div class="statuses battle-boss-statuses">${renderUnitStatuses(b.boss)}</div>
        <span>攻擊 ${b.boss.attack}</span>
      </div>
      <div class="battle-boss-avatar">${b.boss.image ? `<img src="${b.boss.image}" alt="${b.boss.name}" />` : "BOSS"}</div>
      <div class="battle-unit-gauges boss-gauges">${renderAttackBadge(b.boss)}${renderBlockBadge(b.boss)}${renderHeartBadge(b.boss)}</div>
    </div>`;
}

function renderHeroStatusBox(player) {
  const statuses = [];
  if (player.charm) statuses.push(`魅惑 ${player.charm}`);
  if (player.attackDown) statuses.push(`攻擊下降 ${player.attackDown}`);
  if (player.noAttack) statuses.push("不能攻擊");
  if (player.noDamage) statuses.push("不能造成傷害");
  if (state.battle?.playerImmuneToEnemyDamage) statuses.push("敵傷無效");
  if (state.battle?.cardPlayLimit) statuses.push(`出牌限制 ${state.battle.cardPlayLimit}`);
  if (state.battle?.enemyDamageReduction) statuses.push(`敵傷 -${state.battle.enemyDamageReduction}`);
  if (state.battle?.attackDamageBonus) statuses.push(`攻傷 +${state.battle.attackDamageBonus}`);
  if (state.battle?.powers?.bladeStorm) statuses.push("劍刃風暴");
  if (state.battle?.powers?.knifeShield) statuses.push("我的刀盾");
  if (state.battle?.powers?.charmBonus) statuses.push(`魅惑 +${state.battle.powers.charmBonus}`);
  if (state.battle?.powers?.scissorLove) statuses.push("剪愛");
  if (state.battle?.powers?.donationFee) statuses.push("斗內費");
  if (state.battle?.powers?.lifeCharm) statuses.push("生命魅惑");
  return statuses.length ? statuses.map((text) => `<span>${text}</span>`).join("") : `<span>無狀態</span>`;
}

function renderUnitStatuses(unit) {
  if (!unit) return "";
  return `
    ${unit.taunt ? `<span class="status">嘲諷</span>` : ""}
    ${unit.charm ? renderCharmStatus(unit) : ""}
    ${unit.attackDown ? `<span class="status broken-sword">🗡 ${unit.attackDown}</span>` : ""}
    ${unit.tempAttackBuff ? `<span class="status">暫攻 +${unit.tempAttackBuff}</span>` : ""}
    ${unit.noAttack ? `<span class="status">不能攻擊</span>` : ""}
    ${unit.noDamage ? `<span class="status">不能造成傷害</span>` : ""}
    ${unit.lovePreacherMark ? `<span class="status">被標記</span>` : ""}
    ${unit.counterStance ? `<span class="status status-with-tooltip">反擊姿態<span class="status-tooltip">受到攻擊時，攻擊者受到 ${enemyIntentAttack(unit)} 點傷害。</span></span>` : ""}
  `;
}

function renderBattleEnemySlot(unit) {
  const isDead = unit.hp <= 0;
  const targetable = state.battle?.selectedCard || state.battle?.selectedAttacker || state.battle?.itemTargeting;
  const active = state.battle?.selectedAttacker === unit.id;
  const intent = unit.side === "enemy" && unit.hp > 0 ? enemyIntent(unit) : "";
  const traitBadges =
    (unit.traits?.length)
      ? `<div class="trait-badges">${unit.traits
          .map((trait) => `<span class="trait-badge">${trait}<span class="trait-tooltip"><strong>${trait}</strong><br>${traitDescription(unit, trait)}</span></span>`)
          .join("")}</div>`
      : "";
  return `
    <article class="battle-monster-card ${isDead ? "dead" : ""} ${targetable && !isDead ? "targetable" : ""} ${active ? "active-attacker" : ""}" data-unit="${unit.id}">
      <div class="battle-monster-portrait">${monsterPortraitSvg(unit)}</div>
      <div class="battle-monster-info">
        <h3>${unit.name}</h3>
        ${traitBadges}
        <div class="statuses battle-monster-statuses">${renderUnitStatuses(unit)}</div>
        ${intent ? `<p class="intent">意圖：${intent}</p>` : ""}
      </div>
      <div class="battle-unit-gauges monster-gauges">${renderAttackBadge(unit)}${renderBlockBadge(unit)}${renderHeartBadge(unit)}</div>
    </article>`;
}

function monsterPortraitSvg(unit) {
  const colors = ["#7b4b2b", "#8b5a35", "#6e5531", "#9a6745", "#5e4b37"];
  const color = colors[Math.abs(hashString(unit.id || unit.name)) % colors.length];
  return `
    <svg viewBox="0 0 80 96" aria-hidden="true">
      <path d="M16 38c0-18 11-30 24-30s24 12 24 30v22c0 18-11 28-24 28S16 78 16 60V38Z" fill="${color}" stroke="#2b170d" stroke-width="4"/>
      <path d="M22 22 10 8l4 26M58 22 70 8l-4 26" fill="${color}" stroke="#2b170d" stroke-width="4" stroke-linejoin="round"/>
      <circle cx="30" cy="43" r="4" fill="#fff2b5"/><circle cx="50" cy="43" r="4" fill="#fff2b5"/>
      <path d="M30 64c6 5 14 5 20 0" fill="none" stroke="#241008" stroke-width="4" stroke-linecap="round"/>
      <path d="M36 54h8l-4 5Z" fill="#241008"/>
    </svg>`;
}

function hashString(text) {
  return String(text).split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

function renderBlockBadge(unit) {
  return `<span class="battle-block-badge battle-stat-badge">` +
    `${unit.block || 0}<span class="battle-stat-tooltip">目前防禦值。受到傷害時會優先抵擋。</span></span>`;
}

function renderAttackBadge(unit) {
  return `<span class="battle-attack-badge battle-stat-badge">` +
    `${unit.baseAttack ?? unit.attack ?? 0}<span class="battle-stat-tooltip">基礎攻擊。敵方意圖會依照此數值計算。</span></span>`;
}

function renderHeartBadge(unit) {
  return `<span class="battle-heart-badge battle-stat-badge">` +
    `${unit.hp}/${unit.maxHp}<span class="battle-stat-tooltip">目前生命 / 最大生命。</span></span>`;
}

function renderCharmStatus(unit) {
  return `<span class="status status-with-tooltip charm-status">魅惑 ${unit.charm}<span class="status-tooltip">當魅惑累積量大於等於怪物剩餘生命時馬上觸發，親親子擊倒該敵人。</span></span>`;
}

function renderHandSlot(card) {
  return `<div class="battle-hand-slot filled">${renderHandCard(card)}</div>`;
}

function renderBattlePileOverlay(title, pile, closeAttr) {
  return `
    <div class="overlay">
      <div class="modal deck-modal">
        <div class="topbar">
          <div>
            <h2>${title}</h2>
            <p class="subtle">${pile.length} 張</p>
          </div>
          <button class="ghost-button" ${closeAttr}>關閉</button>
        </div>
        <div class="deck-choice-grid">
          ${pile.length
            ? pile.map((card) => `
              <article class="pool-card">
                <div class="pool-card-head">
                  <h3>${card.name}</h3>
                  <span class="pill">${cardBaseCost(card)} 能量</span>
                </div>
                <dl class="pool-card-spec">
                  <div><dt>系列</dt><dd>${renderSeriesTags(card.type)}</dd></div>
                  <div class="full"><dt>說明</dt><dd>${keywordText(cardText(card))}</dd></div>
                </dl>
              </article>`).join("")
            : `<article class="pool-card"><h3>目前沒有卡牌</h3></article>`}
        </div>
      </div>
    </div>`;
}

function attachBattleOverlays() {
  document.querySelector("[data-close-deck]")?.addEventListener("click", () => {
    state.showRunDeck = false;
    render();
  });
  document.querySelector("[data-close-backpack]")?.addEventListener("click", () => {
    state.showBackpack = false;
    render();
  });
  document.querySelectorAll("[data-discard-item]").forEach((button) => {
    button.onclick = () => discardBackpackItem(Number(button.dataset.discardItem));
  });
  document.querySelectorAll("[data-use-item]").forEach((button) => {
    button.onclick = () => startBattleItemTargeting(Number(button.dataset.useItem));
  });
  document.querySelectorAll("[data-use-item-direct]").forEach((button) => {
    button.onclick = () => useBattleItemWithoutTarget(Number(button.dataset.useItemDirect));
  });
  document.querySelectorAll("[data-select-stored-blessing]").forEach((button) => {
    button.onclick = () => {
      state.pendingBlessing = button.dataset.selectStoredBlessing;
      state.blessingNext = state.screen;
      state.showRunDeck = false;
      state.showBackpack = false;
      state.screen = "blessing";
      render();
    };
  });
}

function renderCombatUnit(unit) {
  const isDead = unit.hp <= 0;
  const targetable = state.battle?.selectedCard || state.battle?.selectedAttacker || state.battle?.itemTargeting;
  const active = state.battle?.selectedAttacker === unit.id;
  const intent = unit.side === "enemy" && unit.hp > 0 ? enemyIntent(unit) : "";
  const traitBadges =
    (unit.traits?.length)
      ? `<div class="trait-badges">${unit.traits
          .map((trait) => `<span class="trait-badge">${trait}<span class="trait-tooltip"><strong>${trait}</strong><br>${traitDescription(unit, trait)}</span></span>`)
          .join("")}</div>`
      : "";
  return `
    <article class="combat-unit ${unit.kind === "vt" ? "hero-unit" : ""} ${unit.side === "enemy" ? "enemy-unit" : "ally-unit"} ${isDead ? "dead" : ""} ${targetable && !isDead ? "targetable" : ""} ${active ? "active-attacker" : ""}" data-unit="${unit.id}">
      <div class="${unit.kind === "goblin" ? "goblin-art" : "vt-mini"}">${unit.kind === "goblin" ? "👺" : unit.kind === "vt" ? "💗" : "👤"}</div>
      <h3>${unit.name}</h3>
      <div class="stat-line"><span class="pill">攻 ${unit.attack}</span><span class="pill">血 ${unit.hp}/${unit.maxHp}</span>${unit.block ? `<span class="pill">防 ${unit.block}</span>` : ""}</div>
      ${unit.id === "player" ? `<p class="hero-hp-label">HP ${unit.hp}/${unit.maxHp}</p>` : ""}
      <div class="bars">
        <div class="bar"><span style="width:${Math.max(0, (unit.hp / unit.maxHp) * 100)}%"></span></div>
        <div class="bar block"><span style="width:${Math.min(100, (unit.block / Math.max(1, unit.maxHp)) * 100)}%"></span></div>
      </div>
      <div class="statuses">
        ${unit.taunt ? `<span class="status">嘲諷</span>` : ""}
        ${unit.charm ? renderCharmStatus(unit) : ""}
        ${unit.attackDown ? `<span class="status broken-sword">🗡 ${unit.attackDown}</span>` : ""}
        ${unit.tempAttackBuff ? `<span class="status">暫攻 +${unit.tempAttackBuff}</span>` : ""}
        ${unit.noAttack ? `<span class="status">不能攻擊</span>` : ""}
        ${unit.noDamage ? `<span class="status">不能造成傷害</span>` : ""}
        ${unit.id === "player" && state.battle?.playerImmuneToEnemyDamage ? `<span class="status">敵傷無效</span>` : ""}
        ${unit.lovePreacherMark ? `<span class="status">被標記</span>` : ""}
        ${unit.counterStance ? `<span class="status status-with-tooltip">反擊姿態<span class="status-tooltip">受到攻擊時，攻擊者受到 ${enemyIntentAttack(unit)} 點傷害。</span></span>` : ""}
        ${unit.acted ? `<span class="status">已行動</span>` : ""}
      </div>
      ${traitBadges}
      ${intent ? `<p class="intent">意圖：${intent}</p>` : ""}
      ${unit.side === "ally" && unit.kind === "audience" && !unit.acted && unit.hp > 0 ? `<div class="actions"><button class="ghost-button unit-action" data-unit-action="attack" data-unit-id="${unit.id}">攻擊</button><button class="ghost-button unit-action" data-unit-action="defend" data-unit-id="${unit.id}">防禦姿態</button></div>` : ""}
    </article>`;
}

function traitDescription(unit, traitName) {
  if (unit.side === "enemy") {
    const detail = unit.traitDetails?.find((trait) => trait.name === traitName);
    if (!detail) return "";
    return `${detail.copiedByCopycat ? "由跟風仔複製。" : ""}${detail.text || ""}`;
  }
  return traits[traitName] || "";
}

function applyEntranceTraits() {
  const b = state.battle;
  b.enemies.forEach(applyEnemyCopycatFirst);
  b.enemies.forEach(applyEnemyEntranceTraits);
  if (b.boss) applyEnemyEntranceTraits(b.boss);
}

function applyEnemyEntranceTraits(enemy) {
  if (!enemy || enemy.entranceApplied) return;
  enemy.entranceApplied = true;
  applyEnemyCopycatFirst(enemy);
  if (state.player?.items?.includes("訓犬寶典") && enemy.traits?.includes("戀愛粉")) {
    enemy.loveFanGuardAvailable = true;
    enemy.loveFanGuardUsed = false;
    log(`${enemy.name} 受到訓犬寶典影響，會代替親親子承受一次傷害。`);
  }
  if (enemy.traits?.includes("檢舉幫")) applyReportEntrance(enemy);
  if (enemy.traits?.includes("專業後勤")) applyProfessionalSupportEntrance(enemy);
}

function applyEnemyCopycatFirst(enemy) {
  if (!enemy || enemy.copycatApplied || !enemy.traits?.includes("跟風仔")) return;
  enemy.copycatApplied = true;
  applyCopycatTrait(enemy);
}

function applyReportEntrance(enemy) {
  const candidates = [state.battle.player, ...state.battle.enemies].filter((unit) => unit.hp > 0 && unit.id !== enemy.id);
  if (!candidates.length) return;
  const target = sample(candidates);
  addAttackDown(target, 2, "enemy");
  log(`${enemy.name} 的檢舉幫發動，${target.name} 攻擊下降 2。`);
}

function applyProfessionalSupportEntrance(enemy) {
  const targets = state.battle.enemies.filter((unit) => unit.hp > 0 && unit.id !== enemy.id);
  targets.forEach((unit) => {
    unit.nextDamageHeal = true;
  });
  log(`${enemy.name} 的專業後勤發動，其他同陣營角色下次受到的傷害轉化為治癒。`);
}

function applyCopycatTrait(enemy) {
  const index = state.battle.enemies.findIndex((unit) => unit.id === enemy.id);
  const neighbors = [state.battle.enemies[index - 1], state.battle.enemies[index + 1]]
    .filter((unit) => unit && unit.hp > 0)
    .flatMap((unit) => unit.traitDetails || [])
    .filter((trait) => trait.name !== "跟風仔" && !enemy.traits.includes(trait.name));
  if (!neighbors.length) return;
  const copied = sample(neighbors);
  enemy.traits = enemy.traits.map((name) => (name === "跟風仔" ? copied.name : name));
  enemy.traitDetails = enemy.traitDetails.map((trait) => (trait.name === "跟風仔" ? { ...copied, copiedByCopycat: true } : trait));
  copied.apply?.(enemy);
  enforceFixedAttack(enemy);
  log(`${enemy.name} 的跟風仔複製了「${copied.name}」。`);
}

function renderHandCard(card) {
  const b = state.battle;
  return `
    <article class="battle-card ${b.selectedCard === card.id ? "selected" : ""}" data-card="${card.id}">
      <span class="pill">${effectiveCardCost(card)} 能量</span>
      <h3>${card.name}</h3>
      <p>${card.type}</p>
      <p>${cardText(card)}</p>
      ${renderBlessingBadge(card)}
    </article>`;
}

function renderDeckChoiceOverlay() {
  const choice = state.battle?.deckChoice;
  if (!choice) return "";
  const deck = state.battle[choice.pile || "deck"] || [];
  return `
    <div class="overlay deck-choice-overlay">
      <div class="modal deck-modal">
        <div class="topbar">
          <div>
            <h2>${choice.title}</h2>
            <p class="subtle">${choice.message}</p>
          </div>
          <button class="ghost-button" data-cancel-deck-choice>取消</button>
        </div>
        <div class="deck-choice-grid">
          ${deck.length
            ? deck.map((card) => `
              <article class="pool-card selectable" data-pick-deck-card="${card.id}">
                <div class="pool-card-head">
                  <h3>${card.name}</h3>
                  <span class="pill">${cardBaseCost(card)} 能量</span>
                </div>
                <dl class="pool-card-spec">
                  <div><dt>系列</dt><dd>${renderSeriesTags(card.type)}</dd></div>
                  <div class="full"><dt>說明</dt><dd>${keywordText(cardText(card))}</dd></div>
                </dl>
                ${renderBlessingBadge(card)}
              </article>`).join("")
            : `<article class="pool-card"><h3>目前牌庫沒有卡牌</h3></article>`}
        </div>
      </div>
    </div>`;
}

function chooseDeckCardToHand(cardId) {
  const b = state.battle;
  if (!b?.deckChoice) return;
  if ((b.hand?.length || 0) >= (b.handLimit || 10)) {
    log("手牌已達上限，無法加入牌。");
    b.deckChoice = null;
    render();
    return;
  }
  const pileName = b.deckChoice.pile || "deck";
  const pile = b[pileName] || b.deck;
  const index = pile.findIndex((card) => card.id === cardId);
  if (index >= 0) {
    const [card] = pile.splice(index, 1);
    if (b.deckChoice.costModifier) card.cost = Math.max(0, (card.cost || 0) + b.deckChoice.costModifier);
    b.hand.push(card);
    log(`將「${card.name}」加入手牌。`);
  }
  b.deckChoice = null;
  render();
}

function cardText(card) {
  return (card.text || "")
    .replace(/升級[：:][^。]*(。|$)/g, "")
    .replace(/升級[^。]*(。|$)/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function renderBlessingBadge(card) {
  if (!card?.blessing) return "";
  return `<span class="status status-with-tooltip blessing-badge">${card.blessing}<span class="status-tooltip">${blessingDescription(card.blessing)}</span></span>`;
}

function blessingDescription(blessing) {
  if (blessing === "暴雪祝福") return "讓一張隨機選擇對象的卡牌變成指定。";
  if (blessing === "要拼祝福") return "讓一張隨機目標卡耗能減少 1。";
  return "未知祝福。";
}

function renderDeckOverlay() {
  const isBattleDeck = state.screen === "battle" && state.battle;
  const sourceDeck = state.player.deck;
  const storedBlessings = state.player?.storedBlessings || [];
  const counts = sourceDeck.reduce((acc, card) => {
    acc[card.name] ||= { card, count: 0 };
    acc[card.name].count += 1;
    return acc;
  }, {});
  const emptyText = "目前牌組沒有卡牌。";
  return `
    <div class="overlay">
      <div class="modal deck-modal">
        <div class="topbar">
          <div>
            <h2>目前牌組</h2>
            ${isBattleDeck ? `<p class="subtle">本局遊戲目前牌組總覽，與戰鬥中的牌庫剩餘、棄牌堆分開顯示。</p>` : ""}
          </div>
          <button class="ghost-button" data-close-deck>關閉</button>
        </div>
        ${renderStoredBlessings(storedBlessings)}
        <div class="deck-list">
          ${Object.values(counts).length
            ? Object.values(counts)
            .map(
              ({ card, count }) => `
                <article class="deck-entry">
                  <span class="pill">${count} 張</span>
                  <div>
                    <h3>${card.name}</h3>
                    <p>${cardBaseCost(card)} 能量 / ${renderSeriesTags(card.type)}</p>
                    <p>${cardText(card)}</p>
                    ${renderBlessingBadge(card)}
                  </div>
                </article>`
            )
            .join("")
            : `<article class="deck-entry"><span class="pill">0 張</span><div><h3>${emptyText}</h3></div></article>`}
        </div>
      </div>
    </div>`;
}

function renderStoredBlessings(storedBlessings) {
  if (!storedBlessings.length) {
    return `<div class="stored-blessings"><span class="pill">可用祝福 0</span></div>`;
  }
  return `
    <div class="stored-blessings">
      <span class="pill">可用祝福 ${storedBlessings.length}</span>
      ${storedBlessings.map((blessing, index) => `
        <button class="ghost-button status-with-tooltip" data-select-stored-blessing="${blessing}" data-blessing-index="${index}">
          ${blessing}
          <span class="status-tooltip">${blessingDescription(blessing)}</span>
        </button>`).join("")}
    </div>`;
}

function renderBackpackOverlay() {
  const items = state.player?.inventory || [];
  const capacity = state.player?.inventoryCapacity || 5;
  const slots = Array.from({ length: capacity }, (_, index) => items[index] || null);
  return `
    <div class="overlay">
      <div class="modal deck-modal backpack-modal">
        <div class="topbar">
          <div>
            <h2>背包</h2>
            <p class="subtle">容量 ${items.length}/${capacity}</p>
          </div>
          <button class="ghost-button" data-close-backpack>關閉</button>
        </div>
        <div class="backpack-grid">
          ${slots
            .map((item, index) => item
              ? `<article class="backpack-slot filled">
                  <div class="backpack-item-icon">${item.image ? `<img src="${item.image}" alt="${item.name}" />` : item.icon}</div>
                  <h3>${item.name}</h3>
                  <p>${item.desc}</p>
                  <p><strong>效果：</strong>${item.effect}</p>
                  ${state.screen === "battle" && item.usableInBattle ? `<button class="primary-button backpack-use" ${item.requiresTarget === false ? `data-use-item-direct="${index}"` : `data-use-item="${index}"`}>使用</button>` : ""}
                  <button class="danger-button backpack-discard" data-discard-item="${index}">丟棄</button>
                </article>`
              : `<article class="backpack-slot empty"><span>空</span></article>`)
            .join("")}
        </div>
      </div>
    </div>`;
}

function handleUnitClick(id) {
  const b = state.battle;
  const unit = findUnit(id);
  if (!unit || unit.hp <= 0 || b.phase !== "player") return;

  if (b.itemTargeting) {
    useBattleItemOnTarget(unit);
    return;
  }

  if (b.selectedCard) {
    const card = b.hand.find((c) => c.id === b.selectedCard);
    const targetMode = effectiveCardTarget(card);
    if (card && targetMode === "enemy" && isAttackCard(card) && !canTargetEnemyWithAttack(unit)) return;
    playSelectedCard(unit);
    return;
  }
  if (b.selectedAttacker && unit.side === "enemy") {
    const attacker = findUnit(b.selectedAttacker);
    if (!attacker || attacker.acted || attacker.hp <= 0) return;
    if (!canTargetEnemyWithAttack(unit)) return;
    performAttack(attacker, unit);
    attacker.acted = true;
    b.selectedAttacker = null;
    checkWinLose();
    render();
  }
}

function handleAudienceAction(id, action) {
  const b = state.battle;
  const unit = findUnit(id);
  if (!unit || b.phase !== "player" || unit.acted || unit.hp <= 0) return;
  if (action === "attack") {
    if (unit.noAttack) return;
    b.selectedCard = null;
    b.selectedAttacker = id;
    render();
    return;
  }
  if (action === "defend") {
    unit.block += unit.attack;
    unit.acted = true;
    b.selectedCard = null;
    b.selectedAttacker = null;
    log(`${unit.name} 採取防禦姿態，獲得 ${unit.attack} 點防禦。`);
    render();
  }
}

function playSelectedCard(target) {
  const b = state.battle;
  const card = b.hand.find((c) => c.id === b.selectedCard);
  const cost = card ? effectiveCardCost(card) : 0;
  if (!card || b.energy < cost || b.phase !== "player") return;
  if (b.cardPlayLimit && (b.playedCardsThisTurn || 0) >= b.cardPlayLimit) {
    log("世界作用中，本回合不能再打出更多卡片。");
    render();
    return;
  }
  const targetMode = effectiveCardTarget(card);
  if (targetMode === "enemy" && target.side !== "enemy") return;
  if (card.target === "ally" && target.side !== "ally") return;
  if (targetMode === "any" && target.hp <= 0) return;
  b.energy -= cost;
  b.playedCardsThisTurn = (b.playedCardsThisTurn || 0) + 1;
  log(`打出「${card.name}」。`);
  b.currentCardType = card.type;
  const repeatedTimes = card.name === "尼古丁爆發" ? 0 : b.repeatNextCard || 0;
  const damageBonus = card.name === "VT都是騙錢的!" ? 0 : b.nextCardDamageBonus || 0;
  if (isAttackCard(card) && damageBonus) {
    b.activeCardDamageBonus = damageBonus;
    b.activeCardDamageBonusUsed = false;
  }
  if (isAttackCard(card) && b.attackDamageBonus) {
    b.activeAttackCardDamageBonus = b.attackDamageBonus;
    b.activeAttackCardDamageBonusUsed = false;
  }
  card.play(target);
  for (let i = 0; i < repeatedTimes; i += 1) {
    if (!target || target.hp > 0 || card.target === "self") {
      log(`尼古丁爆發重複打出「${card.name}」。`);
      card.play(target);
    }
  }
  if (repeatedTimes) b.repeatNextCard = 0;
  if (b.activeCardDamageBonus) {
    if (b.activeCardDamageBonusUsed) b.nextCardDamageBonus = 0;
    b.activeCardDamageBonus = 0;
    b.activeCardDamageBonusUsed = false;
  }
  if (b.activeAttackCardDamageBonus) {
    if (b.activeAttackCardDamageBonusUsed) b.attackDamageBonus = 0;
    b.activeAttackCardDamageBonus = 0;
    b.activeAttackCardDamageBonusUsed = false;
  }
  b.currentCardType = "";
  afterCardPlayed(card);
  b.hand = b.hand.filter((c) => c.id !== card.id);
  if (!isBattleExhaustCard(card) && !card.generated) b.discard.push(card);
  b.selectedCard = null;
  checkWinLose();
  if (b.endTurnAfterCard && b.phase === "player" && b.player.hp > 0 && b.enemies.some((e) => e.hp > 0)) {
    b.endTurnAfterCard = false;
    render();
    endPlayerTurn();
    return;
  }
  render();
}

function effectiveCardTarget(card) {
  if (card?.blessing === "暴雪祝福" && card.randomTargetCard) return "enemy";
  return card?.target;
}

function isAttackCard(card) {
  return /攻擊傷害|造成.*傷害/.test(card.text || "");
}

function canTargetEnemyWithAttack(target) {
  if (!target || target.side !== "enemy") return true;
  const taunts = state.battle.enemies.filter((enemy) => enemy.hp > 0 && enemy.taunt);
  if (!taunts.length || target.taunt) return true;
  log("敵方有嘲諷單位，必須先攻擊嘲諷目標。");
  render();
  return false;
}

function effectiveCardCost(card) {
  const tags = state.battle?.playedTags || [];
  let cost = cardBaseCost(card);
  if (card.blessing === "要拼祝福" && card.randomTargetCard) cost = Math.max(0, cost - 1);
  if (card.name === "煙中剪影" && tags.includes("小菸系")) return Math.max(0, cost - 1);
  if (card.name === "再來一根" && tags.includes("小菸系")) return Math.max(0, cost - 1);
  if (card.name === "吐煙圈" && tags.includes("小菸系") && tags.includes("魅惑系")) return Math.max(0, cost - 1);
  return cost;
}

function cardBaseCost(card) {
  if (!card) return 0;
  if (card.upgraded && card.upgradeCost !== undefined) return card.upgradeCost;
  if (card.upgraded) {
    const parsedCost = parseUpgradeCost(card.upgradeText);
    if (parsedCost !== null) return parsedCost;
  }
  return card.cost || 0;
}

function parseUpgradeCost(text = "") {
  const match = String(text).match(/(?:耗能|費用)\s*(\d+)/);
  return match ? Number(match[1]) : null;
}

function afterCardPlayed(card) {
  const b = state.battle;
  if (!b.playedTags) b.playedTags = [];
  if (card.type.includes("剪剪系") && b.powers?.knifeShield) {
    b.player.block += b.powers.knifeShield;
    log(`我的刀盾觸發，親親子獲得 ${b.powers.knifeShield} 點防禦。`);
  }
  if (card.type.includes("剪剪系") && b.powers?.bladeStorm && card.name !== "劍刃風暴") {
    addToHand("小剪刀");
    log("劍刃風暴觸發，獲得 1 張小剪刀。");
  }
  if (card.type.includes("小菸系")) b.playedTags.push("小菸系");
  if (card.type.includes("魅惑系")) b.playedTags.push("魅惑系");
  if (card.type.includes("小菸系") && b.powers?.smokeTax && card.name !== "菸捐") {
    b.energy += 1;
    state.player.money = Math.max(0, state.player.money - 200);
    log("菸捐觸發：回復 1 能量，損失 200 元。");
  }
  if (card.name === "小剪刀") {
    b.playedSmallScissors = (b.playedSmallScissors || 0) + 1;
  }
}

function addToHand(cardName) {
  const b = state.battle;
  if (b.hand.length >= (b.handLimit || 10)) {
    log(`手牌已達上限，「${cardName}」沒有生成。`);
    return false;
  }
  b.hand.push(makeCard(cardName));
  log(`生成「${cardName}」到手牌。`);
  return true;
}

function addMotivation(target, amount) {
  target.attack += amount;
  target.motivation = (target.motivation || 0) + amount;
  log(`${target.name} 獲得 ${amount} 層幹勁。`);
}

function performAttack(attacker, target) {
  log(`${attacker.name} 攻擊 ${target.name}，造成 ${attacker.attack} 點傷害。`);
  damage(target, attacker.attack, attacker);
  if (canCounter(target)) {
    log(`${target.name} 反擊姿態觸發，造成 ${target.attack} 點傷害。`);
    damage(attacker, target.attack, target);
  }
  afterUnitAttack(attacker);
  afterAttackDamage();
}

function dealAttack(target, amount, sourceName) {
  if (state.battle.player.noDamage) {
    log("親親子無法造成攻擊傷害。");
    return 0;
  }
  if (state.battle.player.attackDown) {
    amount = Math.max(0, amount - state.battle.player.attackDown);
    log(`攻擊下降，攻擊傷害 -${state.battle.player.attackDown}。`);
  }
  if (state.battle.activeCardDamageBonus) {
    amount += state.battle.activeCardDamageBonus;
    state.battle.activeCardDamageBonusUsed = true;
    log(`VT都是騙錢的! 觸發，攻擊傷害 +${state.battle.activeCardDamageBonus}。`);
  }
  if (state.battle.activeAttackCardDamageBonus) {
    amount += state.battle.activeAttackCardDamageBonus;
    state.battle.activeAttackCardDamageBonusUsed = true;
    log(`磨利觸發，攻擊傷害 +${state.battle.activeAttackCardDamageBonus}。`);
  }
  if (state.player?.items?.includes("可愛狗狗雕像")) amount += 2;
  if (target?.isMiniboss && target.name === "久田") {
    const fan = pickKutaFanProtector();
    if (fan) {
      const redirected = Math.ceil(amount / 2);
      amount = Math.floor(amount / 2);
      log(`${fan.name} 替久田承受 ${redirected} 點攻擊傷害。`);
      damage(fan, redirected, { side: "ally", name: sourceName });
    }
  }
  log(`${sourceName} 對 ${target.name} 造成 ${amount} 點攻擊傷害。`);
  const dealt = damage(target, amount);
  if (state.battle.powers?.scissorLove && sourceName === "小剪刀") addCharm(target, amount);
  if (state.battle.powers?.consumptionGenius && !state.battle.consumptionGeniusUsed && dealt > 0) {
    const money = dealt * 50;
    state.player.money += money;
    state.battle.consumptionGeniusUsed = true;
    log(`消費天才觸發，獲得 ${money} 元。`);
  }
  if (canCounter(target)) {
    log(`${target.name} 反擊姿態觸發，造成 ${target.attack} 點傷害。`);
    damage(state.battle.player, target.attack, target);
  }
  afterAttackDamage();
  return dealt;
}

function canCounter(target) {
  return target.side === "enemy" && target.counterStance && target.hp > 0 && !target.noCounter;
}

function pickKutaFanProtector() {
  const fans = state.battle?.enemies?.filter((unit) => unit.hp > 0 && unit.traits?.includes("久田戀愛粉")) || [];
  return fans.length ? sample(fans) : null;
}

function afterAttackDamage() {
  if (state.battle.scissorStorm) addToHand("小剪刀");
}

function damage(target, amount, source = null) {
  const b = state.battle;
  if (target?.isMiniboss && target.name === "久田" && source?.side === "ally") {
    const fan = pickKutaFanProtector();
    if (fan) {
      const redirected = Math.ceil(amount / 2);
      amount = Math.floor(amount / 2);
      log(`${fan.name} 替久田承受 ${redirected} 點傷害。`);
      damage(fan, redirected, source);
    }
  }
  if (target.id === "player" && source?.side === "enemy" && b?.playerImmuneToEnemyDamage) {
    log("事後菸觸發，親親子沒有受到敵方傷害。");
    return 0;
  }
  if (target.id === "player" && source?.side === "enemy" && b?.damageTakenMultiplier > 1) {
    amount *= b.damageTakenMultiplier;
    log(`炎上商法作用中，親親子受到傷害 x${b.damageTakenMultiplier}。`);
  }
  if (target.id === "player" && source?.side === "enemy") {
    const guard = b.enemies?.find((unit) => unit.hp > 0 && unit.loveFanGuardAvailable && !unit.loveFanGuardUsed);
    if (guard) {
      guard.loveFanGuardUsed = true;
      guard.noFameOnDefeat = true;
      log(`訓犬寶典觸發，${guard.name} 代替親親子承受 ${amount} 點傷害。`);
      damage(guard, amount, { side: "item", name: "訓犬寶典" });
      return 0;
    }
  }
  if (
    target.id === "player" &&
    (!source || source.side !== "enemy") &&
    b?.currentCardType?.includes("小菸系") &&
    (state.player?.cigarettePackCharges || 0) > 0
  ) {
    state.player.cigarettePackCharges -= 1;
    heal(target, amount);
    log(`一包香菸觸發，小菸失去生命改為回復 ${amount} 點生命。`);
    return 0;
  }
  if (target.traits?.includes("廠商爸爸")) {
    state.player.money = Math.max(0, state.player.money - 300);
    log(`${target.name} 的廠商爸爸受傷，扣除 300 元。`);
  }
  if (target.nextDamageHeal) {
    target.nextDamageHeal = false;
    heal(target, amount);
    return 0;
  }
  if (target.traits?.includes("雲玩家") && sourceNameIsAttack(source) && !target.cloudPlayerUsed) {
    amount = Math.ceil(amount / 2);
    target.cloudPlayerUsed = true;
    log(`${target.name} 的雲玩家使本次攻擊傷害減半。`);
  }
  if (
    target.id === "player" &&
    b?.powers?.giveYouSmoke &&
    b.currentCardType?.includes("小菸系") &&
    (!source || source.side !== "enemy")
  ) {
    const enemies = b.enemies.filter((unit) => unit.hp > 0);
    if (enemies.length) {
      const picked = sample(enemies);
      picked.hp = Math.max(0, picked.hp - amount);
      log(`這根給你觸發，${picked.name} 代替親親子失去 ${amount} 點生命。`);
      checkCharmExecute(picked);
      if (picked.hp <= 0) log(`${picked.name} 倒下了。`);
    }
    return 0;
  }
  amount = Math.max(0, amount - (target.damageReduction || 0));
  if (target.id === "player" && source?.side === "enemy" && state.player?.items?.includes("可愛狗狗雕像")) {
    amount = Math.max(0, amount - 2);
  }
  const blocked = Math.min(target.block || 0, amount);
  target.block = Math.max(0, (target.block || 0) - blocked);
  const hpDamage = amount - blocked;
  if (target.id === "player" && source?.side === "enemy" && b?.powers?.ashtrayBlock) {
    addToHand("小剪刀");
    log("煙灰缸格檔觸發，獲得 1 張小剪刀。");
  }
  if (hpDamage > 0) {
    target.hp = Math.max(0, target.hp - hpDamage);
    if (target.kind === "audience") target.damageTakenThisBattle = (target.damageTakenThisBattle || 0) + hpDamage;
    if (target.id === "player" && b.smokeCharmTriggers > 0 && b.currentCardType?.includes("小菸系")) {
      const enemies = b.enemies.filter((unit) => unit.hp > 0);
      if (enemies.length) addCharm(sample(enemies), hpDamage);
      b.smokeCharmTriggers -= 1;
    }
  }
  checkCharmExecute(target);
  if (target.hp <= 0) {
    handleUnitDefeated(target);
    log(`${target.name} 倒下了。`);
  }
  return hpDamage;
}

function sourceNameIsAttack(source) {
  return !source || source.side === "ally" || typeof source === "string";
}

function heal(target, amount) {
  target.hp = Math.min(target.maxHp, target.hp + amount);
  log(`${target.name} 回復 ${amount} 點生命。`);
}

function addCharm(target, amount) {
  if (!target || target.hp <= 0) return false;
  if (kutaVoiceNegatesDebuff(target, "魅惑")) return false;
  amount += state.battle?.powers?.charmBonus || 0;
  target.charm = (target.charm || 0) + amount;
  log(`${target.name} 獲得 ${amount} 魅惑，目前 ${target.charm}。`);
  if (state.battle?.powers?.lifeCharm && target.side === "enemy" && amount > 0) {
    target.hp = Math.max(0, target.hp - amount);
    heal(state.battle.player, amount);
    log(`你不是還有生命嗎觸發，${target.name} 失去 ${amount} 生命。`);
  }
  if (state.battle?.powers?.oooLove && target.side === "enemy" && amount > 0) {
    addToHand("小剪刀");
    log("歐歐歐愛觸發，獲得 1 張小剪刀。");
  }
  return checkCharmExecute(target);
}

function cleanseRandomPlayerDebuff() {
  const player = state.battle.player;
  const debuffs = [];
  if (player.attackDown) debuffs.push("attackDown");
  if (player.noAttack) debuffs.push("noAttack");
  if (player.noDamage) debuffs.push("noDamage");
  if (!debuffs.length) {
    log("透心涼茶：沒有可淨化的負面效果。");
    return;
  }
  const picked = sample(debuffs);
  if (picked === "attackDown") {
    player.attackDown = 0;
    log("透心涼茶淨化了攻擊下降。");
  }
  if (picked === "noAttack") {
    player.noAttack = false;
    log("透心涼茶淨化了無法攻擊。");
  }
  if (picked === "noDamage") {
    player.noDamage = false;
    log("透心涼茶淨化了無法造成傷害。");
  }
}

function transformEnemyToKissSupport(target) {
  if (!target || target.side !== "enemy" || target.hp <= 0) return;
  const rates = enemyRatesForBattle(state.battle.battleIndex);
  const bodyRarity = rollRarityFromRates(rates);
  const body = bodyQualityRanges[bodyRarity];
  const traitRarity = rollRarityFromRates(rates);
  const randomTrait = pickEnemyTrait(traitRarity, new Set(["親親幫"]), getEnemyTraitCounts(state.battle.enemies));
  const maxHp = randBetween(body.hp[0], body.hp[1]);
  target.bodyRarity = bodyRarity;
  target.maxHp = maxHp;
  target.hp = maxHp;
  target.attack = randBetween(body.attack[0], body.attack[1]);
  target.block = 0;
  target.counterStance = false;
  target.traits = ["親親幫", randomTrait.name];
  target.traitDetails = [
    { name: "親親幫", rarity: "special", text: "此單位攻擊傷害固定為 0。攻擊時回復被攻擊者 3 點生命。" },
    { ...randomTrait, rarity: traitRarity },
  ];
  target.moneyReward = body.money + (traitMoney[traitRarity] || 0);
  randomTrait.apply?.(target);
  enforceFixedAttack(target);
  target.baseAttack = target.attack;
  log(`${target.name} 轉生為親親幫單位。`);
}

function transformToKutaFan(target) {
  if (!target || target.side !== "enemy" || target.hp <= 0) return;
  const rarity = rollRarityFromRates(enemyRatesForBattle(state.battle.battleIndex));
  const randomTrait = pickEnemyTrait(rarity, new Set(["久田戀愛粉"]), getEnemyTraitCounts(state.battle.enemies));
  target.name = "久田戀愛粉";
  target.bodyRarity = "normal";
  target.maxHp = 25;
  target.hp = 25;
  target.attack = 3;
  target.baseAttack = 3;
  target.block = 0;
  target.counterStance = false;
  target.traits = ["久田戀愛粉", randomTrait.name];
  target.traitDetails = [
    { name: "久田戀愛粉", rarity: "special", text: "代為承受久田受到的一半攻擊傷害。" },
    { ...randomTrait, rarity },
  ];
  target.moneyReward = 100 + (traitMoney[rarity] || 0);
  randomTrait.apply?.(target);
  target.baseAttack = target.attack;
  setEnemyIntent(target, "defend", { persistNextTurn: true });
}

function checkCharmExecute(target) {
  if (!target || target.kind === "vt") return false;
  if ((target.charm || 0) >= target.hp && target.hp > 0) {
    const spreadCharm = target.charm || 0;
    target.hp = 0;
    log(`親親子飛吻擊敗了 ${target.name}。`);
    handleUnitDefeated(target);
    if (state.battle.powers?.donationFee) {
      const money = spreadCharm * 10;
      state.player.money += money;
      log(`斗內費觸發，獲得 ${money} 元。`);
    }
    if (state.battle.powers?.lovePreacher) {
      const targets = liveEnemyUnits().filter((unit) => unit.id !== target.id);
      if (targets.length) addCharm(sample(targets), spreadCharm);
    }
    return true;
  }
  return false;
}

function handleUnitDefeated(unit) {
  if (!unit || unit.defeatHandled) return;
  unit.defeatHandled = true;
  if (unit.side === "enemy") {
    state.battle.defeatedMoney = (state.battle.defeatedMoney || 0) + (unit.moneyReward || 0);
    if (!unit.isMiniboss && !unit.noFameOnDefeat) {
      state.battle.defeatedFameMoney = (state.battle.defeatedFameMoney || 0) + (unit.moneyReward || 0);
    }
    fillEnemySlots();
  }
}

function afterUnitAttack(attacker) {
  if (attacker.traits?.includes("誇誇幫")) {
    const candidates = [state.battle.player, ...state.battle.allies].filter((unit) => unit.hp > 0);
    if (candidates.length) {
      const target = sample(candidates);
      addTemporaryAttack(target, 2);
      log(`${attacker.name} 的誇誇幫發動，${target.name} 本回合攻擊力 +2。`);
    }
  }
}

function hasTrait(unit, traitName) {
  return Boolean(unit?.traits?.includes(traitName));
}

function enforceFixedAttack(unit) {
  if (hasTrait(unit, "親親幫")) {
    unit.fixedAttack = 0;
    unit.attack = 0;
    return;
  }
  if (hasTrait(unit, "廠商爸爸")) {
    unit.fixedAttack = 5;
    unit.attack = 5;
  }
}

function addTemporaryAttack(target, amount) {
  if (target.fixedAttack !== undefined || hasTrait(target, "廠商爸爸")) {
    enforceFixedAttack(target);
    return;
  }
  target.attack += amount;
  target.tempAttackBuff = (target.tempAttackBuff || 0) + amount;
}

function addAttackDown(target, amount, sourceSide = "ally") {
  if (sourceSide === "ally" && kutaVoiceNegatesDebuff(target, "攻擊下降")) return;
  if (target.fixedAttack !== undefined || hasTrait(target, "廠商爸爸")) {
    enforceFixedAttack(target);
    return;
  }
  target.attackDown = (target.attackDown || 0) + amount;
  if (target.id !== "player") target.attack = Math.max(0, target.attack - amount);
}

function clearTemporaryAttackBuffs() {
  [state.battle.player, ...state.battle.allies, ...(state.battle.boss ? [state.battle.boss] : []), ...state.battle.enemies].forEach((unit) => {
    if (!unit.tempAttackBuff) return;
    unit.attack = Math.max(0, unit.attack - unit.tempAttackBuff);
    unit.tempAttackBuff = 0;
    enforceFixedAttack(unit);
  });
}

function clearRoundTemporaryStatuses() {
  [state.battle.player, ...state.battle.allies, ...(state.battle.boss ? [state.battle.boss] : []), ...state.battle.enemies].forEach((unit) => {
    if (unit.tempAttackBuff) {
      unit.attack = Math.max(0, unit.attack - unit.tempAttackBuff);
      unit.tempAttackBuff = 0;
    }
    if (unit.attackDown) {
      if (unit.id !== "player") unit.attack += unit.attackDown;
      unit.attackDown = 0;
    }
    unit.noAttack = false;
    unit.noDamage = false;
    if (!unit.intentPersistsNextTurn) {
      unit.intentTargetId = null;
      unit.seasickNoPlayer = false;
    }
    enforceFixedAttack(unit);
  });
}

function draw(count) {
  const b = state.battle;
  for (let i = 0; i < count; i += 1) {
    if (b.hand.length >= (b.handLimit || 10)) {
      log("手牌已達上限，停止抽牌。");
      return;
    }
    if (!b.deck.length) {
      if (!b.discard.length) {
        log("牌庫與棄牌堆都沒有可抽的牌。");
        return;
      }
      b.deck = shuffle(b.discard);
      b.discard = [];
      log("牌庫抽空，洗入棄牌堆。");
    }
    const card = drawNextCardFromDeck(b);
    if (card) b.hand.push(card);
  }
}

function drawNextCardFromDeck(b) {
  const mustDrawCards = b.deck.filter((card) => isMustDrawCard(card));
  if (mustDrawCards.length) {
    const picked = sample(mustDrawCards);
    b.deck = b.deck.filter((card) => card.id !== picked.id);
    return picked;
  }
  return b.deck.shift();
}

function isMustDrawCard(card) {
  return Boolean(card?.mustDraw || (card?.text || "").includes("必有"));
}

function endPlayerTurn() {
  const b = state.battle;
  const retained = b.hand.filter((card) => card.retain);
  b.discard.push(...b.hand.filter((card) => !card.retain && !card.generated && !isBattleExhaustCard(card)));
  b.hand = retained;
  b.selectedCard = null;
  b.selectedAttacker = null;
  b.scissorStorm = false;
  b.enemies.forEach((enemy) => {
    enemy.counterStance = false;
  });
  enemyTurn();
}

function enemyTurn() {
  const b = state.battle;
  b.phase = "enemy";
  render();
  setTimeout(() => {
    if (b.boss?.hp > 0) runEnemyAction(b.boss);
    b.enemies.filter((e) => e.hp > 0).forEach((enemy) => runEnemyAction(enemy));
    b.enemies.filter((e) => e.hp > 0 && e.traits?.includes("傳話幫")).forEach((enemy) => {
      adjacentEnemies(enemy).forEach((neighbor) => {
        if (neighbor.hp > 0) {
          log(`${enemy.name} 的傳話幫讓 ${neighbor.name} 多行動一次。`);
          runEnemyAction(neighbor);
        }
      });
    });
    b.enemies.filter((e) => e.hp > 0 && e.traits?.includes("丟球高手")).forEach((enemy) => {
      log(`${enemy.name} 自爆，造成 ${enemy.hp} 點傷害。`);
      damage(b.player, enemy.hp, enemy);
      enemy.hp = 0;
    });
    fillEnemySlots();
    grantSponsorEndTurnMoney();
    clearRoundTemporaryStatuses();
    checkWinLose();
    const enemySideAlive = b.enemies.some((e) => e.hp > 0) || (b.boss?.hp > 0);
    if (b.player.hp > 0 && enemySideAlive) startPlayerTurn();
    else render();
  }, 450);
}

function grantSponsorEndTurnMoney() {
  const sponsors = state.battle.enemies.filter((enemy) => enemy.hp > 0 && enemy.traits?.includes("大乾爹"));
  if (!sponsors.length) return;
  const amount = sponsors.length * 100;
  state.player.money += amount;
  sponsors.forEach((enemy) => log(`${enemy.name} 的大乾爹給予你 100 元。`));
}

function runEnemyAction(enemy) {
  if (enemy?.isMiniboss && enemy.name === "久田") {
    runKutaAction(enemy);
    enemy.turnIndex += 1;
    return;
  }
  if (enemy.intent === "coverEars") {
    log(`${enemy.name} 摀住耳朵，停止行動。`);
    enemy.turnIndex += 1;
    return;
  }
  if (enemy.intent === "knockdown") {
    log(`${enemy.name} 倒地，停止行動。`);
    enemy.turnIndex += 1;
    return;
  }
  if (enemy.noAttack || (enemy.traits?.includes("暈船仔") && state.battle.player.hp < state.battle.player.maxHp * 0.5)) {
    log(`${enemy.name} 停止攻擊。`);
    return;
  }
  enemy.counterStance = false;
  if (enemy.intent === "defend") {
    const amount = enemyIntentAmount(enemy, "defend");
    enemy.block += amount;
    log(`${enemy.name} 防守，獲得 ${amount} 點防禦。`);
  } else if (enemy.intent === "counter") {
    enemy.counterStance = true;
    log(`${enemy.name} 擺出反擊姿態。`);
  } else {
    const multiplier = enemy.intent === "heavy" ? enemyHeavyMultiplier(enemy) : 1;
    goblinAttack(enemy, multiplier);
    if (enemy.traits?.includes("打字高手") && enemy.hp > 0) goblinAttack(enemy, multiplier);
  }
  enemy.turnIndex += 1;
}

function runKutaAction(kuta) {
  kuta.counterStance = false;
  reduceKutaBiggestDebuff(kuta);
  healKutaFans();
  if (kuta.intent === "world") {
    state.battle.nextPlayerCardPlayLimit = 1;
    log("久田使用「世界」，下回合你只能打出 1 張卡片。");
  } else if (kuta.intent === "thigh") {
    state.battle.enemies
      .filter((unit) => unit.hp > 0 && unit.traits?.includes("久田戀愛粉"))
      .forEach((unit) => addTemporaryAttack(unit, 5));
    log("久田使用「露大腿」，久田戀愛粉攻擊力 +5。");
  } else if (kuta.intent === "reincarnate") {
    reincarnateToKutaFan();
  } else if (kuta.intent === "defend") {
    const amount = enemyIntentAmount(kuta, "defend");
    kuta.block += amount;
    log(`久田防守，獲得 ${amount} 點防禦。`);
  } else {
    const multiplier = kuta.intent === "heavy" ? enemyHeavyMultiplier(kuta) : 1;
    goblinAttack(kuta, multiplier);
  }
}

function healKutaFans() {
  state.battle.enemies
    .filter((unit) => unit.hp > 0 && unit.traits?.includes("久田戀愛粉"))
    .forEach((unit) => heal(unit, 2));
}

function kutaVoiceNegatesDebuff(target, debuffName) {
  const b = state.battle;
  const kuta = b?.boss;
  if (!kuta || kuta.hp <= 0 || kuta.name !== "久田") return false;
  if (!target || target.side !== "enemy" || target.id === kuta.id) return false;
  if (b.kutaVoiceNegatedThisRound) return false;
  b.kutaVoiceNegatedThisRound = true;
  log(`久田的天籟美聲無效了 ${target.name} 的${debuffName}。`);
  return true;
}

function reduceKutaBiggestDebuff(kuta) {
  const debuffs = [
    { key: "charm", value: kuta.charm || 0 },
    { key: "attackDown", value: kuta.attackDown || 0 },
  ].filter((item) => item.value > 0).sort((a, b) => b.value - a.value);
  if (!debuffs.length) return;
  const picked = debuffs[0];
  const reduce = Math.min(3, picked.value);
  kuta[picked.key] = Math.max(0, picked.value - reduce);
  if (picked.key === "attackDown") kuta.attack += reduce;
  log(`久田的專業主播使 ${picked.key === "charm" ? "魅惑" : "攻擊下降"} 減少 ${reduce}。`);
}

function reincarnateToKutaFan() {
  const target = state.battle.enemies.find((unit) => unit.hp > 0 && !unit.traits?.includes("久田戀愛粉"));
  if (!target) {
    log("久田想轉生，但沒有合適目標。");
    return;
  }
  transformToKutaFan(target);
  log(`久田使用「轉生」，${target.name} 成為久田戀愛粉。`);
}

function adjacentEnemies(enemy) {
  const index = state.battle.enemies.findIndex((unit) => unit.id === enemy.id);
  return [state.battle.enemies[index - 1], state.battle.enemies[index + 1]].filter(Boolean);
}

function getEnemyTraitCounts(enemies = state.battle?.enemies || []) {
  return enemies
    .filter((enemy) => enemy.hp > 0)
    .flatMap((enemy) => enemy.traits || [])
    .reduce((counts, trait) => {
      counts[trait] = (counts[trait] || 0) + 1;
      return counts;
    }, {});
}

function fillEnemySlots() {
  const b = state.battle;
  b.enemies = b.enemies.filter((enemy) => enemy.hp > 0);
  while (b.enemies.length < 3 && b.enemyReserve > 0) {
    b.enemySpawned = (b.enemySpawned || 0) + 1;
    b.enemyReserve -= 1;
    const next = createEnemy(b.enemySpawned, b.battleIndex, getEnemyTraitCounts(b.enemies));
    b.enemies.push(next);
    log(`${next.name} 登場。`);
    applyEnemyEntranceTraits(next);
  }
}

function goblinAttack(enemy, multiplier) {
  if (enemy.noAttack) {
    log(`${enemy.name} 無法攻擊。`);
    return;
  }
  const intended = enemy.intent === "seasick" ? chooseSeasickTarget(enemy) : (enemy.intentTargetId ? findUnit(enemy.intentTargetId) : null);
  const target = intended && intended.hp > 0 ? intended : chooseEnemyTarget();
  if (!target) {
    log(`${enemy.name} 找不到能攻擊的目標。`);
    return;
  }
  if (enemy.traits?.includes("親親幫")) {
    heal(target, 3);
    log(`${enemy.name} 的親親幫回復 ${target.name} 3 點生命。`);
    return;
  }
  const amount = enemy.noDamage ? 0 : Math.max(0, Math.ceil(enemyIntentAttack(enemy) * multiplier) - (state.battle.enemyDamageReduction || 0));
  log(`${enemy.name}${multiplier > 1 ? " 使用重擊" : " 攻擊"} ${target.name}，造成 ${amount} 點傷害。`);
  damage(target, amount, enemy);
}

function chooseSeasickTarget(enemy) {
  const b = state.battle;
  const candidates = [b.player, ...b.allies, ...b.enemies].filter((unit) => {
    if (unit.hp <= 0) return false;
    if (enemy.seasickNoPlayer && unit.id === "player") return false;
    return true;
  });
  return sample(candidates.length ? candidates : [enemy]);
}

function chooseEnemyTarget() {
  const b = state.battle;
  const aliveAllies = [b.player, ...b.allies].filter((u) => u.hp > 0 && !(u.id === "player" && b.playerCannotBeAttacked));
  const taunts = aliveAllies.filter((u) => u.taunt);
  if (taunts.length) return sample(taunts);
  if (Math.random() < 0.7 && b.player.hp > 0 && !b.playerCannotBeAttacked) return b.player;
  const audienceTargets = aliveAllies.filter((u) => u.kind === "audience");
  return sample(audienceTargets.length ? audienceTargets : aliveAllies);
}

function startPlayerTurn() {
  const b = state.battle;
  b.turn += 1;
  b.playedCardsThisTurn = 0;
  b.cardPlayLimit = b.nextPlayerCardPlayLimit || null;
  b.nextPlayerCardPlayLimit = null;
  b.kutaVoiceNegatedThisRound = false;
  checkWinLose();
  if (b.phase === "won" || b.phase === "lost") {
    render();
    return;
  }
  b.phase = "player";
  b.energy = b.maxEnergy;
  b.enemyDamageReduction = 0;
  b.playerCannotBeAttacked = false;
  b.playerImmuneToEnemyDamage = false;
  if (b.powers) b.powers.ashtrayBlock = false;
  b.player.damageReduction = 0;
  b.allies.forEach((u) => {
    u.acted = false;
    if (u.traits?.includes("肥宅") && u.hp > 0) heal(u, 3);
    if (u.traits?.includes("善良觀眾") && u.hp > 0) {
      b.player.block += 2;
      log(`${u.name} 提供親親子 2 點防禦。`);
    }
    if (u.traits?.includes("危險斗內份子") && u.hp > 0) damage(u, 4);
  });
  b.enemies.forEach((e) => {
    e.noCounter = false;
    e.cloudPlayerUsed = false;
  });
  b.playedTags = [];
  b.scissorStorm = false;
  b.consumptionGeniusUsed = false;
  applyEnemyStartOfTurnTraits();
  assignEnemyIntents();
  applyDrawnMapConfusion();
  draw(5);
  render();
}

function applyEnemyStartOfTurnTraits() {
  const b = state.battle;
  b.enemies.filter((enemy) => enemy.hp > 0).forEach((enemy) => {
    if (enemy.traits?.includes("危險斗內份子")) damage(enemy, 4);
    if (enemy.traits?.includes("肥宅")) heal(enemy, 3);
    if (enemy.traits?.includes("釣魚高手")) {
      const targets = [b.player, ...b.enemies].filter((unit) => unit.hp > 0);
      const picked = sample(targets);
      picked.noAttack = true;
      if (picked.id === "player") picked.noDamage = true;
      log(`${enemy.name} 的釣魚高手使 ${picked.name} 無法攻擊。`);
    }
    if (enemy.traits?.includes("通靈仔") && b.hand.length) {
      const card = sample(b.hand);
      card.cost = (card.cost || 0) + 1;
      log(`${enemy.name} 的通靈仔使「${card.name}」耗能 +1。`);
    }
  });
}

function enemyIntent(enemy) {
  if (enemy.traits?.includes("丟球高手")) return `自爆 ${enemy.hp}`;
  if (enemy.intent === "world") return "世界";
  if (enemy.intent === "thigh") return "露大腿";
  if (enemy.intent === "reincarnate") return "轉生";
  if (enemy.intent === "defend") return `防守 ${enemyIntentAmount(enemy, "defend")}`;
  if (enemy.intent === "counter") return `反擊 ${enemyIntentAmount(enemy, "counter")}`;
  if (enemy.intent === "heavy") return `重擊 ${enemyIntentAmount(enemy, "heavy")}`;
  if (enemy.intent === "seasick") return "暈船";
  if (enemy.intent === "coverEars") return "摀住耳朵";
  if (enemy.intent === "knockdown") return "倒地";
  return `攻擊 ${enemyIntentAmount(enemy, "attack")}`;
}

function enemyIntentAttack(enemy) {
  if (enemy?.fixedAttack !== undefined) return enemy.fixedAttack;
  return Math.max(0, enemy?.attack ?? enemy?.baseAttack ?? 0);
}

function enemyHeavyMultiplier(enemy) {
  return enemy?.bodyRarity === "epic" || enemy?.bodyRarity === "legendary" ? 2 : 1.5;
}

function enemyIntentAmount(enemy, intent = enemy?.intent) {
  const base = enemyIntentAttack(enemy);
  if (intent === "heavy") return Math.ceil(base * enemyHeavyMultiplier(enemy));
  return Math.ceil(base);
}

function setEnemyIntent(enemy, intent, options = {}) {
  if (!enemy || enemy.hp <= 0) return;
  enemy.intent = intent;
  enemy.intentTargetId = options.intentTargetId || null;
  enemy.seasickNoPlayer = Boolean(options.seasickNoPlayer);
  enemy.counterStance = intent === "counter";
  if (options.persistNextTurn) enemy.intentPersistsNextTurn = true;
}

function assignEnemyIntents() {
  const b = state.battle;
  if (b.boss?.hp > 0) assignKutaIntent(b.boss);
  b.enemies.forEach((enemy) => {
    if (enemy.intentPersistsNextTurn) {
      enemy.intentPersistsNextTurn = false;
      enemy.counterStance = enemy.intent === "counter";
      return;
    }
    setEnemyIntent(
      enemy,
      (enemy.bodyRarity === "epic" || enemy.bodyRarity === "legendary") && Math.random() < 0.1 ? "heavy" : sample(["attack", "defend", "counter"])
    );
  });
}

function assignKutaIntent(kuta) {
  if (!kuta || kuta.hp <= 0) return;
  const cycle = kuta.intentCycle || ["thigh", "attack", "world", "reincarnate", "defend"];
  const intent = cycle[kuta.intentCycleIndex % cycle.length];
  kuta.intentCycleIndex = (kuta.intentCycleIndex || 0) + 1;
  setEnemyIntent(kuta, intent);
}

function applyDrawnMapConfusion() {
  const b = state.battle;
  if (!state.player?.items?.includes("亂畫的地圖") || b.drawnMapUsed) return;
  const target = b.enemies.find((enemy) => enemy.hp > 0 && (enemy.intent === "attack" || enemy.intent === "heavy"));
  if (!target) return;
  setEnemyIntent(target, "seasick", { persistNextTurn: true });
  b.drawnMapUsed = true;
  log(`亂畫的地圖觸發，${target.name} 的攻擊目標混亂。`);
}

function findUnit(id) {
  const b = state.battle;
  return [b.player, ...b.allies, ...(b.boss ? [b.boss] : []), ...b.enemies].find((u) => u.id === id);
}

function liveEnemyUnits(includeBoss = true) {
  const b = state.battle;
  if (!b) return [];
  return [
    ...(includeBoss && b.boss?.hp > 0 ? [b.boss] : []),
    ...b.enemies.filter((unit) => unit.hp > 0),
  ];
}

function log(line) {
  state.battle.log.push(line);
}

function checkWinLose() {
  const b = state.battle;
  const survivedTurns = !b.isMinibossBattle && b.turn > b.maxTurns;
  const clearedEnemies = !b.isMinibossBattle && b.enemies.every((e) => e.hp <= 0) && (b.enemyReserve || 0) === 0;
  const bossDefeated = b.isMinibossBattle && b.boss && b.boss.hp <= 0;
  if (survivedTurns || clearedEnemies || bossDefeated) {
    b.phase = "won";
  }
  if (b.player.hp <= 0) {
    if (trySecondVRevive()) return;
    b.phase = "lost";
  }
}

function trySecondVRevive() {
  if (!state.player?.items?.includes("第二套V皮") || state.player.secondVUsed) return false;
  state.player.secondVUsed = true;
  state.player.fameValue = Math.floor((state.player.fameValue || 0) / 2);
  state.battle.player.hp = state.battle.player.maxHp;
  log("第二套V皮觸發，親親子滿血復活，但失去一半名氣值。");
  return true;
}

function checkBattleEndOverlay() {
  const b = state.battle;
  if (b.phase === "won") {
    return `<div class="overlay"><div class="modal"><h2>直播結束</h2><p>親親子結束了第 ${b.battleIndex} 場直播。</p><button class="primary-button" data-postbattle>進入獎勵</button></div></div>`;
  }
  if (b.phase === "lost") {
    return `<div class="overlay"><div class="modal"><h2>直播事故</h2><p>親親子被怪物擊倒，直播現場失控了。</p><button class="primary-button" data-postbattle>查看後果</button></div></div>`;
  }
  return "";
}

function finishBattle() {
  const b = state.battle;
  if (b.phase === "lost") {
    state.graduation = {
      check: { label: "直播事故", requiredName: "不要被擊倒" },
      fameValue: state.player.fameValue || 0,
      fameName: currentFameLevel().name,
      stage: "ending",
    };
    state.battle = null;
    state.firestormStep = 0;
    state.screen = "firestormEnding";
    render();
    return;
  }
  const lost = Math.max(0, state.player.maxHp - b.player.hp);
  const recovered = Math.ceil(lost * 0.3);
  const rawMoney = b.defeatedMoney || 0;
  const fameBaseMoney = b.defeatedFameMoney || 0;
  const moneyRate = b.phase === "lost" ? 0.25 : 1;
  const moneyReward = Math.floor(rawMoney * moneyRate);
  const fameMultiplier = b.fameRewardMultiplier || 1;
  const fameReward = Math.floor((fameBaseMoney / 200) * fameMultiplier);
  state.player.money += moneyReward;
  addFameValue(fameReward);
  state.player.hp = Math.min(state.player.maxHp, b.player.hp + recovered);
  state.player.smallBattlesWon = (state.player.smallBattlesWon || 0) + 1;
  state.postBattle = {
    battleIndex: b.battleIndex,
    result: b.phase,
    recovered,
    rawMoney,
    moneyRate,
    moneyReward,
    fameReward,
    fameMultiplier,
    actionsLeft: 2,
    log: [`親親子回復 ${recovered} 點生命。`, `獲得 ${fameReward} 名氣值。`],
  };
  if (b.isMinibossBattle && runRoute[currentRouteIndex()]?.id === "miniboss1") {
    state.versionEndStep = 0;
    state.screen = "versionEnd";
    state.battle = null;
    render();
    return;
  }
  if (b.battleIndex === 1 && triggerGraduationCheck("tutorial")) return;
  state.cardRewardChoices = generateCardRewardChoices();
  state.screen = "cardReward";
  state.battle = null;
  render();
}

function renderCardReward() {
  const choices = state.cardRewardChoices || [];
  app.innerHTML = `
    <main class="screen">
      <section class="page">
        <div class="reward-panel" style="padding:28px">
          <div class="topbar">
            <div>
              <h1>戰鬥獎勵</h1>
              <p class="subtle">${renderMoneyRewardText(state.postBattle)}選擇 1 張卡加入目前牌組。</p>
            </div>
            <span class="pill">三選一</span>
          </div>
          <div class="cardpool-grid">
            ${choices.map(({ rarity, card }, index) => `
              <article class="pool-card selectable rarity-border-${rarity}" data-reward-card="${index}">
                <div class="pool-card-head">
                  <h3>${card.name}</h3>
                  <span class="pill rarity-${rarity}">${rarityLabels[rarity]}</span>
                </div>
                <dl class="pool-card-spec">
                  <div><dt>費用</dt><dd>${cardBaseCost(card)} 能量</dd></div>
                  <div><dt>系列</dt><dd>${renderSeriesTags(card.type)}</dd></div>
                  <div class="full"><dt>說明</dt><dd>${keywordText(card.text || "")}</dd></div>
                </dl>
              </article>`).join("")}
          </div>
          <div class="actions">
            <button class="ghost-button" data-skip-card>不拿卡</button>
          </div>
        </div>
      </section>
    </main>`;
  app.querySelectorAll("[data-reward-card]").forEach((el) => {
    el.onclick = () => {
      const picked = choices[Number(el.dataset.rewardCard)]?.card;
      if (picked) {
        state.player.deck.push(makeCard(picked.name));
        state.postBattle.log.push(`獲得卡牌「${picked.name}」。`);
      }
      state.screen = "postbattle";
      render();
    };
  });
  app.querySelector("[data-skip-card]").onclick = () => {
    state.postBattle.log.push("沒有拿取卡牌。");
    state.screen = "postbattle";
    render();
  };
}

function renderMoneyRewardText(postBattle) {
  if (!postBattle) return "金錢獎勵：0 元。";
  const fameText = `名氣值 +${postBattle.fameReward || 0}。`;
  if (postBattle.result === "lost") {
    return `金錢獎勵：${postBattle.rawMoney || 0} 元 × 1/4 = ${postBattle.moneyReward || 0} 元。${fameText}`;
  }
  return `金錢獎勵：${postBattle.moneyReward || 0} 元。${fameText}`;
}

function renderGraduationEnding() {
  const ending = state.graduation || {};
  if ((ending.stage || "dismissal") === "dismissal") {
    renderStoryScreen({
      stepKey: "graduationStep",
      finalLabel: "離開",
      lines: [
        "今天一大早，你就被叫來 XD娛樂辦公室。",
        "蕭證明：很遺憾地告訴你由於名氣不夠，公司決定.....請你現在馬上給我離開這棟房子！而且不准你再回來！",
      ],
      onDone: () => {
        state.graduation.stage = "ending";
        state.graduationStep = 0;
        render();
      },
    });
    return;
  }
  app.innerHTML = `
    <main class="screen">
      <section class="page black-story graduation-ending">
        <div class="graduation-copy">
          <h1>畢業結局</h1>
          <p>目前名氣值 ${ending.fameValue || 0}，稱號「${ending.fameName || currentFameLevel().name}」。</p>
        </div>
        <button class="primary-button reincarnate-button" data-title>是否轉生</button>
      </section>
    </main>`;
  app.querySelector("[data-title]").onclick = () => {
    state.screen = "title";
    state.player = null;
    state.battle = null;
    state.graduation = null;
    render();
  };
}

function renderFirestormEnding() {
  renderStoryScreen({
    stepKey: "firestormStep",
    background: "black",
    finalLabel: "進入畢業結局",
    lines: [
      "因為直播事故導致大炎上。",
      "你被 XD娛樂踢出去了。",
    ],
    onDone: () => {
      state.firestormStep = 0;
      if (state.graduation) state.graduation.stage = "ending";
      state.screen = "graduation";
      render();
    },
  });
}

function renderVersionEnd() {
  renderStoryScreen({
    stepKey: "versionEndStep",
    background: "black",
    finalLabel: "回到開始畫面",
    lines: [
      "超越久田的你並沒有因此得意，因為你知道離成為台1V的旅程還有很長的路途....。",
      "目前版本到此為止，感謝你的體驗。有什麼建議都能提出。",
    ],
    onDone: () => {
      state.versionEndStep = 0;
      state.screen = "title";
      state.player = null;
      state.battle = null;
      state.postBattle = null;
      render();
    },
  });
}

function renderPostBattle() {
  const post = state.postBattle || { actionsLeft: 0, log: [] };
  const canContinue = post.actionsLeft <= 0;
  app.innerHTML = `
    <main class="screen">
      <section class="page">
        <div class="reward-panel" style="padding:28px">
          <h2>戰後行動</h2>
          <div class="deck-list">
            <article class="deck-entry">
              <span class="pill">狀態</span>
              <div>
                <p>${post.log.join("<br>")}</p>
              </div>
            </article>
            <article class="deck-entry">
              <span class="pill">行動</span>
              <div>
                <h3>剩餘 ${post.actionsLeft} 次</h3>
                <p>可以外出閒逛、休息一下或是精進自己。行動次數用完後可以開始下次直播。</p>
              </div>
            </article>
          </div>
          <div class="actions">
            <button class="ghost-button" data-wander ${post.actionsLeft <= 0 ? "disabled" : ""}>外出閒逛</button>
            <button class="secondary-button" data-upgrade ${post.actionsLeft <= 0 ? "disabled" : ""}>精進自己</button>
            <button class="secondary-button" data-rest ${post.actionsLeft <= 0 ? "disabled" : ""}>休息一下</button>
            <button class="primary-button" data-next ${!canContinue ? "disabled" : ""}>開始下次直播</button>
          </div>
        </div>
      </section>
    </main>`;
  app.querySelector("[data-wander]")?.addEventListener("click", () => {
    if (!usePostBattleAction()) return;
    handleWander();
  });
  app.querySelector("[data-rest]")?.addEventListener("click", () => {
    usePostBattleAction();
    const amount = Math.ceil(state.player.maxHp * 0.15);
    state.player.hp = Math.min(state.player.maxHp, state.player.hp + amount);
    state.postBattle.log.push(`休息一下：回復 ${amount} 點生命。`);
    render();
  });
  app.querySelector("[data-upgrade]")?.addEventListener("click", () => {
    state.screen = "upgrade";
    render();
  });
  app.querySelector("[data-next]")?.addEventListener("click", () => {
    advanceRunRoute();
  });
}

function usePostBattleAction() {
  if (!state.postBattle || state.postBattle.actionsLeft <= 0) return false;
  state.postBattle.actionsLeft -= 1;
  return true;
}

function handleWander() {
  if (state.player?.forcedNextWanderEvent) {
    const event = runEvents.find((item) => item.id === state.player.forcedNextWanderEvent);
    state.player.forcedNextWanderEvent = null;
    if (event) {
      state.player.seenEvents = [...(state.player.seenEvents || []), event.id];
      state.currentEvent = prepareRunEvent(event);
      state.eventLineIndex = 0;
      state.screen = "event";
      render();
      return;
    }
  }
  const isEventTest = new URLSearchParams(window.location.search).get("test") === "events";
  if (!isEventTest && Math.random() < 0.3) {
    handleNoEventWander("外出閒逛：沒事發生。");
    render();
    return;
  }
  const event = rollRunEvent();
  if (!event) {
    handleNoEventWander("外出閒逛：附近安靜得有點可怕，沒事發生。");
    render();
    return;
  }
  state.player.seenEvents = [...(state.player.seenEvents || []), event.id];
  state.currentEvent = prepareRunEvent(event);
  state.eventLineIndex = 0;
  state.screen = "event";
  render();
}

function handleNoEventWander(baseText) {
  if (state.player?.items?.includes("美食名簿")) {
    state.player.maxHp += 3;
    state.player.hp = Math.min(state.player.maxHp, state.player.hp + 3);
    state.postBattle.log.push(`${baseText}你依照美食名簿的推薦去了一家餐廳放鬆。`);
    return;
  }
  state.postBattle.log.push(baseText);
}

function prepareRunEvent(event) {
  if (!event.randomResults?.length) return event;
  const result = rollWeighted(event.randomResults);
  return {
    ...event,
    lines: [...(event.lines || [event.text]), result.text],
    outcome: result.outcome,
    effects: result.effects || [],
  };
}

function rollWeighted(options) {
  const total = options.reduce((sum, item) => sum + (item.weight || 0), 0);
  let roll = Math.random() * total;
  for (const item of options) {
    roll -= item.weight || 0;
    if (roll <= 0) return item;
  }
  return options[options.length - 1];
}

function rollRunEvent() {
  const seen = new Set(state.player?.seenEvents || []);
  const candidates = runEvents.filter((event) => !seen.has(event.id) && isRunEventAvailable(event));
  return candidates.length ? sample(candidates) : null;
}

function isRunEventAvailable(event) {
  if (event.scope === "forced") return false;
  if (event.scope === "initial") {
    const firstMinibossIndex = runRoute.findIndex((node) => node.id === "miniboss1");
    return currentRouteIndex() < firstMinibossIndex;
  }
  if (event.scope === "fame") {
    const fameLevel = baseFameLevel();
    const fameValue = state.player?.fameValue || 0;
    return fameLevel >= (event.minFameLevel ?? 0)
      && fameLevel <= (event.maxFameLevel ?? Infinity)
      && fameValue >= (event.minFameValue ?? 0)
      && fameValue <= (event.maxFameValue ?? Infinity);
  }
  return true;
}

function renderRunEvent() {
  const event = state.currentEvent;
  if (!event) {
    state.screen = "postbattle";
    render();
    return;
  }
  const lineIndex = Math.min(state.eventLineIndex || 0, (event.lines || [event.text]).length - 1);
  const lines = event.lines || [event.text];
  const hasOptions = Array.isArray(event.options) && event.options.length > 0;
  const isLastLine = lineIndex >= lines.length - 1;
  app.innerHTML = `
    <main class="event-screen">
      <section class="event-stage">
        <div class="event-placeholder">
        </div>
        <div class="event-dialogue">
          <div class="event-text">
            <p>${lines[lineIndex]}</p>
          </div>
          <div class="event-options">
            ${hasOptions && isLastLine ? event.options.map((option, index) => `
              <button class="event-option" data-event-option="${index}">
                <strong>${option.label}</strong>
                ${option.outcome ? `<span>${option.outcome}</span>` : ""}
              </button>
            `).join("") : `<button class="event-option" data-event-next><strong>${isLastLine ? "繼續" : "下一句"}</strong>${isLastLine && event.outcome ? `<span>${event.outcome}</span>` : ""}</button>`}
          </div>
        </div>
      </section>
    </main>`;
  app.querySelector("[data-event-next]")?.addEventListener("click", advanceRunEventLine);
  app.querySelectorAll("[data-event-option]").forEach((el) => {
    el.onclick = () => chooseRunEventOption(Number(el.dataset.eventOption));
  });
}

function advanceRunEventLine() {
  const event = state.currentEvent;
  const lines = event?.lines || [event?.text || ""];
  const lineIndex = state.eventLineIndex || 0;
  if (lineIndex < lines.length - 1) {
    state.eventLineIndex = lineIndex + 1;
    render();
    return;
  }
  state.postBattle.log.push(`外出閒逛：${event.outcome || "事件結束。"}`);
  const redirected = applyEventEffects(event.effects || []);
  if (redirected) {
    render();
    return;
  }
  state.currentEvent = null;
  state.eventLineIndex = 0;
  state.screen = "postbattle";
  render();
}

function chooseRunEventOption(index) {
  const event = state.currentEvent;
  const option = event?.options?.[index];
  if (!event || !option) return;
  if (option.lines?.length || option.randomResults?.length) {
    state.currentEvent = prepareEventOptionContinuation(event, option);
    state.eventLineIndex = 0;
    render();
    return;
  }
  state.postBattle.log.push(`外出閒逛：${option.outcome || "事件結束。"}`);
  const redirected = applyEventEffects(option.effects || []);
  if (redirected) {
    render();
    return;
  }
  state.currentEvent = null;
  state.eventLineIndex = 0;
  state.screen = "postbattle";
  render();
}

function prepareEventOptionContinuation(event, option) {
  const result = option.randomResults?.length ? rollWeighted(option.randomResults) : null;
  return {
    id: event.id,
    name: event.name,
    category: event.category,
    scope: event.scope,
    text: option.lines?.[0] || result?.text || option.outcome,
    lines: [...(option.lines || []), ...(result?.text ? [result.text] : [])],
    outcome: result?.outcome || option.outcome,
    effects: [...(option.effects || []), ...(result?.effects || [])],
  };
}

function applyEventEffects(effects) {
  let redirected = false;
  effects.forEach((effect) => {
    if (effect.type === "money") state.player.money = Math.max(0, state.player.money + effect.amount);
    if (effect.type === "fame") {
      state.player.fameValue = Math.max(0, (state.player.fameValue || 0) + effect.amount);
    }
    if (effect.type === "heal") state.player.hp = Math.min(state.player.maxHp, state.player.hp + effect.amount);
    if (effect.type === "healPercentMax") state.player.hp = Math.min(state.player.maxHp, state.player.hp + Math.ceil(state.player.maxHp * effect.percent));
    if (effect.type === "hp") state.player.hp = Math.max(1, Math.min(state.player.maxHp, state.player.hp + effect.amount));
    if (effect.type === "maxHp") {
      state.player.maxHp = Math.max(1, state.player.maxHp + effect.amount);
      state.player.hp = Math.min(state.player.maxHp, state.player.hp + Math.max(0, effect.amount));
    }
    if (effect.type === "addRandomCard") {
      const pool = cardPools[effect.rarity || "normal"] || cardPools.normal;
      state.player.deck.push(makeCard(sample(pool)));
    }
    if (effect.type === "addSpecificCard" && cards[effect.name]) {
      const count = Math.max(1, effect.count || 1);
      for (let i = 0; i < count; i += 1) state.player.deck.push(makeCard(effect.name));
    }
    if (effect.type === "addItem") {
      const item = eventItems[effect.item];
      if (item && addRewardToBackpack(item)) {
        item.apply?.(state.player);
      } else if (item) {
        state.postBattle.log.push("背包已滿，無法獲得道具。");
      }
    }
    if (effect.type === "blessCard") {
      state.pendingBlessing = effect.blessing;
      state.blessingNext = "postbattle";
      state.currentEvent = null;
      state.eventLineIndex = 0;
      state.screen = "blessing";
      redirected = true;
    }
    if (effect.type === "storeBlessing") {
      state.player.storedBlessings ||= [];
      state.player.storedBlessings.push(effect.blessing);
      state.postBattle?.log?.push(`獲得${effect.blessing}。`);
    }
    if (effect.type === "setForcedNextWanderEvent") {
      state.player.forcedNextWanderEvent = effect.eventId;
    }
    if (effect.type === "upgradeRandomCard") {
      const cardsToUpgrade = state.player.deck.filter((card) => card.upgradeText && !card.upgraded);
      const picked = cardsToUpgrade.length ? sample(cardsToUpgrade) : null;
      if (picked) {
        picked.text = picked.upgradeText;
        if (picked.upgradeCost !== undefined) picked.cost = picked.upgradeCost;
        picked.upgraded = true;
      }
    }
    if (effect.type === "removeCards") {
      state.player.pendingRemove = effect.amount || 1;
      state.removeCardNext = "postbattle";
      state.currentEvent = null;
      state.eventLineIndex = 0;
      state.screen = "removeCard";
      redirected = true;
    }
    if (effect.type === "nextBattleDamageTakenMultiplier") {
      state.player.nextBattleDamageTakenMultiplier = effect.amount;
    }
    if (effect.type === "nextBattleFameMultiplier") {
      state.player.nextBattleFameMultiplier = effect.amount;
    }
  });
  return redirected;
}

function renderUpgradeCards() {
  const upgradable = state.player.deck.filter((card) => card.upgradeText && !card.upgraded);
  app.innerHTML = `
    <main class="screen">
      <section class="page">
        <div class="topbar">
          <div><h1>精進自己</h1><p class="subtle">選擇目前牌組中的 1 張牌升級。</p></div>
          <button class="ghost-button" data-back>返回</button>
        </div>
        <div class="cardpool-grid">
          ${upgradable.length
            ? upgradable.map((card) => `
              <article class="pool-card selectable" data-upgrade-card="${card.id}">
                <div class="pool-card-head"><h3>${card.name}</h3><span class="pill">${cardBaseCost(card)} 能量</span></div>
                <dl class="pool-card-spec">
                  <div><dt>目前</dt><dd>${keywordText(card.text || "")}</dd></div>
                  <div><dt>升級</dt><dd>${keywordText(card.upgradeText)}</dd></div>
                </dl>
              </article>`).join("")
            : `<article class="pool-card"><h3>沒有可升級卡牌</h3><p class="subtle">目前牌組中沒有升級資料。</p></article>`}
        </div>
      </section>
    </main>`;
  app.querySelector("[data-back]").onclick = () => {
    state.screen = "postbattle";
    render();
  };
  app.querySelectorAll("[data-upgrade-card]").forEach((el) => {
    el.onclick = () => {
      if (!usePostBattleAction()) return;
      const card = state.player.deck.find((item) => item.id === el.dataset.upgradeCard);
      if (card) {
        card.text = card.upgradeText;
        if (card.upgradeCost !== undefined) card.cost = card.upgradeCost;
        card.upgraded = true;
        state.postBattle.log.push(`精進自己：升級「${card.name}」。`);
      }
      state.screen = "postbattle";
      render();
    };
  });
}

function renderBlessingCards() {
  const blessing = state.pendingBlessing || "暴雪祝福";
  const deck = state.player?.deck || [];
  app.innerHTML = `
    <main class="screen">
      <section class="page">
        <div class="topbar">
          <div>
            <h1>${blessing}</h1>
            <p class="subtle">${blessingDescription(blessing)}</p>
          </div>
        </div>
        <div class="cardpool-grid">
          ${deck.length
            ? deck.map((card) => {
              const eligible = canBlessCard(card, blessing);
              return `
                <article class="pool-card selectable blessing-card ${eligible ? "" : "disabled"}" ${eligible ? `data-bless-card="${card.id}"` : ""}>
                  <div class="pool-card-head">
                    <h3>${card.name}</h3>
                    <span class="pill">${eligible ? `${cardBaseCost(card)} 能量` : "不可祝福"}</span>
                  </div>
                  <dl class="pool-card-spec">
                    <div><dt>系列</dt><dd>${renderSeriesTags(card.type)}</dd></div>
                    <div class="full"><dt>說明</dt><dd>${keywordText(cardText(card))}</dd></div>
                  </dl>
                  ${renderBlessingBadge(card)}
                </article>`;
            }).join("")
            : `<article class="pool-card"><h3>目前牌組沒有卡牌</h3></article>`}
        </div>
        <div class="actions">
          <button class="ghost-button" data-skip-blessing>跳過祝福</button>
        </div>
      </section>
    </main>`;
  app.querySelectorAll("[data-bless-card]").forEach((el) => {
    el.onclick = () => applyBlessingToCard(el.dataset.blessCard);
  });
  app.querySelector("[data-skip-blessing]")?.addEventListener("click", finishBlessing);
}

function canBlessCard(card, blessing) {
  if (!card || card.blessing) return false;
  if (blessing === "暴雪祝福" || blessing === "要拼祝福") return Boolean(card.randomTargetCard);
  return false;
}

function applyBlessingToCard(cardId) {
  const blessing = state.pendingBlessing || "暴雪祝福";
  const card = state.player.deck.find((item) => item.id === cardId);
  if (!canBlessCard(card, blessing)) return;
  card.blessing = blessing;
  const stored = state.player.storedBlessings || [];
  const index = stored.indexOf(blessing);
  if (index >= 0) stored.splice(index, 1);
  state.player.storedBlessings = stored;
  state.postBattle?.log?.push(`「${card.name}」獲得${blessing}。`);
  finishBlessing();
}

function finishBlessing() {
  const next = state.blessingNext || "postbattle";
  state.pendingBlessing = null;
  state.blessingNext = null;
  state.currentEvent = null;
  state.eventLineIndex = 0;
  state.screen = next;
  render();
}

function renderRemoveCard() {
  const deck = state.player?.deck || [];
  const removeLimit = Math.max(1, Number(state.player?.pendingRemove) || 1);
  state.selectedRemoveCards ||= [];
  state.selectedRemoveCards = state.selectedRemoveCards.filter((id) => deck.some((card) => card.id === id)).slice(0, removeLimit);
  app.innerHTML = `
    <main class="screen">
      <section class="page">
        <div class="topbar">
          <div>
            <h1>刪除卡牌</h1>
            <p class="subtle">最多選擇 ${removeLimit} 張牌移出本局遊戲，也可以直接跳過。</p>
          </div>
        </div>
        <div class="cardpool-grid">
          ${deck.length
            ? deck.map((card) => `
              <article class="pool-card selectable ${state.selectedRemoveCards.includes(card.id) ? "selected" : ""}" data-remove-card="${card.id}">
                <div class="pool-card-head">
                  <h3>${card.name}</h3>
                  <span class="pill">${state.selectedRemoveCards.includes(card.id) ? "已選取" : `${cardBaseCost(card)} 能量`}</span>
                </div>
                <dl class="pool-card-spec">
                  <div><dt>系列</dt><dd>${renderSeriesTags(card.type)}</dd></div>
                  <div class="full"><dt>說明</dt><dd>${keywordText(card.text || "")}</dd></div>
                </dl>
              </article>`).join("")
            : `<article class="pool-card"><h3>目前沒有可刪除卡牌</h3><p class="subtle">牌組已空，將繼續流程。</p></article>`}
        </div>
        <div class="actions">
          ${deck.length ? `<button class="primary-button" data-confirm-remove ${state.selectedRemoveCards.length ? "" : "disabled"}>刪除選取卡牌 (${state.selectedRemoveCards.length}/${removeLimit})</button>` : ""}
          <button class="ghost-button" data-skip-remove>${deck.length ? "跳過刪牌" : "繼續"}</button>
        </div>
      </section>
    </main>`;
  app.querySelectorAll("[data-remove-card]").forEach((el) => {
    el.onclick = () => {
      const id = el.dataset.removeCard;
      if (state.selectedRemoveCards.includes(id)) {
        state.selectedRemoveCards = state.selectedRemoveCards.filter((cardId) => cardId !== id);
      } else if (state.selectedRemoveCards.length < removeLimit) {
        state.selectedRemoveCards.push(id);
      }
      render();
    };
  });
  app.querySelector("[data-confirm-remove]")?.addEventListener("click", () => {
    const selected = new Set(state.selectedRemoveCards || []);
    const removed = state.player.deck.filter((card) => selected.has(card.id)).map((card) => card.name);
    state.player.deck = state.player.deck.filter((card) => !selected.has(card.id));
    state.player.removedCards = [...(state.player.removedCards || []), ...removed];
    state.player.pendingRemove = false;
    state.selectedRemoveCards = [];
    continueAfterCardRemoval();
  });
  app.querySelector("[data-skip-remove]")?.addEventListener("click", () => {
    state.player.pendingRemove = false;
    state.selectedRemoveCards = [];
    continueAfterCardRemoval();
  });
}

function continueAfterCardRemoval() {
  if (state.player) state.player.pendingRemove = false;
  const next = state.removeCardNext;
  state.removeCardNext = null;
  if (next === "startBattle") {
    startBattle();
    return;
  }
  if (next === "supportBriefing") {
    state.supportBriefingStep = 0;
    state.screen = "supportBriefing";
    render();
    return;
  }
  state.screen = next || "postbattle";
  render();
}

initializeApp();


