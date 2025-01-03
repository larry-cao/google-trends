export interface Keyword {
  id: string;
  keyword: string;
  createdAt: string;
}

export interface TrendData {
  keywords: Keyword[];
} 
