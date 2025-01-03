import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get('keyword');
  const period = searchParams.get('period');

  if (!keyword || !period) {
    return NextResponse.json(
      { error: 'Missing required parameters' },
      { status: 400 }
    );
  }

  try {
    // 第一步：获取 Token
    const exploreResponse = await fetch('https://trends.google.com/trends/api/explore?' + new URLSearchParams({
      hl: 'zh-CN',
      req: JSON.stringify({
        comparisonItem: [
          { keyword: 'gpts', geo: '', time: period === '7d' ? 'now 7-d' : 'today 1-m' },
          { keyword: keyword, geo: '', time: period === '7d' ? 'now 7-d' : 'today 1-m' }
        ],
        category: 0,
        property: ''
      }),
      tz: '-480'
    }), {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    const exploreData = await exploreResponse.text();
    const jsonStr = exploreData.replace(/\)]}',/, '');
    const { widgets } = JSON.parse(jsonStr);
    const token = widgets[0].token;

    // 第二步：使用 Token 获取实际数据
    const multilineResponse = await fetch('https://trends.google.com/trends/api/widgetdata/multiline?' + new URLSearchParams({
      hl: 'zh-CN',
      req: JSON.stringify(widgets[0].request),
      token: token,
      tz: '-480'
    }));

    const multilineData = await multilineResponse.text();
    const cleanedData = multilineData.replace(/\)]}',/, '');
    const finalData = JSON.parse(cleanedData);

    return NextResponse.json(finalData, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, s-maxage=600'
      }
    });

  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
} 
