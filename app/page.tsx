'use client';

import React, { useState, useEffect } from 'react';
import { Keyword } from './types';
import { getKeywords, saveKeyword, deleteKeyword, getBaseKeyword, saveBaseKeyword } from './lib/data';
import { TimePeriod } from './types';

const KeywordTrend = ({ keyword, baseKeyword, period }: { keyword: string, baseKeyword: string, period: TimePeriod }) => {
  // 转换时间格式
  const getTimeParam = (period: TimePeriod) => {
    switch (period) {
      case '1h':
        return 'now 1-H';
      case '4h':
        return 'now 4-H';
      case '1d':
        return 'now 1-d';
      case '7d':
        return 'now 7-d';
      case '1m':
        return 'today 1-m';
      case '3m':
        return 'today 3-m';
      case '12m':
        return 'today 12-m';
      case '5y':
        return 'today 5-y';
      case 'all':
        return '2004-01-01 2025-01-06';
      default:
        return 'now 7-d';
    }
  };

  // 修改关键词处理函数
  const processKeyword = (kw: string) => {
    // 检查是否包含双引号
    if (kw.includes('"')) {
      // 移除多余的双引号，只保留一对
      const cleanKeyword = kw.replace(/"/g, '');
      // JSON 中需要转义双引号
      const jsonKeyword = `\\"${cleanKeyword}\\"`;
      // URL 中需要编码双引号
      const urlKeyword = encodeURIComponent(`"${cleanKeyword}"`);
      return { jsonKeyword, urlKeyword };
    } else {
      // 不包含双引号的关键词保持原样
      return {
        jsonKeyword: kw,
        urlKeyword: encodeURIComponent(kw)
      };
    }
  };

  useEffect(() => {
    // 创建一个 iframe
    const iframe = document.createElement('iframe');
    iframe.style.width = '100%';
    iframe.style.height = '400px';
    iframe.style.border = 'none';
    
    const container = document.getElementById(`trends-widget-${keyword}`);
    if (container) {
      container.innerHTML = '';
      container.appendChild(iframe);
      
      const timeParam = getTimeParam(period);
      const baseKeywordProcessed = processKeyword(baseKeyword);
      const keywordProcessed = processKeyword(keyword);

      const html = `
        <!DOCTYPE html>
        <html>
          <body>
            <script src="https://ssl.gstatic.com/trends_nrtr/3940_RC01/embed_loader.js"></script>
            <script>
              trends.embed.renderExploreWidget("TIMESERIES", {
                "comparisonItem":[
                  {"keyword":"${baseKeywordProcessed.jsonKeyword}","geo":"","time":"${timeParam}"},
                  {"keyword":"${keywordProcessed.jsonKeyword}","geo":"","time":"${timeParam}"}
                ],
                "category":0,
                "property":""
              }, {
                exploreQuery: "date=${period === 'all' ? 'all' : timeParam}&q=${baseKeywordProcessed.urlKeyword},${keywordProcessed.urlKeyword}&hl=zh-CN",
                guestPath: "https://trends.google.com:443/trends/embed/"
              });
            </script>
          </body>
        </html>
      `;
      
      iframe.contentWindow?.document.open();
      iframe.contentWindow?.document.write(html);
      iframe.contentWindow?.document.close();
    }

    return () => {
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [keyword, baseKeyword, period]);

  return <div id={`trends-widget-${keyword}`} className="w-full h-[400px]" />;
};

// 添加一个生成 Google Trends URL 的函数
const getGoogleTrendsUrl = (baseKeyword: string, keyword: string, period: TimePeriod) => {
  const getTimeParam = (p: TimePeriod) => {
    switch (p) {
      case '1h': return 'now%201-H';
      case '4h': return 'now%204-H';
      case '1d': return 'now%201-d';
      case '7d': return 'now%207-d';
      case '1m': return 'today%201-m';
      case '3m': return 'today%203-m';
      case '12m': return 'today%2012-m';
      case '5y': return 'today%205-y';
      case 'all': return 'all';
      default: return 'now%207-d';
    }
  };

  const timeParam = getTimeParam(period);
  const encodedBaseKeyword = encodeURIComponent(baseKeyword);
  const encodedKeyword = encodeURIComponent(keyword);
  
  return `https://trends.google.com/trends/explore?date=${timeParam}&q=${encodedBaseKeyword},${encodedKeyword}`;
};

export default function Home() {
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [baseKeyword, setBaseKeyword] = useState('gpts');
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState<TimePeriod>('7d');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [baseKeywordInput, setBaseKeywordInput] = useState('gpts');

  // 初始化时加载基准关键词
  useEffect(() => {
    const stored = getBaseKeyword();
    setBaseKeyword(stored);
    setBaseKeywordInput(stored);
  }, []);

  // 处理基准关键词变更
  const handleBaseKeywordChange = () => {
    if (!baseKeywordInput.trim()) {
      setMessage('基准关键词不能为空');
      return;
    }
    setBaseKeyword(baseKeywordInput.trim());
    saveBaseKeyword(baseKeywordInput.trim());
    setMessage('基准关键词已更新');
  };

  // 获取关键词列表
  const fetchKeywords = async () => {
    const data = await getKeywords();
    setKeywords(data.filter(k => 
      search ? k.keyword.toLowerCase().includes(search.toLowerCase()) : true
    ));
  };

  // 添加关键词
  const handleAddKeyword = async () => {
    if (!newKeyword.trim()) return;
    
    // 分割多行文本为关键词数组
    const keywords = newKeyword
      .split('\n')
      .map(k => k.trim())
      .filter(k => k); // 过滤空行
    
    let successCount = 0;
    let failCount = 0;
    
    // 逐个添加关键词
    for (const keyword of keywords) {
      const result = await saveKeyword(keyword);
      if (result.success) {
        successCount++;
      } else {
        failCount++;
      }
    }
    
    // 设置结果消息
    if (successCount > 0 && failCount > 0) {
      setMessage(`成功添加 ${successCount} 个关键词，${failCount} 个添加失败`);
    } else if (successCount > 0) {
      setMessage(`成功添加 ${successCount} 个关键词`);
    } else if (failCount > 0) {
      setMessage(`${failCount} 个关键词添加失败`);
    }
    
    if (successCount > 0) {
      setNewKeyword(''); // 清空输入框
      fetchKeywords(); // 刷新列表
    }
  };

  // 删除关键词
  const handleDeleteKeyword = async (id: string, keyword: string) => {
    if (window.confirm(`确定要删除关键词 "${keyword}" 吗？`)) {
      const result = await deleteKeyword(id);
      if (result.success) {
        fetchKeywords(); // 重新获取列表
      } else {
        alert('删除失败：' + result.message);
      }
    }
  };

  // 监听搜索关键词变化
  useEffect(() => {
    fetchKeywords();
  }, [search]);

  return (
    <main className="container mx-auto p-4">
      <div className="flex flex-col gap-8 mb-8">
        <div className="flex gap-4 items-start">
          <label className="whitespace-nowrap mt-2">基准关键词：</label>
          <div className="flex-1 flex gap-4">
            <input
              type="text"
              value={baseKeywordInput}
              onChange={(e) => setBaseKeywordInput(e.target.value)}
              placeholder="请输入基准关键词"
              className="border p-2 rounded flex-1"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleBaseKeywordChange();
                }
              }}
            />
            <button
              onClick={handleBaseKeywordChange}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 min-w-[80px]"
              disabled={!baseKeywordInput.trim()}
            >
              确认
            </button>
          </div>
        </div>

        <div className="flex gap-4 items-start">
          <label className="whitespace-nowrap mt-2">种子关键词：</label>
          <div className="flex-1 flex gap-4">
            <div className="flex-1">
              <textarea
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                placeholder="输入关键词，每行一个"
                className="border p-2 rounded w-full h-32 resize-y"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey) {
                    e.preventDefault();
                    handleAddKeyword();
                  }
                }}
              />
              <div className="mt-1 text-gray-500 text-sm">
                提示：每行输入一个关键词，Ctrl + Enter 快捷添加
              </div>
            </div>
            <button
              onClick={handleAddKeyword}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 min-w-[80px] h-11"
            >
              添加
            </button>
          </div>
        </div>
        
        <div className="flex gap-4 items-start">
          <label className="whitespace-nowrap mt-2">搜索关键词：</label>
          <div className="flex-1 flex gap-4">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索关键词"
              className="border p-2 rounded flex-1"
            />
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as TimePeriod)}
              className="border p-2 rounded min-w-[120px]"
            >
              <option value="1h">过去1小时</option>
              <option value="4h">过去4小时</option>
              <option value="1d">过去1天</option>
              <option value="7d">过去7天</option>
              <option value="1m">过去1个月</option>
              <option value="3m">过去3个月</option>
              <option value="12m">过去12个月</option>
              <option value="5y">过去5年</option>
              <option value="all">2004至今</option>
            </select>
          </div>
        </div>
        
        {message && (
          <div className="text-red-500">{message}</div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {keywords.map((keyword) => (
          <div key={keyword.id} className="border p-4 rounded">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2 flex-1 max-w-[80%]">
                <a
                  href={getGoogleTrendsUrl(baseKeyword, keyword.keyword, period)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-lg font-bold truncate hover:text-blue-500 transition-colors"
                  title="在 Google Trends 中查看对比"
                >
                  {keyword.keyword}
                </a>
                <a
                  href={`https://www.google.com/search?q=${encodeURIComponent(keyword.keyword)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-blue-500 transition-colors"
                  title="在 Google 中搜索"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M21 21L16.65 16.65M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </a>
              </div>
              <button
                onClick={() => handleDeleteKeyword(keyword.id, keyword.keyword)}
                className="ml-2 p-1.5 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
              >
                <svg 
                  width="14" 
                  height="14" 
                  viewBox="0 0 14 14" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path 
                    d="M1.75 3.5H12.25M11.0833 3.5V11.6667C11.0833 12.25 10.5 12.8333 9.91667 12.8333H4.08333C3.5 12.8333 2.91667 12.25 2.91667 11.6667V3.5M4.66667 3.5V2.33333C4.66667 1.75 5.25 1.16667 5.83333 1.16667H8.16667C8.75 1.16667 9.33333 1.75 9.33333 2.33333V3.5M5.83333 6.41667V9.91667M8.16667 6.41667V9.91667" 
                    stroke="currentColor" 
                    strokeWidth="1.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
            <KeywordTrend keyword={keyword.keyword} baseKeyword={baseKeyword} period={period} />
          </div>
        ))}
      </div>
    </main>
  );
} 
