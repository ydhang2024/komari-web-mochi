/**
 * 格式化工具函数
 */

/**
 * 格式化字节数，支持简短格式
 * @param bytes 字节数
 * @param compact 是否使用紧凑格式
 * @returns 格式化后的字符串
 */
export function formatBytes(bytes: number, compact = false): string {
  const units = ["B", "KB", "MB", "GB", "TB", "PB"];
  const compactUnits = ["B", "K", "M", "G", "T", "P"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  if (compact) {
    // 紧凑格式：小于 10 显示一位小数，否则不显示小数
    const formatted = size < 10 ? size.toFixed(1) : Math.round(size).toString();
    return `${formatted}${compactUnits[unitIndex]}`;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

/**
 * 格式化时间（秒）为可读格式
 * @param seconds 秒数
 * @param t 翻译函数
 * @returns 格式化后的时间字符串
 */
export function formatUptime(seconds: number, t: any): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) {
    return t("nodeCard.uptime_days", {
      days,
      hours,
      defaultValue: `${days}d ${hours}h`,
    });
  } else if (hours > 0) {
    return t("nodeCard.uptime_hours", {
      hours,
      minutes,
      defaultValue: `${hours}h ${minutes}m`,
    });
  } else {
    return t("nodeCard.uptime_minutes", {
      minutes,
      defaultValue: `${minutes}m`,
    });
  }
}