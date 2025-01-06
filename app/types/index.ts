export interface Keyword {
  id: string;
  keyword: string;
  createdAt: string;
}

export interface TrendData {
  keywords: Keyword[];
}

export type TimePeriod = 
  | '1h'   // 过去1小时
  | '4h'   // 过去4小时
  | '1d'   // 过去1天
  | '7d'   // 过去7天
  | '1m'   // 过去1个月
  | '3m'   // 过去3个月
  | '12m'  // 过去12个月
  | '5y'   // 过去5年
  | 'all'; // 2004至今 
