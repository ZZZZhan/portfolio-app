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

