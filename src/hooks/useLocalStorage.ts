import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  // 初始化时先使用默认值，避免 SSR 问题
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // 在客户端加载后读取 localStorage
  useEffect(() => {
    try {
      // 检查是否在浏览器环境
      if (typeof window !== 'undefined' && window.localStorage) {
        const item = localStorage.getItem(key);
        if (item !== null) {
          const parsedItem = JSON.parse(item);
          setStoredValue(parsedItem);
        }
      }
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
    }
  }, [key]);

  // 更新存储的值
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      
      // 只在客户端环境下写入 localStorage
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue] as const;
}
