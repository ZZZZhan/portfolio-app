// Mock data matching the design稿

export const portfolioData = {
  totalAssets: "¥1,284,650",
  todayProfit: "+¥3,280",
  todayProfitRate: "+2.74%",
  todayReturn: "+7.21%",
  cumulativeProfit: "+¥156,800",
  cumulativeRate: "+13.9%",
  updated: true,
};

export const portfolios = [
  {
    id: "1",
    name: "稳健增值组合",
    todayChange: "+1.9%",
    completion: 78,
    marketValue: "¥642,300",
    hasAlert: false,
  },
  {
    id: "2",
    name: "科技成长组合",
    todayChange: null,
    completion: 52,
    marketValue: "¥498,150",
    hasAlert: true,
  },
];

export const portfolioDetail = {
  name: "稳健增值组合",
  completion: 78,
  todayChange: "+1.9%",
  marketValue: "¥642,300",
  totalCost: "¥580,000",
  totalProfit: "+¥62,300",
  totalProfitRate: "+10.7%",
  holdings: [
    { name: "沪深300ETF", current: 35, target: 30, value: "¥224,805", profit: "+¥18,200", profitRate: "+8.8%" },
    { name: "标普500ETF", current: 25, target: 25, value: "¥160,575", profit: "+¥12,500", profitRate: "+8.4%" },
    { name: "科技100ETF", current: 22, target: 20, value: "¥141,306", profit: "+¥15,800", profitRate: "+12.6%" },
    { name: "债券基金", current: 18, target: 25, value: "¥115,614", profit: "+¥2,300", profitRate: "+2.0%" },
  ],
  rebalanceNeeded: true,
};

export const rebalanceAlerts = [
  { name: "科技100ETF", current: 22, target: 20, deviation: "+2.0%", status: "overweight" },
  { name: "债券基金", current: 18, target: 25, deviation: "-7.0%", status: "underweight" },
  { name: "沪深300ETF", current: 35, target: 30, deviation: "+5.0%", status: "overweight" },
];

export const profileData = {
  name: "明哲",
  email: "mingzhe@email.com",
  totalAssets: "¥1,284,650",
  cumulativeProfit: "+¥156,800",
  cumulativeRate: "+13.9%",
  settings: [
    { label: "风控偏好", value: "稳健型", icon: "shield" },
    { label: "再平衡规则", value: "偏离>5%提醒", icon: "scale" },
    { label: "盘后提醒", value: "每日17:00", icon: "clock" },
    { label: "关于我们", value: "v1.0.0", icon: "info" },
  ],
};

export const adjustHoldings = [
  {
    name: "沪深300ETF",
    currentRatio: 35,
    targetRatio: 30,
    deviation: "+5.0%",
    marketValue: "¥224,805",
    adjustedRatio: 30,
    isDeviated: true,
  },
  {
    name: "债券基金",
    currentRatio: 18,
    targetRatio: 25,
    deviation: "-7.0%",
    marketValue: "¥115,614",
    adjustedRatio: 25,
    isDeviated: true,
  },
];
