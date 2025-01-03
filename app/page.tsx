'use client';

import React, { useState, useEffect } from 'react';
import { Keyword } from './types';
import { getKeywords, saveKeyword, deleteKeyword } from './lib/data';

const KeywordTrend = ({ keyword, period }: { keyword: string, period: '7d' | '1m' }) => {
  useEffect(() => {
    // 创建一个 iframe
    const iframe = document.createElement('iframe');
    iframe.style.width = '100%';
    iframe.style.height = '400px';  // 设置合适的高度
    iframe.style.border = 'none';   // 移除边框
    
    const container = document.getElementById(`trends-widget-${keyword}`);
    if (container) {
      container.innerHTML = '';
      container.appendChild(iframe);
      
      // 写入 iframe 内容
      const html = `
        <!DOCTYPE html>
        <html>
          <body>
            <script src="https://ssl.gstatic.com/trends_nrtr/3940_RC01/embed_loader.js"></script>
            <script>
              trends.embed.renderExploreWidget("TIMESERIES", {
                "comparisonItem":[
                  {"keyword":"gpts","geo":"","time":"${period === '7d' ? 'now 7-d' : 'today 1-m'}"},
                  {"keyword":"${keyword}","geo":"","time":"${period === '7d' ? 'now 7-d' : 'today 1-m'}"}
                ],
                "category":0,
                "property":""
              }, {
                exploreQuery: "date=${period === '7d' ? 'now 7-d' : 'today 1-m'}&q=gpts,${keyword}&hl=zh-CN",
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
  }, [keyword, period]);

  return <div id={`trends-widget-${keyword}`} className="w-full h-[400px]" />;
};

export default function Home() {
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState<'7d' | '1m'>('7d');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

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
    
    const result = await saveKeyword(newKeyword.trim());
    setMessage(result.message);
    
    if (result.success) {
      setNewKeyword('');
      fetchKeywords(); // 重新获取列表
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
      <div className="mb-8">
        <div className="flex gap-4 mb-4">
          <input
            type="text"
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            placeholder="输入关键词"
            className="border p-2 rounded flex-1"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleAddKeyword();
              }
            }}
          />
          <button
            onClick={handleAddKeyword}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            添加
          </button>
        </div>
        
        <div className="flex gap-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索关键词"
            className="border p-2 rounded flex-1"
          />
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as '7d' | '1m')}
            className="border p-2 rounded"
          >
            <option value="7d">最近7天</option>
            <option value="1m">最近30天</option>
          </select>
        </div>
        
        {message && (
          <div className="mt-2 text-red-500">{message}</div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {keywords.map((keyword) => (
          <div key={keyword.id} className="border p-4 rounded">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold truncate flex-1 max-w-[80%]">{keyword.keyword}</h3>
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
            <KeywordTrend keyword={keyword.keyword} period={period} />
          </div>
        ))}
      </div>
    </main>
  );
} 
