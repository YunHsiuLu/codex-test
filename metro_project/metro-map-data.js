import { redLineStations } from './metroLines/red/red-line.js';
import { blueLineStations } from './metroLines/blue/blue-line.js';
import { orangeLineStations } from './metroLines/orange/orange-line.js';

const station = (key, name, x, y) => ({ key, label: key, name, x, y });
const normalize = (points, names, project = point => point) => points.map(source => ({
  ...project(source), key: source.label, label: source.label,
  name: names[source.label] || source.label
}));

// 舊座標是依較大的顯示尺寸記錄；市區路網需投影回 1280 × 1741 底圖。
const scaleLegacyPoint = point => ({ ...point, x: point.x * .95, y: point.y * .95 });
const projectRedPoint = point => {
  if (['Tamsui', 'Hongshulin', 'Zhuwei', 'Guandu'].includes(point.label)) return point;
  if (point.label === 'Xinbeitou') return { ...point, x: 432, y: 415 };
  return scaleLegacyPoint(point);
};

const redNames = {
  Tamsui:'淡水',Hongshulin:'紅樹林',Zhuwei:'竹圍',Guandu:'關渡',Zhongyi:'忠義',Fuxinggang:'復興崗',Beitou:'北投',Xinbeitou:'新北投',Qiyan:'奇岩',Qilian:'唭哩岸',Shipai:'石牌',Mingde:'明德',Zhishan:'芝山',Shilin:'士林',Jiantan:'劍潭',Yuanshan:'圓山',Minquan:'民權西路',Shuanglian:'雙連',Zhongshan:'中山',Taipei:'台北車站','NTU-Hospital':'台大醫院',CKS:'中正紀念堂',Dongmen:'東門','Daan-Park':'大安森林公園',Daan:'大安',Xinyi:'信義安和',Taipei101:'台北101／世貿',Xiangshan:'象山'
};
const blueNames = {
  Dingpu:'頂埔',Yongning:'永寧',Tucheng:'土城',Haishan:'海山','FE-Hospital':'亞東醫院',Fuzhong:'府中',Banqiao:'板橋',Xinpu:'新埔',Jiangzicui:'江子翠',LongshanTemple:'龍山寺',Ximen:'西門',Taipei:'台北車站',ShandaoTemple:'善導寺',ZhongxiaoXinsheng:'忠孝新生',ZhongXiaoFuxing:'忠孝復興',ZhongxiaoDunhua:'忠孝敦化',SYS:'國父紀念館',TaipeiCityHall:'市政府',Yongchun:'永春',Houshanpi:'後山埤',Kunyang:'昆陽',Nangang:'南港','Nangang-EC':'南港展覽館'
};
const orangeNames = {
  Nanshijiao:'南勢角',Jingan:'景安',Yongan:'永安市場',Dingxi:'頂溪',Guting:'古亭',Songjiangnanjing:'松江南京',XingtianTemple:'行天宮','Zhongshan-ES':'中山國小',Daqiaotou:'大橋頭','Taipei-bridge':'台北橋',Cailiao:'菜寮',Sanchong:'三重',XianseTemple:'先嗇宮',Touqianzhuang:'頭前庄',Xinzhuang:'新莊','FuJen-University':'輔大',Danfeng:'丹鳳',Huilong:'迴龍','Sanchong-ES':'三重國小','Sanhe-JHS':'三和國中','St-Ignatius-HS':'徐匯中學','Sanmin-HS':'三民高中',Luzhou:'蘆洲'
};

const green = [
  station('Songshan','松山',989,1023),station('Nanjing-Sanmin','南京三民',918,1023),station('Taipei-Arena','台北小巨蛋',837,1023),station('Nanjing-Fuxing','南京復興',728,1023),station('Songjiangnanjing','松江南京',640,1044),station('Zhongshan','中山',523,1023),station('Beimen','北門',456,1081),station('Ximen','西門',457,1182),station('Xiaonanmen','小南門',487,1204),station('CKS','中正紀念堂',552,1219),station('Guting','古亭',613,1294),station('Taipower-Building','台電大樓',655,1337),station('Gongguan','公館',694,1386),station('Wanlong','萬隆',698,1443),station('Jingmei','景美',694,1485),station('Dapinglin','大坪林',694,1537),station('Qizhang','七張',694,1591),station('Xindian-District-Office','新店區公所',697,1643),station('Xindian','新店',697,1702),station('Xiaobitan','小碧潭',641,1600)
];
const brown = [
  station('Taipei-Zoo','動物園',1025,1410),station('Muzha','木柵',1006,1410),station('Wanfang-Community','萬芳社區',963,1412),station('Wanfang-Hospital','萬芳醫院',902,1412),station('Xinhai','辛亥',848,1370),station('Linguang','麟光',848,1318),station('Liuzhangli','六張犁',813,1295),station('Technology-Building','科技大樓',755,1293),station('Daan','大安',727,1236),station('ZhongXiaoFuxing','忠孝復興',727,1157),station('Nanjing-Fuxing','南京復興',728,1057),station('Zhongshan-JHS','中山國中',718,975),station('Songshan-Airport','松山機場',718,885),station('Dazhi','大直',718,808),station('Jiannan-Road','劍南路',781,775),station('Xihu','西湖',845,775),station('Gangqian','港墘',908,775),station('Wende','文德',972,775),station('Neihu','內湖',1035,775),station('Dahu-Park','大湖公園',1092,808),station('Huzhou','葫洲',1133,850),station('Donghu','東湖',1149,899),station('Nangang-Software-Park','南港軟體園區',1156,965),station('Nangang-EC','南港展覽館',1175,1079)
];

export const lines = [
  { id:'red', code:'R', name:'淡水信義線', color:'#e4002b', paths:[normalize(redLineStations, redNames, projectRedPoint)] },
  { id:'blue', code:'BL', name:'板南線', color:'#0070bd', paths:[normalize(blueLineStations, blueNames, scaleLegacyPoint)] },
  { id:'green', code:'G', name:'松山新店線', color:'#008659', paths:[green] },
  { id:'orange', code:'O', name:'中和新蘆線', color:'#f8b61c', paths:[normalize(orangeLineStations, orangeNames, scaleLegacyPoint)] },
  { id:'brown', code:'BR', name:'文湖線', color:'#a67c24', paths:[brown] }
];
