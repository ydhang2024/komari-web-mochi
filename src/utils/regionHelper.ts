// 地区emoji到名称的映射
export const emojiToRegionMap: Record<string, { en: string; zh: string; aliases: string[]; coordinates?: [number, number] }> = {
  '🇭🇰': {
    en: 'Hong Kong',
    zh: '香港',
    aliases: ['hk', 'hongkong', 'hong kong', '香港', 'HK'],
    coordinates: [22.3193, 114.1694]
  },
  '🇲🇴': {
    en: 'Macao',
    zh: '澳门',
    aliases: ['mo', 'macao', 'macau', '澳门', '澳門', 'MO'],
    coordinates: [22.1987, 113.5439]
  },
  '🇨🇳': {
    en: 'China',
    zh: '中国',
    aliases: ['cn', 'china', '中国', '中华人民共和国', 'prc', 'CN'],
    coordinates: [39.9042, 116.4074]
  },
  '🇺🇸': {
    en: 'United States',
    zh: '美国',
    aliases: ['us', 'usa', 'united states', 'america', '美国', '美利坚', 'US', 'USA'],
    coordinates: [37.0902, -95.7129]
  },
  '🇯🇵': {
    en: 'Japan',
    zh: '日本',
    aliases: ['jp', 'japan', '日本', 'JP'],
    coordinates: [35.6762, 139.6503]
  },
  '🇰🇷': {
    en: 'South Korea',
    zh: '韩国',
    aliases: ['kr', 'korea', 'south korea', '韩国', '南韩', 'KR'],
    coordinates: [37.5665, 126.9780]
  },
  '🇸🇬': {
    en: 'Singapore',
    zh: '新加坡',
    aliases: ['sg', 'singapore', '新加坡', 'SG'],
    coordinates: [1.3521, 103.8198]
  },
  '🇹🇼': {
    en: 'Taiwan',
    zh: '台湾',
    aliases: ['tw', 'taiwan', '台湾', '台灣', 'TW'],
    coordinates: [25.0330, 121.5654]
  },
  '🇬🇧': {
    en: 'United Kingdom',
    zh: '英国',
    aliases: ['gb', 'uk', 'united kingdom', 'britain', '英国', '英國', 'GB', 'UK'],
    coordinates: [51.5074, -0.1278]
  },
  '🇩🇪': {
    en: 'Germany',
    zh: '德国',
    aliases: ['de', 'germany', 'deutschland', '德国', '德國', 'DE'],
    coordinates: [52.5200, 13.4050]
  },
  '🇫🇷': {
    en: 'France',
    zh: '法国',
    aliases: ['fr', 'france', '法国', '法國', 'FR'],
    coordinates: [48.8566, 2.3522]
  },
  '🇨🇦': {
    en: 'Canada',
    zh: '加拿大',
    aliases: ['ca', 'canada', '加拿大', 'CA'],
    coordinates: [45.4215, -75.6972]
  },
  '🇦🇺': {
    en: 'Australia',
    zh: '澳大利亚',
    aliases: ['au', 'australia', '澳大利亚', '澳洲', 'AU'],
    coordinates: [-33.8688, 151.2093]
  },
  '🇷🇺': {
    en: 'Russia',
    zh: '俄罗斯',
    aliases: ['ru', 'russia', '俄罗斯', '俄國', 'RU'],
    coordinates: [55.7558, 37.6173]
  },
  '🇮🇳': {
    en: 'India',
    zh: '印度',
    aliases: ['in', 'india', '印度', 'IN'],
    coordinates: [28.6139, 77.2090]
  },
  '🇧🇷': {
    en: 'Brazil',
    zh: '巴西',
    aliases: ['br', 'brazil', '巴西', 'BR'],
    coordinates: [-15.8267, -47.9218]
  },
  '🇳🇱': {
    en: 'Netherlands',
    zh: '荷兰',
    aliases: ['nl', 'netherlands', 'holland', '荷兰', '荷蘭', 'NL'],
    coordinates: [52.3676, 4.9041]
  },
  '🇮🇹': {
    en: 'Italy',
    zh: '意大利',
    aliases: ['it', 'italy', '意大利', 'IT'],
    coordinates: [41.9028, 12.4964]
  },
  '🇪🇸': {
    en: 'Spain',
    zh: '西班牙',
    aliases: ['es', 'spain', '西班牙', 'ES'],
    coordinates: [40.4168, -3.7038]
  },
  '🇸🇪': {
    en: 'Sweden',
    zh: '瑞典',
    aliases: ['se', 'sweden', '瑞典', 'SE'],
    coordinates: [59.3293, 18.0686]
  },
  '🇳🇴': {
    en: 'Norway',
    zh: '挪威',
    aliases: ['no', 'norway', '挪威', 'NO'],
    coordinates: [59.9139, 10.7522]
  },
  '🇫🇮': {
    en: 'Finland',
    zh: '芬兰',
    aliases: ['fi', 'finland', '芬兰', '芬蘭', 'FI'],
    coordinates: [60.1699, 24.9384]
  },
  '🇨🇭': {
    en: 'Switzerland',
    zh: '瑞士',
    aliases: ['ch', 'switzerland', '瑞士', 'CH'],
    coordinates: [46.9479, 7.4474]
  },
  '🇦🇹': {
    en: 'Austria',
    zh: '奥地利',
    aliases: ['at', 'austria', '奥地利', '奧地利', 'AT'],
    coordinates: [48.2082, 16.3738]
  },
  '🇧🇪': {
    en: 'Belgium',
    zh: '比利时',
    aliases: ['be', 'belgium', '比利时', '比利時', 'BE'],
    coordinates: [50.8503, 4.3517]
  },
  '🇵🇹': {
    en: 'Portugal',
    zh: '葡萄牙',
    aliases: ['pt', 'portugal', '葡萄牙', 'PT'],
    coordinates: [38.7223, -9.1393]
  },
  '🇬🇷': {
    en: 'Greece',
    zh: '希腊',
    aliases: ['gr', 'greece', '希腊', '希臘', 'GR'],
    coordinates: [37.9838, 23.7275]
  },
  '🇹🇷': {
    en: 'Turkey',
    zh: '土耳其',
    aliases: ['tr', 'turkey', '土耳其', 'TR'],
    coordinates: [39.9334, 32.8597]
  },
  '🇵🇱': {
    en: 'Poland',
    zh: '波兰',
    aliases: ['pl', 'poland', '波兰', '波蘭', 'PL'],
    coordinates: [52.2297, 21.0122]
  },
  '🇨🇿': {
    en: 'Czech Republic',
    zh: '捷克',
    aliases: ['cz', 'czech', 'czech republic', '捷克', 'CZ'],
    coordinates: [50.0755, 14.4378]
  },
  '🇭🇺': {
    en: 'Hungary',
    zh: '匈牙利',
    aliases: ['hu', 'hungary', '匈牙利', 'HU'],
    coordinates: [47.4979, 19.0402]
  },
  '🇷🇴': {
    en: 'Romania',
    zh: '罗马尼亚',
    aliases: ['ro', 'romania', '罗马尼亚', '羅馬尼亞', 'RO'],
    coordinates: [44.4268, 26.1025]
  },
  '🇧🇬': {
    en: 'Bulgaria',
    zh: '保加利亚',
    aliases: ['bg', 'bulgaria', '保加利亚', '保加利亞', 'BG'],
    coordinates: [42.6977, 23.3219]
  },
  '🇭🇷': {
    en: 'Croatia',
    zh: '克罗地亚',
    aliases: ['hr', 'croatia', '克罗地亚', '克羅地亞', 'HR'],
    coordinates: [45.8150, 15.9819]
  },
  '🇸🇮': {
    en: 'Slovenia',
    zh: '斯洛文尼亚',
    aliases: ['si', 'slovenia', '斯洛文尼亚', '斯洛文尼亞', 'SI'],
    coordinates: [46.0569, 14.5058]
  },
  '🇸🇰': {
    en: 'Slovakia',
    zh: '斯洛伐克',
    aliases: ['sk', 'slovakia', '斯洛伐克', 'SK'],
    coordinates: [48.1486, 17.1077]
  },
  '🇱🇻': {
    en: 'Latvia',
    zh: '拉脱维亚',
    aliases: ['lv', 'latvia', '拉脱维亚', '拉脫維亞', 'LV'],
    coordinates: [56.9496, 24.1052]
  },
  '🇱🇹': {
    en: 'Lithuania',
    zh: '立陶宛',
    aliases: ['lt', 'lithuania', '立陶宛', 'LT'],
    coordinates: [54.6872, 25.2797]
  },
  '🇪🇪': {
    en: 'Estonia',
    zh: '爱沙尼亚',
    aliases: ['ee', 'estonia', '爱沙尼亚', '愛沙尼亞', 'EE'],
    coordinates: [59.4370, 24.7536]
  },
  '🇲🇽': {
    en: 'Mexico',
    zh: '墨西哥',
    aliases: ['mx', 'mexico', '墨西哥', 'MX'],
    coordinates: [19.4326, -99.1332]
  },
  '🇦🇷': {
    en: 'Argentina',
    zh: '阿根廷',
    aliases: ['ar', 'argentina', '阿根廷', 'AR'],
    coordinates: [-34.6037, -58.3816]
  },
  '🇨🇱': {
    en: 'Chile',
    zh: '智利',
    aliases: ['cl', 'chile', '智利', 'CL'],
    coordinates: [-33.4489, -70.6693]
  },
  '🇨🇴': {
    en: 'Colombia',
    zh: '哥伦比亚',
    aliases: ['co', 'colombia', '哥伦比亚', '哥倫比亞', 'CO'],
    coordinates: [4.7110, -74.0721]
  },
  '🇵🇪': {
    en: 'Peru',
    zh: '秘鲁',
    aliases: ['pe', 'peru', '秘鲁', '秘魯', 'PE'],
    coordinates: [-12.0464, -77.0428]
  },
  '🇻🇪': {
    en: 'Venezuela',
    zh: '委内瑞拉',
    aliases: ['ve', 'venezuela', '委内瑞拉', '委內瑞拉', 'VE'],
    coordinates: [10.4806, -66.9036]
  },
  '🇺🇾': {
    en: 'Uruguay',
    zh: '乌拉圭',
    aliases: ['uy', 'uruguay', '乌拉圭', '烏拉圭', 'UY'],
    coordinates: [-34.9011, -56.1645]
  },
  '🇪🇨': {
    en: 'Ecuador',
    zh: '厄瓜多尔',
    aliases: ['ec', 'ecuador', '厄瓜多尔', '厄瓜多爾', 'EC'],
    coordinates: [-0.1807, -78.4678]
  },
  '🇧🇴': {
    en: 'Bolivia',
    zh: '玻利维亚',
    aliases: ['bo', 'bolivia', '玻利维亚', '玻利維亞', 'BO'],
    coordinates: [-16.2902, -63.5887]
  },
  '🇵🇾': {
    en: 'Paraguay',
    zh: '巴拉圭',
    aliases: ['py', 'paraguay', '巴拉圭', 'PY'],
    coordinates: [-25.2637, -57.5759]
  },
  '🇬🇾': {
    en: 'Guyana',
    zh: '圭亚那',
    aliases: ['gy', 'guyana', '圭亚那', '圭亞那', 'GY'],
    coordinates: [6.8013, -58.1551]
  },
  '🇸🇷': {
    en: 'Suriname',
    zh: '苏里南',
    aliases: ['sr', 'suriname', '苏里南', '蘇里南', 'SR'],
    coordinates: [5.8520, -55.2038]
  },
  '🇫🇰': {
    en: 'Falkland Islands',
    zh: '福克兰群岛',
    aliases: ['fk', 'falkland', '福克兰', '福克蘭', 'FK'],
    coordinates: [-51.7963, -59.5236]
  },
  '🇬🇫': {
    en: 'French Guiana',
    zh: '法属圭亚那',
    aliases: ['gf', 'french guiana', '法属圭亚那', '法屬圭亞那', 'GF'],
    coordinates: [4.9371, -52.3260]
  },
  '🇵🇦': {
    en: 'Panama',
    zh: '巴拿马',
    aliases: ['pa', 'panama', '巴拿马', '巴拿馬', 'PA'],
    coordinates: [8.9824, -79.5199]
  },
  '🇨🇷': {
    en: 'Costa Rica',
    zh: '哥斯达黎加',
    aliases: ['cr', 'costa rica', '哥斯达黎加', '哥斯達黎加', 'CR'],
    coordinates: [9.9281, -84.0907]
  },
  '🇳🇮': {
    en: 'Nicaragua',
    zh: '尼加拉瓜',
    aliases: ['ni', 'nicaragua', '尼加拉瓜', 'NI'],
    coordinates: [12.1149, -86.2362]
  },
  '🇭🇳': {
    en: 'Honduras',
    zh: '洪都拉斯',
    aliases: ['hn', 'honduras', '洪都拉斯', 'HN'],
    coordinates: [14.0723, -87.1921]
  },
  '🇬🇹': {
    en: 'Guatemala',
    zh: '危地马拉',
    aliases: ['gt', 'guatemala', '危地马拉', '危地馬拉', 'GT'],
    coordinates: [14.6349, -90.5069]
  },
  '🇧🇿': {
    en: 'Belize',
    zh: '伯利兹',
    aliases: ['bz', 'belize', '伯利兹', '伯利茲', 'BZ'],
    coordinates: [17.1899, -88.4976]
  },
  '🇸🇻': {
    en: 'El Salvador',
    zh: '萨尔瓦多',
    aliases: ['sv', 'el salvador', '萨尔瓦多', '薩爾瓦多', 'SV'],
    coordinates: [13.6929, -89.2182]
  },
  '🇯🇲': {
    en: 'Jamaica',
    zh: '牙买加',
    aliases: ['jm', 'jamaica', '牙买加', '牙買加', 'JM'],
    coordinates: [18.1096, -77.2975]
  },
  '🇨🇺': {
    en: 'Cuba',
    zh: '古巴',
    aliases: ['cu', 'cuba', '古巴', 'CU'],
    coordinates: [23.1136, -82.3666]
  },
  '🇩🇴': {
    en: 'Dominican Republic',
    zh: '多明尼加',
    aliases: ['do', 'dominican', '多明尼加', 'DO'],
    coordinates: [18.4861, -69.9312]
  },
  '🇭🇹': {
    en: 'Haiti',
    zh: '海地',
    aliases: ['ht', 'haiti', '海地', 'HT'],
    coordinates: [18.5944, -72.3074]
  },
  '🇧🇸': {
    en: 'Bahamas',
    zh: '巴哈马',
    aliases: ['bs', 'bahamas', '巴哈马', '巴哈馬', 'BS'],
    coordinates: [25.0343, -77.3963]
  },
  '🇧🇧': {
    en: 'Barbados',
    zh: '巴巴多斯',
    aliases: ['bb', 'barbados', '巴巴多斯', 'BB'],
    coordinates: [13.1939, -59.5432]
  },
  '🇹🇹': {
    en: 'Trinidad and Tobago',
    zh: '特立尼达和多巴哥',
    aliases: ['tt', 'trinidad', '特立尼达', '特立尼達', 'TT'],
    coordinates: [10.6918, -61.2225]
  },
  '🇵🇭': {
    en: 'Philippines',
    zh: '菲律宾',
    aliases: ['ph', 'philippines', '菲律宾', '菲律賓', 'PH'],
    coordinates: [14.5995, 120.9842]
  },
  '🇹🇭': {
    en: 'Thailand',
    zh: '泰国',
    aliases: ['th', 'thailand', '泰国', '泰國', 'TH'],
    coordinates: [13.7563, 100.5018]
  },
  '🇻🇳': {
    en: 'Vietnam',
    zh: '越南',
    aliases: ['vn', 'vietnam', '越南', 'VN'],
    coordinates: [21.0285, 105.8542]
  },
  '🇲🇾': {
    en: 'Malaysia',
    zh: '马来西亚',
    aliases: ['my', 'malaysia', '马来西亚', '馬來西亞', 'MY'],
    coordinates: [3.1390, 101.6869]
  },
  '🇮🇩': {
    en: 'Indonesia',
    zh: '印度尼西亚',
    aliases: ['id', 'indonesia', '印度尼西亚', '印尼', 'ID'],
    coordinates: [-6.2088, 106.8456]
  },
  '🇱🇦': {
    en: 'Laos',
    zh: '老挝',
    aliases: ['la', 'laos', '老挝', '老撾', 'LA'],
    coordinates: [17.9757, 102.6331]
  },
  '🇰🇭': {
    en: 'Cambodia',
    zh: '柬埔寨',
    aliases: ['kh', 'cambodia', '柬埔寨', 'KH'],
    coordinates: [11.5449, 104.8922]
  },
  '🇲🇲': {
    en: 'Myanmar',
    zh: '缅甸',
    aliases: ['mm', 'myanmar', 'burma', '缅甸', '緬甸', 'MM'],
    coordinates: [16.8661, 96.1951]
  },
  '🇧🇳': {
    en: 'Brunei',
    zh: '文莱',
    aliases: ['bn', 'brunei', '文莱', '汶萊', 'BN'],
    coordinates: [4.5353, 114.7277]
  },
  '🇪🇬': {
    en: 'Egypt',
    zh: '埃及',
    aliases: ['eg', 'egypt', '埃及', 'EG'],
    coordinates: [30.0444, 31.2357]
  },
  '🇿🇦': {
    en: 'South Africa',
    zh: '南非',
    aliases: ['za', 'south africa', '南非', 'ZA'],
    coordinates: [-25.7479, 28.2293]
  },
  '🇳🇬': {
    en: 'Nigeria',
    zh: '尼日利亚',
    aliases: ['ng', 'nigeria', '尼日利亚', '尼日利亞', 'NG'],
    coordinates: [9.0820, 8.6753]
  },
  '🇰🇪': {
    en: 'Kenya',
    zh: '肯尼亚',
    aliases: ['ke', 'kenya', '肯尼亚', '肯亞', 'KE'],
    coordinates: [-1.2921, 36.8219]
  },
  '🇪🇹': {
    en: 'Ethiopia',
    zh: '埃塞俄比亚',
    aliases: ['et', 'ethiopia', '埃塞俄比亚', '埃塞俄比亞', 'ET'],
    coordinates: [9.0300, 38.7400]
  },
  '🇬🇭': {
    en: 'Ghana',
    zh: '加纳',
    aliases: ['gh', 'ghana', '加纳', '迦納', 'GH'],
    coordinates: [5.6037, -0.1870]
  },
  '🇺🇬': {
    en: 'Uganda',
    zh: '乌干达',
    aliases: ['ug', 'uganda', '乌干达', '烏干達', 'UG'],
    coordinates: [0.3476, 32.5825]
  },
  '🇹🇿': {
    en: 'Tanzania',
    zh: '坦桑尼亚',
    aliases: ['tz', 'tanzania', '坦桑尼亚', '坦尚尼亞', 'TZ'],
    coordinates: [-6.7924, 39.2083]
  },
  '🇷🇼': {
    en: 'Rwanda',
    zh: '卢旺达',
    aliases: ['rw', 'rwanda', '卢旺达', '盧旺達', 'RW'],
    coordinates: [-1.9403, 29.8739]
  },
  '🇿🇼': {
    en: 'Zimbabwe',
    zh: '津巴布韦',
    aliases: ['zw', 'zimbabwe', '津巴布韦', '辛巴威', 'ZW'],
    coordinates: [-17.8292, 31.0539]
  },
  '🇿🇲': {
    en: 'Zambia',
    zh: '赞比亚',
    aliases: ['zm', 'zambia', '赞比亚', '尚比亞', 'ZM'],
    coordinates: [-15.3875, 28.3228]
  },
  '🇧🇼': {
    en: 'Botswana',
    zh: '博茨瓦纳',
    aliases: ['bw', 'botswana', '博茨瓦纳', '波札那', 'BW'],
    coordinates: [-24.6282, 25.9231]
  },
  '🇳🇦': {
    en: 'Namibia',
    zh: '纳米比亚',
    aliases: ['na', 'namibia', '纳米比亚', '納米比亞', 'NA'],
    coordinates: [-22.5597, 17.0658]
  },
  '🇲🇦': {
    en: 'Morocco',
    zh: '摩洛哥',
    aliases: ['ma', 'morocco', '摩洛哥', 'MA'],
    coordinates: [33.9716, -6.8498]
  },
  '🇩🇿': {
    en: 'Algeria',
    zh: '阿尔及利亚',
    aliases: ['dz', 'algeria', '阿尔及利亚', '阿爾及利亞', 'DZ'],
    coordinates: [36.7372, 3.0866]
  },
  '🇹🇳': {
    en: 'Tunisia',
    zh: '突尼斯',
    aliases: ['tn', 'tunisia', '突尼斯', 'TN'],
    coordinates: [36.8065, 10.1815]
  },
  '🇱🇾': {
    en: 'Libya',
    zh: '利比亚',
    aliases: ['ly', 'libya', '利比亚', '利比亞', 'LY'],
    coordinates: [32.8872, 13.1913]
  },
  '🇸🇩': {
    en: 'Sudan',
    zh: '苏丹',
    aliases: ['sd', 'sudan', '苏丹', '蘇丹', 'SD'],
    coordinates: [15.5007, 32.5599]
  },
  '🇸🇸': {
    en: 'South Sudan',
    zh: '南苏丹',
    aliases: ['ss', 'south sudan', '南苏丹', '南蘇丹', 'SS'],
    coordinates: [4.8517, 31.5825]
  },
  '🇨🇩': {
    en: 'Democratic Republic of Congo',
    zh: '刚果民主共和国',
    aliases: ['cd', 'congo', 'drc', '刚果', '剛果', 'CD'],
    coordinates: [-4.4419, 15.2663]
  },
  '🇨🇬': {
    en: 'Republic of Congo',
    zh: '刚果共和国',
    aliases: ['cg', 'congo', '刚果', '剛果', 'CG'],
    coordinates: [-4.2634, 15.2429]
  },
  '🇨🇫': {
    en: 'Central African Republic',
    zh: '中非共和国',
    aliases: ['cf', 'central african', '中非', 'CF'],
    coordinates: [4.3947, 18.5582]
  },
  '🇨🇲': {
    en: 'Cameroon',
    zh: '喀麦隆',
    aliases: ['cm', 'cameroon', '喀麦隆', '喀麥隆', 'CM'],
    coordinates: [3.8480, 11.5021]
  },
  '🇹🇩': {
    en: 'Chad',
    zh: '乍得',
    aliases: ['td', 'chad', '乍得', 'TD'],
    coordinates: [12.1348, 15.0557]
  },
  '🇳🇪': {
    en: 'Niger',
    zh: '尼日尔',
    aliases: ['ne', 'niger', '尼日尔', '尼日爾', 'NE'],
    coordinates: [13.5117, 2.1098]
  },
  '🇲🇱': {
    en: 'Mali',
    zh: '马里',
    aliases: ['ml', 'mali', '马里', '馬利', 'ML'],
    coordinates: [12.6392, -8.0029]
  },
  '🇧🇫': {
    en: 'Burkina Faso',
    zh: '布基纳法索',
    aliases: ['bf', 'burkina', '布基纳法索', '布吉納法索', 'BF'],
    coordinates: [12.3714, -1.5197]
  },
  '🇸🇳': {
    en: 'Senegal',
    zh: '塞内加尔',
    aliases: ['sn', 'senegal', '塞内加尔', '塞內加爾', 'SN'],
    coordinates: [14.6928, -17.4467]
  },
  '🇬🇲': {
    en: 'Gambia',
    zh: '冈比亚',
    aliases: ['gm', 'gambia', '冈比亚', '甘比亞', 'GM'],
    coordinates: [13.4432, -16.5775]
  },
  '🇬🇼': {
    en: 'Guinea-Bissau',
    zh: '几内亚比绍',
    aliases: ['gw', 'guinea-bissau', '几内亚比绍', '幾內亞比索', 'GW'],
    coordinates: [11.8037, -15.1804]
  },
  '🇬🇳': {
    en: 'Guinea',
    zh: '几内亚',
    aliases: ['gn', 'guinea', '几内亚', '幾內亞', 'GN'],
    coordinates: [9.6412, -13.5784]
  },
  '🇸🇱': {
    en: 'Sierra Leone',
    zh: '塞拉利昂',
    aliases: ['sl', 'sierra leone', '塞拉利昂', 'SL'],
    coordinates: [8.4606, -13.2317]
  },
  '🇱🇷': {
    en: 'Liberia',
    zh: '利比里亚',
    aliases: ['lr', 'liberia', '利比里亚', '賴比瑞亞', 'LR'],
    coordinates: [6.2907, -10.7605]
  },
  '🇨🇮': {
    en: 'Ivory Coast',
    zh: '科特迪瓦',
    aliases: ['ci', 'ivory coast', '科特迪瓦', '象牙海岸', 'CI'],
    coordinates: [5.3600, -4.0083]
  },
  '🇹🇬': {
    en: 'Togo',
    zh: '多哥',
    aliases: ['tg', 'togo', '多哥', 'TG'],
    coordinates: [6.1375, 1.2123]
  },
  '🇧🇯': {
    en: 'Benin',
    zh: '贝宁',
    aliases: ['bj', 'benin', '贝宁', '貝寧', 'BJ'],
    coordinates: [6.3703, 2.3912]
  }
};

/**
 * 检查地区emoji是否匹配搜索词
 * @param regionEmoji 地区emoji（如：🇭🇰）
 * @param searchTerm 搜索词
 * @returns 是否匹配
 */
export const isRegionMatch = (regionEmoji: string, searchTerm: string): boolean => {
  const lowerSearchTerm = searchTerm.toLowerCase().trim();
  
  // 直接匹配emoji
  if (regionEmoji === searchTerm) {
    return true;
  }
  
  // 从映射表中查找
  const regionInfo = emojiToRegionMap[regionEmoji];
  if (!regionInfo) {
    // 如果映射表中没有，则只进行简单的包含匹配
    return regionEmoji.toLowerCase().includes(lowerSearchTerm);
  }
  
  // 检查英文名称
  if (regionInfo.en.toLowerCase().includes(lowerSearchTerm)) {
    return true;
  }
  
  // 检查中文名称
  if (regionInfo.zh.includes(lowerSearchTerm)) {
    return true;
  }
  
  // 检查别名
  return regionInfo.aliases.some(alias => 
    alias.toLowerCase().includes(lowerSearchTerm)
  );
};

/**
 * 获取地区的显示名称
 * @param regionEmoji 地区emoji
 * @param language 语言 ('en' | 'zh')
 * @returns 地区名称
 */
export const getRegionDisplayName = (regionEmoji: string, language: 'en' | 'zh' = 'zh'): string => {
  const regionInfo = emojiToRegionMap[regionEmoji];
  if (!regionInfo) {
    return regionEmoji;
  }
  
  return language === 'zh' ? regionInfo.zh : regionInfo.en;
};

/**
 * 获取所有支持的地区emoji列表
 * @returns 地区emoji数组
 */
export const getSupportedRegions = (): string[] => {
  return Object.keys(emojiToRegionMap);
};

/**
 * 获取地区的地理坐标
 * @param regionEmoji 地区emoji
 * @returns [纬度, 经度] 或 undefined
 */
export const getRegionCoordinates = (regionEmoji: string): [number, number] | undefined => {
  const regionInfo = emojiToRegionMap[regionEmoji];
  return regionInfo?.coordinates;
};
