/**
 * 钱包盈利分析工具 - 暗色金融终端风格
 * Design: Bloomberg Terminal Inspired
 * Colors: 深海蓝黑背景 + 金色强调 + 明亮绿盈利色
 * Typography: IBM Plex Sans/Mono
 * 
 * 筛选条件：
 * 1. 盈利金额（总利润）
 * 2. 盈利倍数（总盈亏）
 * 
 * 输出格式：钱包地址:代币名称盈利钱包后3位
 */

import { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Upload,
  FileSpreadsheet,
  Copy,
  Download,
  Wallet,
  TrendingUp,
  Settings2,
  CheckCircle2,
  AlertCircle,
  DollarSign,
  Percent,
} from "lucide-react";
import * as XLSX from "xlsx";

interface WalletData {
  wallet: string;
  totalProfit: number;      // 总利润（盈利金额）
  profitRatio: number;      // 总盈亏（盈利倍数）
  buyCount: number;
  sellCount: number;
  buyAmount: number;
  sellAmount: number;
}

interface FilteredResult {
  wallet: string;
  totalProfit: number;
  profitRatio: number;
}

export default function Home() {
  const [walletData, setWalletData] = useState<WalletData[]>([]);
  const [tokenName, setTokenName] = useState("梗王");
  const [profitAmountThreshold, setProfitAmountThreshold] = useState(1000);  // 盈利金额阈值
  const [profitRatioThreshold, setProfitRatioThreshold] = useState(5);       // 盈利倍数阈值
  const [fileName, setFileName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // 解析CSV/Excel文件
  const parseFile = useCallback((file: File) => {
    setIsProcessing(true);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];

        // 跳过表头
        const rows = jsonData.slice(1);
        const parsed: WalletData[] = [];

        for (const row of rows) {
          if (row.length >= 7 && row[0]) {
            const wallet = String(row[0]).trim();
            const totalProfit = parseFloat(String(row[1])) || 0;    // 总利润
            const profitRatio = parseFloat(String(row[2])) || 0;    // 总盈亏（盈利倍数）
            const buyCount = parseInt(String(row[3])) || 0;
            const sellCount = parseInt(String(row[4])) || 0;
            const buyAmount = parseFloat(String(row[5])) || 0;
            const sellAmount = parseFloat(String(row[6])) || 0;

            parsed.push({
              wallet,
              totalProfit,
              profitRatio,
              buyCount,
              sellCount,
              buyAmount,
              sellAmount,
            });
          }
        }

        setWalletData(parsed);
        toast.success(`成功导入 ${parsed.length} 条钱包数据`);
      } catch (error) {
        toast.error("文件解析失败，请检查文件格式");
        console.error(error);
      } finally {
        setIsProcessing(false);
      }
    };

    reader.onerror = () => {
      toast.error("文件读取失败");
      setIsProcessing(false);
    };

    reader.readAsBinaryString(file);
  }, []);

  // 处理文件拖放
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) {
        parseFile(file);
      }
    },
    [parseFile]
  );

  // 处理文件选择
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        parseFile(file);
      }
    },
    [parseFile]
  );

  // 筛选结果 - 同时满足盈利金额和盈利倍数条件
  const filteredResults = useMemo(() => {
    const results: FilteredResult[] = [];

    for (const item of walletData) {
      // 同时满足：盈利金额 >= 阈值 AND 盈利倍数 >= 阈值
      if (item.totalProfit >= profitAmountThreshold && item.profitRatio >= profitRatioThreshold) {
        results.push({
          wallet: item.wallet,
          totalProfit: item.totalProfit,
          profitRatio: item.profitRatio,
        });
      }
    }

    // 按盈利金额降序排序
    results.sort((a, b) => b.totalProfit - a.totalProfit);

    return results;
  }, [walletData, profitAmountThreshold, profitRatioThreshold]);

  // 格式化输出：钱包地址:代币名称盈利钱包后3位
  const formatOutput = useCallback(
    (result: FilteredResult) => {
      const walletSuffix = result.wallet.slice(-3);
      return `${result.wallet}:${tokenName}盈利${walletSuffix}`;
    },
    [tokenName]
  );

  // 生成完整输出文本（仅输出格式化的钱包列表）
  const generateFullOutput = useCallback(() => {
    const lines: string[] = [];

    for (const result of filteredResults) {
      lines.push(formatOutput(result));
    }

    return lines.join("\n");
  }, [filteredResults, formatOutput]);

  // 复制到剪贴板
  const copyToClipboard = useCallback(async () => {
    const text = generateFullOutput();
    if (!text) {
      toast.error("没有可复制的数据");
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      toast.success("已复制到剪贴板");
    } catch {
      toast.error("复制失败");
    }
  }, [generateFullOutput]);

  // 下载结果
  const downloadResults = useCallback(() => {
    const text = generateFullOutput();
    if (!text) {
      toast.error("没有可下载的数据");
      return;
    }
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${tokenName}_盈利分析结果.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("文件已下载");
  }, [generateFullOutput, tokenName]);

  return (
    <div className="min-h-screen bg-background">
      {/* 顶部状态栏 */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-gold" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gold">钱包盈利分析工具</h1>
              <p className="text-xs text-muted-foreground">Wallet Profit Analyzer</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-secondary/50 border border-border">
              <FileSpreadsheet className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">数据量:</span>
              <span className="font-mono text-gold">{walletData.length}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-secondary/50 border border-border">
              <TrendingUp className="w-4 h-4 text-profit" />
              <span className="text-muted-foreground">筛选:</span>
              <span className="font-mono text-profit">{filteredResults.length}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 左侧控制面板 */}
          <div className="lg:col-span-4 space-y-4">
            {/* 文件上传区 */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Upload className="w-4 h-4 text-gold" />
                  数据导入
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className={`
                    relative border-2 border-dashed rounded-lg p-6 text-center
                    transition-all duration-200 cursor-pointer
                    ${isProcessing ? "border-gold/50 bg-gold/5" : "border-border hover:border-gold/50 hover:bg-gold/5"}
                  `}
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => document.getElementById("file-input")?.click()}
                >
                  <input
                    id="file-input"
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <FileSpreadsheet className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm text-foreground mb-1">
                    {isProcessing ? "正在处理..." : "拖放文件或点击上传"}
                  </p>
                  <p className="text-xs text-muted-foreground">支持 CSV, XLSX, XLS</p>
                  {fileName && (
                    <div className="mt-3 flex items-center justify-center gap-2 text-xs text-gold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {fileName}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 参数设置 */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Settings2 className="w-4 h-4 text-gold" />
                  筛选参数
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="token-name" className="text-sm text-muted-foreground">
                    代币名称
                  </Label>
                  <Input
                    id="token-name"
                    value={tokenName}
                    onChange={(e) => setTokenName(e.target.value)}
                    placeholder="输入代币名称"
                    className="bg-secondary/50 border-border focus:border-gold font-mono"
                  />
                </div>

                <Separator className="bg-border" />

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="profit-amount" className="text-sm text-muted-foreground flex items-center gap-2">
                      <DollarSign className="w-3.5 h-3.5 text-gold" />
                      盈利金额阈值（总利润）
                    </Label>
                    <div className="relative">
                      <Input
                        id="profit-amount"
                        type="number"
                        value={profitAmountThreshold}
                        onChange={(e) => setProfitAmountThreshold(Number(e.target.value))}
                        min={0}
                        className="bg-secondary/50 border-border focus:border-gold font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="profit-ratio" className="text-sm text-muted-foreground flex items-center gap-2">
                      <Percent className="w-3.5 h-3.5 text-profit" />
                      盈利倍数阈值（总盈亏）
                    </Label>
                    <div className="relative">
                      <Input
                        id="profit-ratio"
                        type="number"
                        value={profitRatioThreshold}
                        onChange={(e) => setProfitRatioThreshold(Number(e.target.value))}
                        min={0}
                        step={0.1}
                        className="bg-secondary/50 border-border focus:border-gold font-mono pr-8"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-profit">x</span>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground bg-secondary/30 rounded-md p-3">
                  <p>筛选条件（同时满足）：</p>
                  <p className="mt-1">• 总利润 ≥ <span className="text-gold font-mono">{profitAmountThreshold}</span></p>
                  <p>• 盈利倍数 ≥ <span className="text-profit font-mono">{profitRatioThreshold}x</span></p>
                </div>
              </CardContent>
            </Card>

            {/* 操作按钮 */}
            <div className="flex gap-3">
              <Button
                onClick={copyToClipboard}
                disabled={filteredResults.length === 0}
                className="flex-1 bg-gold hover:bg-gold/90 text-primary-foreground"
              >
                <Copy className="w-4 h-4 mr-2" />
                复制结果
              </Button>
              <Button
                onClick={downloadResults}
                disabled={filteredResults.length === 0}
                variant="outline"
                className="flex-1 border-border hover:bg-secondary hover:border-gold/50"
              >
                <Download className="w-4 h-4 mr-2" />
                下载
              </Button>
            </div>
          </div>

          {/* 右侧结果展示 */}
          <div className="lg:col-span-8 space-y-4">
            {/* 筛选结果 */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-profit animate-pulse" />
                    筛选结果
                    <span className="text-xs text-muted-foreground font-normal">
                      (利润≥{profitAmountThreshold} & 倍数≥{profitRatioThreshold}x)
                    </span>
                  </CardTitle>
                  <span className="text-sm font-mono text-profit">
                    {filteredResults.length} 个
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                {filteredResults.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">暂无符合条件的数据</p>
                    <p className="text-xs mt-1">请导入数据或调整筛选参数</p>
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {filteredResults.map((result, index) => (
                      <div
                        key={result.wallet}
                        className="group flex items-center justify-between p-3 rounded-md bg-secondary/30 hover:bg-secondary/50 border border-transparent hover:border-profit/30 transition-all"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-xs text-muted-foreground w-6 text-right font-mono">
                            {index + 1}.
                          </span>
                          <code className="text-sm font-mono text-foreground truncate">
                            {formatOutput(result)}
                          </code>
                        </div>
                        <div className="flex items-center gap-4 shrink-0 ml-3">
                          <span className="text-xs font-mono text-gold">
                            ${result.totalProfit.toFixed(0)}
                          </span>
                          <span className="text-xs font-mono text-profit">
                            {result.profitRatio.toFixed(2)}x
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 输出预览 */}
            {filteredResults.length > 0 && (
              <Card className="border-border bg-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Copy className="w-4 h-4 text-muted-foreground" />
                    输出预览（复制内容）
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs font-mono bg-background/50 rounded-md p-4 overflow-x-auto max-h-[250px] overflow-y-auto custom-scrollbar text-foreground whitespace-pre-wrap break-all">
                    {generateFullOutput()}
                  </pre>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* 底部信息 */}
      <footer className="border-t border-border py-4 mt-8">
        <div className="container text-center text-xs text-muted-foreground">
          <p>钱包盈利分析工具 · 数据仅供参考</p>
        </div>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: oklch(0.3 0.015 250);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: oklch(0.4 0.015 250);
        }
      `}</style>
    </div>
  );
}
