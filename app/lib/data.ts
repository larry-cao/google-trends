import { Keyword } from '../types';

const STORAGE_KEY = 'google_trends_keywords';

// 从 localStorage 获取数据
function getStoredData(): Keyword[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return [];
  }
}

// 保存数据到 localStorage
function saveToStorage(keywords: Keyword[]) {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(keywords));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
}

export async function getKeywords(): Promise<Keyword[]> {
  const keywords = getStoredData();
  return keywords.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function saveKeyword(keyword: string): Promise<{ success: boolean; message: string }> {
  try {
    const keywords = getStoredData();
    
    if (keywords.some(k => k.keyword.toLowerCase() === keyword.toLowerCase())) {
      return { success: false, message: '关键词已存在' };
    }

    const newKeyword: Keyword = {
      id: Math.random().toString(36).substr(2, 9),
      keyword: keyword.toLowerCase(),
      createdAt: new Date().toISOString(),
    };

    keywords.push(newKeyword);
    saveToStorage(keywords);
    
    return { success: true, message: '保存成功' };
  } catch (error) {
    console.error('Error in saveKeyword:', error);
    return { success: false, message: '保存失败' };
  }
}

export async function deleteKeyword(id: string): Promise<{ success: boolean; message: string }> {
  try {
    const keywords = getStoredData();
    const index = keywords.findIndex(k => k.id === id);
    
    if (index === -1) {
      return { success: false, message: '关键词不存在' };
    }

    keywords.splice(index, 1);
    saveToStorage(keywords);
    
    return { success: true, message: '删除成功' };
  } catch (error) {
    console.error('Error in deleteKeyword:', error);
    return { success: false, message: '删除失败' };
  }
} 
