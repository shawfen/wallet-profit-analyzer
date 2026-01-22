// 测试数据处理逻辑 - 盈利金额 + 盈利倍数双条件筛选
const fs = require('fs');

// 读取CSV文件
const csvContent = fs.readFileSync('/home/ubuntu/upload/0x5b1b2276367dcac82dbd20d5acd2052d703c4444_Top收益.csv', 'utf-8');
const lines = csvContent.trim().split('\n');

// 跳过表头
const dataLines = lines.slice(1);

const walletData = dataLines.map(line => {
  const cols = line.split(',');
  return {
    wallet: cols[0],
    totalProfit: parseFloat(cols[1]) || 0,  // 总利润（盈利金额）
    profitRatio: parseFloat(cols[2]) || 0,  // 总盈亏（盈利倍数）
  };
});

const profitAmountThreshold = 1000;  // 盈利金额阈值
const profitRatioThreshold = 5;      // 盈利倍数阈值
const tokenName = '梗王';

// 筛选 - 同时满足两个条件
const filtered = walletData.filter(w => 
  w.totalProfit >= profitAmountThreshold && w.profitRatio >= profitRatioThreshold
);

// 按盈利金额降序排序
filtered.sort((a, b) => b.totalProfit - a.totalProfit);

console.log(`总数据量: ${walletData.length}`);
console.log(`筛选条件: 盈利金额≥${profitAmountThreshold} AND 盈利倍数≥${profitRatioThreshold}x`);
console.log(`符合条件: ${filtered.length}个`);

console.log('\n=== 输出格式预览 ===');
filtered.forEach(w => {
  const suffix = w.wallet.slice(-3);
  console.log(`${w.wallet}:${tokenName}盈利${suffix}`);
});
