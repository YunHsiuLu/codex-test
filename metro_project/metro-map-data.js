import { redLineStations } from './metroLines/red/red-line.js';
import { blueLineStations } from './metroLines/blue/blue-line.js';
import { orangeLineStations } from './metroLines/orange/orange-line.js';

const station = (key, name, x, y) => ({ key, label: key, name, x, y });
const normalize = (points, names) => points.map(point => ({
  ...point, key: point.label, name: names[point.label] || point.label
}));

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
  station('Songshan','松山',1015,1077),station('Nanjing-Sanmin','南京三民',930,1077),station('Taipei-Arena','台北小巨蛋',830,1077),station('Nanjing-Fuxing','南京復興',758,1077),station('Songjiangnanjing','松江南京',660,1077),station('Zhongshan','中山',550,1080),station('Beimen','北門',510,1120),station('Ximen','西門',472,1213),station('Xiaonanmen','小南門',515,1250),station('CKS','中正紀念堂',550,1270),station('Guting','古亭',595,1315),station('Taipower-Building','台電大樓',635,1360),station('Gongguan','公館',665,1405),station('Wanlong','萬隆',700,1450),station('Jingmei','景美',730,1500),station('Dapinglin','大坪林',730,1550),station('Qizhang','七張',730,1610),station('Xindian-District-Office','新店區公所',730,1660),station('Xindian','新店',730,1710),station('Xiaobitan','小碧潭',660,1600)
];
const brown = [
  station('Taipei-Zoo','動物園',1110,1550),station('Muzha','木柵',1050,1550),station('Wanfang-Community','萬芳社區',990,1550),station('Wanfang-Hospital','萬芳醫院',930,1550),station('Xinhai','辛亥',880,1500),station('Linguang','麟光',850,1440),station('Liuzhangli','六張犁',820,1380),station('Technology-Building','科技大樓',790,1330),station('Daan','大安',760,1270),station('ZhongXiaoFuxing','忠孝復興',758,1170),station('Nanjing-Fuxing','南京復興',758,1077),station('Zhongshan-JHS','中山國中',758,1010),station('Songshan-Airport','松山機場',758,930),station('Dazhi','大直',800,850),station('Jiannan-Road','劍南路',820,760),station('Xihu','西湖',885,760),station('Gangqian','港墘',950,760),station('Wende','文德',1010,760),station('Neihu','內湖',1070,760),station('Dahu-Park','大湖公園',1130,810),station('Huzhou','葫洲',1170,870),station('Donghu','東湖',1190,930),station('Nangang-Software-Park','南港軟體園區',1190,1010),station('Nangang-EC','南港展覽館',1220,1100)
];

export const lines = [
  { id:'red', code:'R', name:'淡水信義線', color:'#e4002b', paths:[normalize(redLineStations, redNames)] },
  { id:'blue', code:'BL', name:'板南線', color:'#0070bd', paths:[normalize(blueLineStations, blueNames)] },
  { id:'green', code:'G', name:'松山新店線', color:'#008659', paths:[green] },
  { id:'orange', code:'O', name:'中和新蘆線', color:'#f8b61c', paths:[normalize(orangeLineStations, orangeNames)] },
  { id:'brown', code:'BR', name:'文湖線', color:'#a67c24', paths:[brown] }
];
