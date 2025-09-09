/**
 * OS Image Helper - 根据字符串匹配返回操作系统图像路径
 */

// 操作系统匹配配置
interface OSConfig {
  name: string;
  image: string;
  keywords: string[];
}

// 操作系统匹配组
const osConfigs: OSConfig[] = [
  {
    name: 'AlmaLinux',
    image: '/assets/os-alma.svg',
    keywords: ['alma', 'almalinux']
  },
  {
    name: 'Alpine Linux',
    image: '/assets/os-alpine.webp',
    keywords: ['alpine', 'alpine linux']
  },
  {
    name: 'CentOS',
    image: '/assets/os-centos.svg',
    keywords: ['centos', 'cent os']
  },
  {
    name: 'Debian',
    image: '/assets/os-debian.svg',
    keywords: ['debian', 'deb']
  },
  {
    name: 'Ubuntu',
    image: '/assets/os-ubuntu.svg',
    keywords: ['ubuntu', 'elementary']
  },
  {
    name: 'Windows',
    image: '/assets/os-windows.svg',
    keywords: ['windows', 'win', 'microsoft', 'ms']
  },
  {
    name: 'Arch Linux',
    image: '/assets/os-arch.svg',
    keywords: ['arch', 'archlinux', 'arch linux']
  },
  {
    name: 'Kali Linux',
    image: '/assets/os-kail.svg',
    keywords: ['kail', 'kali', 'kali linux']
  },
  {
    name: 'iStoreOS',
    image: '/assets/os-istore.png',
    keywords: ['istore', 'istoreos', 'istore os']
  },
  {
    name: 'OpenWrt',
    image: '/assets/os-immortalwrt.svg',
    keywords: ['openwrt', 'open wrt', 'open-wrt', 'qwrt']
  },
  {
    name: 'ImmortalWrt',
    image: '/assets/os-immortalwrt.svg',
    keywords: ['immortalwrt', 'immortal', 'emmortal']
  },
  {
    name: 'NixOS',
    image: '/assets/os-nix.svg',
    keywords: ['nixos', 'nix os', 'nix']
  },
  {
    name: 'Rocky Linux',
    image: '/assets/os-rocky.svg',
    keywords: ['rocky', 'rocky linux']
  },
  {
    name: 'Fedora',
    image: '/assets/os-fedora.svg',
    keywords: ['fedora']
  },
  {
    name: 'openSUSE',
    image: '/assets/os-openSUSE.svg',
    keywords: ['opensuse', 'suse']
  },
  {
    name: 'Gentoo',
    image: '/assets/os-gentoo.svg',
    keywords: ['gentoo']
  },
  {
    name: 'Red Hat',
    image: '/assets/os-redhat.svg',
    keywords: ['redhat', 'rhel', 'red hat']
  },
  {
    name: 'Linux Mint',
    image: '/assets/os-mint.svg',
    keywords: ['mint', 'linux mint']
  },
  {
    name: 'Manjaro',
    image: '/assets/os-manjaro-.svg',
    keywords: ['manjaro']
  },
  {
    name: 'Armbian',
    image: '/assets/os-armbian.png',
    keywords: ['armbox', 'armbian']
  },
  {
    name: 'Synology DSM',
    image: '/assets/os-synology.svg',
    keywords: ['synology', 'dsm', 'synology dsm']
  },
  {
    name: 'Proxmox VE',
    image: '/assets/os-proxmox.ico',
    keywords: ['proxmox', 'proxmox ve']
  },
  {
    name: 'macOS',
    image: '/assets/os-macos.svg',
    keywords: ['macos']
  },
  {
    name: 'Alibaba',
    image: '/assets/os-alibaba.svg',
    keywords: ['alibaba']
  },
  {
    name: 'OpenCloudOS',
    image: '/assets/os-opencloud.svg',
    keywords: ['opencloud']
  },
  {
    name: "Qnap",
    image: "/assets/os-qts.svg",
    keywords: ["qts","quts hero","qes","qutscloud"],
  }
];

// 默认配置
const defaultOSConfig: OSConfig = {
  name: 'Unknown',
  image: '/assets/TablerHelp.svg',
  keywords: ['unknown']
};

/**
 * 根据输入字符串查找匹配的操作系统配置
 * @param osString - 操作系统相关的字符串
 * @returns 匹配的操作系统配置，如果没有匹配则返回默认配置
 */
function findOSConfig(osString: string): OSConfig {
  if (!osString) {
    return defaultOSConfig;
  }

  const normalizedInput = osString.toLowerCase().trim();

  // 遍历匹配配置
  for (const config of osConfigs) {
    for (const keyword of config.keywords) {
      if (normalizedInput.includes(keyword)) {
        return config;
      }
    }
  }

  // 如果没有匹配到，返回默认配置
  return defaultOSConfig;
}

/**
 * 根据输入字符串匹配返回操作系统图像路径
 * @param osString - 操作系统相关的字符串
 * @returns 匹配的操作系统图像路径，如果没有匹配则返回默认图像
 */
export function getOSImage(osString: string): string {
  return findOSConfig(osString).image;
}

/**
 * 获取所有可用的操作系统图像
 * @returns 所有操作系统图像的映射表
 */
export function getAllOSImages(): Record<string, string> {
  const imageMap: Record<string, string> = {};
  
  osConfigs.forEach(config => {
    const key = config.keywords[0]; // 使用第一个关键词作为键
    imageMap[key] = config.image;
  });
  
  imageMap.unknown = defaultOSConfig.image;
  
  return imageMap;
}

/**
 * 根据输入字符串匹配返回操作系统名称
 * @param osString - 操作系统相关的字符串
 * @returns 匹配的操作系统名称
 */
export function getOSName(osString: string): string {
  const config = findOSConfig(osString);
  
  // 如果匹配到具体的操作系统，返回其名称
  if (config !== defaultOSConfig) {
    return config.name;
  }
  
  // 如果没有匹配到，从输入字符串中提取名称
  if (!osString) {
    return 'Unknown';
  }
  
  // 使用空格或斜杠分割，取第一个部分
  const parts = osString.trim().split(/[\s/]/);
  return parts[0] || 'Unknown';
}

/**
 * 检查是否为支持的操作系统
 * @param osString - 操作系统相关的字符串
 * @returns 是否为支持的操作系统
 */
export function isSupportedOS(osString: string): boolean {
  if (!osString) return false;
  
  const config = findOSConfig(osString);
  return config !== defaultOSConfig;
}
