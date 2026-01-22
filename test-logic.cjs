// 测试数据处理逻辑
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
    totalProfit: parseFloat(cols[1]) || 0,
    profitRatio: parseFloat(cols[2]) || 0,  // 总盈亏 = 盈利倍数
    buyCount: parseInt(cols[3]) || 0,
    sellCount: parseInt(cols[4]) || 0,
    buyAmount: parseFloat(cols[5]) || 0,
    sellAmount: parseFloat(cols[6]) || 0,
  };
});

const highThreshold = 10;
const mediumThreshold = 5;
const tokenName = '梗王';

// 筛选
const highTier = walletData.filter(w => w.profitRatio >= highThreshold);
const mediumTier = walletData.filter(w => w.profitRatio >= mediumThreshold && w.profitRatio < highThreshold);

console.log(`总数据量: ${walletData.length}`);
console.log(`高倍数(≥${highThreshold}x): ${highTier.length}个`);
console.log(`中倍数(${mediumThreshold}x-${highThreshold}x): ${mediumTier.length}个`);

console.log('\n=== 高倍数盈利 ===');
highTier.sort((a, b) => b.profitRatio - a.profitRatio).forEach(w => {
  const suffix = w.wallet.slice(-3);
  console.log(`${w.wallet}:${tokenName}盈利${suffix}  (${w.profitRatio.toFixed(2)}x)`);
});

console.log('\n=== 中倍数盈利 ===');
mediumTier.sort((a, b) => b.profitRatio - a.profitRatio).forEach(w => {
  const suffix = w.wallet.slice(-3);
  console.log(`${w.wallet}:${tokenName}盈利${suffix}  (${w.profitRatio.toFixed(2)}x)`);
});
