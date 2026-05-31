'use strict';
/* ═══════════════════════════════════════════
   리셀그라운드 — 상태 + 데이터
═══════════════════════════════════════════ */

/* 배포 후 실제 Workers URL로 교체 */
const API_BASE = (() => {
  const h = window.location.hostname;
  if (h === 'resellground.pages.dev') return 'https://backend.cooltime601.workers.dev';
  return 'http://localhost:8787';
})();

const S = {
  page: 'home',
  loggedIn: false,
  chatOpen: false,
  chatUser: null,
  drawerOpen: false,
  openModals: new Set(),
  feedTimer: null,
  feedIdx: 0,
  popularPage: 1,
  popularCategory: '전체',
  popularHasMore: true,
  popularLoading: false,
};

const DATA = {
  sellers: [
    {id:1,av:'av-a',em:'🔥',name:'sneaker.kang',handle:'@sneaker.kang',loc:'서울',onlineNow:true,lastTrade:'방금 전',weekTrades:12,
     tier:'인증 셀러',tierCls:'verified',tags:['Jordan','Nike SB','한정판'],
     cat:'스니커즈',sales:847,rating:4.98,followers:'3.2K',
     successRate:99.2,replyTime:'평균 8분',shippingTime:'당일 발송',
     tradeCount:847,cleanDays:365,weeklyTop:true},
    {id:2,av:'av-b',em:'💎',name:'luxe.j',handle:'@luxe.j',loc:'강남',onlineNow:true,lastTrade:'3분 전',weekTrades:9,
     tier:'인증 셀러',tierCls:'verified',tags:['Chanel','Gucci','LV'],
     cat:'명품/럭셔리',sales:612,rating:5.0,followers:'2.8K',
     successRate:100,replyTime:'평균 5분',shippingTime:'익일 발송',
     tradeCount:612,cleanDays:280,weeklyTop:true},
    {id:3,av:'av-c',em:'⌚',name:'watch.yk',handle:'@watch.yk',loc:'부산',onlineNow:false,lastTrade:'1시간 전',weekTrades:7,
     tier:'신뢰 셀러',tierCls:'trusted',tags:['Rolex','Omega'],
     cat:'시계',sales:431,rating:4.96,followers:'1.9K',
     successRate:98.6,replyTime:'평균 15분',shippingTime:'1~2일',
     tradeCount:431,cleanDays:180,weeklyTop:true},
    {id:4,av:'av-d',em:'🧥',name:'techwear.s',handle:'@techwear.s',loc:'홍대',onlineNow:false,lastTrade:'3시간 전',weekTrades:4,
     tier:'신뢰 셀러',tierCls:'trusted',tags:["Stone Island","Arc'teryx"],
     cat:'아우터/의류',sales:289,rating:4.91,followers:'1.1K',
     successRate:97.4,replyTime:'평균 20분',shippingTime:'1~2일',
     tradeCount:289,cleanDays:120,weeklyTop:false},
    {id:5,av:'av-e',em:'👟',name:'kicks.p',handle:'@kicks.p',loc:'인천',onlineNow:true,lastTrade:'22분 전',weekTrades:3,
     tier:'일반 셀러',tierCls:'',tags:['NB','Asics'],
     cat:'스니커즈',sales:201,rating:4.88,followers:'892',
     successRate:96.0,replyTime:'평균 30분',shippingTime:'1~3일',
     tradeCount:201,cleanDays:90,weeklyTop:false},
    {id:6,av:'av-a',em:'💍',name:'gold.s',handle:'@gold.s',loc:'서울',onlineNow:false,lastTrade:'어제',weekTrades:2,
     tier:'일반 셀러',tierCls:'',tags:['Cartier','주얼리'],
     cat:'명품/럭셔리',sales:178,rating:4.95,followers:'743',
     successRate:97.8,replyTime:'평균 25분',shippingTime:'1~2일',
     tradeCount:178,cleanDays:75,weeklyTop:false},
  ],
  drops: [
    {em:'👟',bg:'linear-gradient(135deg,#f3f4f6,#e5e7eb)',
     badgeCls:'hot',badgeTxt:'🔥 HOT',cat:'스니커즈',
     name:'Air Jordan 1 Retro High OG "Lost & Found"',
     seller:'@sneaker.kang',price:'₩ 680,000',interest:84,
     status:'판매중',tag:'빠른거래',postedAt:'방금 등록됨'},
    {em:'👜',bg:'linear-gradient(135deg,#f9fafb,#f3f4f6)',
     badgeCls:'new',badgeTxt:'NEW',cat:'명품',
     name:'Gucci Ophidia GG Medium Tote',
     seller:'@luxe.j',price:'₩ 1,240,000',interest:31,
     status:'판매중',tag:'인증셀러',postedAt:'8분 전'},
    {em:'⌚',bg:'linear-gradient(135deg,#f3f4f6,#e5e7eb)',
     badgeCls:'rare',badgeTxt:'RARE',cat:'시계',
     name:'Rolex Submariner Date 41mm',
     seller:'@watch.yk',price:'₩ 12,800,000',interest:62,
     status:'예약중',tag:'협업모집',postedAt:'23분 전'},
    {em:'🧥',bg:'linear-gradient(135deg,#f9fafb,#f3f4f6)',
     badgeCls:'new',badgeTxt:'NEW',cat:'의류',
     name:'Stone Island Shadow Project Shell',
     seller:'@techwear.s',price:'₩ 980,000',interest:28,
     status:'판매중',tag:'',postedAt:'1시간 전'},
    {em:'👟',bg:'linear-gradient(135deg,#f3f4f6,#e5e7eb)',
     badgeCls:'hot',badgeTxt:'HOT',cat:'스니커즈',
     name:'Nike Dunk Low Panda',
     seller:'@kicks.p',price:'₩ 189,000',interest:47,
     status:'판매완료',tag:'',postedAt:'2시간 전'},
    {em:'💍',bg:'linear-gradient(135deg,#f9fafb,#f3f4f6)',
     badgeCls:'rare',badgeTxt:'RARE',cat:'명품',
     name:'Cartier Love Bracelet Yellow Gold',
     seller:'@gold.s',price:'₩ 2,100,000',interest:39,
     status:'판매중',tag:'인증셀러',postedAt:'3시간 전'},
  ],
  rankings: [
    {rank:1,av:'av-a',em:'🔥',name:'sneaker.kang',spec:'스니커즈 · 서울',count:847,top:true,weeklyTop:true},
    {rank:2,av:'av-b',em:'💎',name:'luxe.j',spec:'명품 · 강남',count:612,top:true,weeklyTop:true},
    {rank:3,av:'av-c',em:'⌚',name:'watch.yk',spec:'시계 · 부산',count:431,top:true,weeklyTop:true},
    {rank:4,av:'av-d',em:'🧥',name:'techwear.s',spec:'아우터 · 홍대',count:289,top:false,weeklyTop:false},
    {rank:5,av:'av-e',em:'👟',name:'kicks.p',spec:'스니커즈 · 인천',count:201,top:false,weeklyTop:false},
  ],
  posts: [
    {av:'av-a',em:'🔥',author:'sneaker.kang',authorTier:'verified',time:'5분 전',badge:'인증',
     tags:['인증셀러','빠른거래'],
     title:'조던1 시카고 정품 인증 완료 🔥 + 박스풀세트',
     preview:'크리스마스 선물로 구매한 조던1 시카고입니다. 정품 보증서 + 박스 풀세트. 직거래 선호, 서울/경기.',
     likes:84,comments:31,views:412},
    {av:'av-b',em:'💎',author:'luxe.j',authorTier:'verified',time:'22분 전',badge:'정보',
     tags:['협업모집','인증셀러'],
     title:'명품 직거래 시 주의해야 할 점 총정리 + 콜라보 셀러 구함',
     preview:'명품 직거래에서 자주 발생하는 사기 유형과 대처법. 함께 활동할 리셀 파트너도 모집합니다.',
     likes:61,comments:22,views:893},
    {av:'av-c',em:'⌚',author:'watch.yk',authorTier:'trusted',time:'1시간 전',badge:'시세',
     tags:['시세정보'],
     title:'롤렉스 서브마리너 최근 시세 동향 📈',
     preview:'2024년 하반기 롤렉지 시세 변화를 분석해봤습니다. 지금이 진입 타이밍인 이유.',
     likes:49,comments:15,views:1204},
    {av:'av-d',em:'🧥',author:'techwear.s',authorTier:'trusted',time:'2시간 전',badge:'후기',
     tags:['거래후기'],
     title:'스톤아일랜드 쉐도우 프로젝트 직거래 후기 ⭐⭐⭐⭐⭐',
     preview:'리셀그라운드 통해서 직거래 완료했습니다. 판매자 응답 빠르고 상품 상태 최상.',
     likes:44,comments:12,views:367},
  ],
  markets: [
    {cat:'스니커즈',name:'Air Jordan 1 Chicago',price:'₩ 680,000',change:'+12.4%',up:true,bars:[30,45,38,52,60,55,72,65,80,75,85,90]},
    {cat:'스니커즈',name:'Nike Dunk Low Panda',price:'₩ 189,000',change:'+5.2%',up:true,bars:[60,58,65,62,70,75,68,72,80,77,85,82]},
    {cat:'시계',name:'Rolex Submariner 41mm',price:'₩ 12,800,000',change:'+3.1%',up:true,bars:[55,60,58,62,65,70,68,72,75,78,80,85]},
    {cat:'명품 백',name:'Chanel Classic Flap',price:'₩ 8,400,000',change:'-1.2%',up:false,bars:[90,85,88,82,85,80,78,75,72,70,68,65]},
    {cat:'스니커즈',name:'New Balance 2002R',price:'₩ 148,000',change:'+8.7%',up:true,bars:[20,28,35,42,38,45,50,55,60,65,70,78]},
    {cat:'주얼리',name:'Cartier Love Bracelet',price:'₩ 2,100,000',change:'+2.3%',up:true,bars:[50,52,55,58,60,62,65,68,70,72,75,78]},
  ],
  /* 실시간 거래 로그 */
  tradeLogs: [
    {em:'👟',item:'Air Jordan 1 Chicago',price:'₩680,000',action:'거래 완료',time:'방금 전',change:null},
    {em:'👜',item:'Gucci Ophidia GG',price:'₩1,240,000',action:'가격 상승',time:'2분 전',change:'+4.2%'},
    {em:'⌚',item:'Rolex Sub 41mm',price:'₩12,800,000',action:'새 드롭',time:'3분 전',change:null},
    {em:'👟',item:'Nike Dunk Low Panda',price:'₩189,000',action:'거래 완료',time:'5분 전',change:null},
    {em:'🧥',item:'Stone Island Shadow',price:'₩980,000',action:'관심 급상승',time:'7분 전',change:'+31명'},
    {em:'💎',item:'Chanel Classic Flap',price:'₩8,400,000',action:'가격 하락',time:'9분 전',change:'-1.2%'},
    {em:'👟',item:'Off-White Dunk',price:'₩520,000',action:'가격 상승',time:'11분 전',change:'+6.8%'},
    {em:'💍',item:'Cartier Love Bracelet',price:'₩2,100,000',action:'거래 완료',time:'15분 전',change:null},
  ],
  feedQueue: [
    {av:'av-a',em:'👟',user:'@kicks.p',action:'거래 완료 —',item:'New Balance 2002R',price:'₩148K',badge:'직거래',trust:'인증'},
    {av:'av-b',em:'💍',user:'@gold.s',action:'새 드롭 등록 —',item:'Cartier Love Bracelet',price:'₩2.1M',badge:'안전결제',trust:'신뢰'},
    {av:'av-c',em:'🧢',user:'@cap.crew',action:'가격 상승 —',item:'Palace Tri-Ferg Cap',price:'₩84K +5%',badge:'시세변동',trust:''},
    {av:'av-d',em:'👜',user:'@bag.hn',action:'협업 모집 —',item:'Prada Re-Nylon Bag',price:'₩680K',badge:'협업',trust:'신뢰'},
    {av:'av-e',em:'👟',user:'@dunk.y',action:'거래 완료 —',item:'Nike Dunk High Panda',price:'₩215K',badge:'직거래',trust:''},
    {av:'av-a',em:'⌚',user:'@time.k',action:'새 드롭 등록 —',item:'AP Royal Oak 41mm',price:'₩28.5M',badge:'전국거래',trust:'인증'},
  ],
  chatMessages: {
    'sneaker.kang': [
      {me:false,t:'사이즈 265도 있나요?',read:true},
      {me:true,t:'안녕하세요! 265는 품절이고 270만 남아있습니다.',read:true},
      {me:false,t:'아 그렇군요, 270 한번 고민해볼게요',read:true},
    ],
    'luxe.j': [
      {me:false,t:'정품 확인서 있나요?',read:true},
      {me:true,t:'네 정품 보증서 + 영수증 풀세트 있습니다.',read:false},
    ],
    'watch.yk': [
      {me:false,t:'직거래 가능한 지역이 어디인가요?',read:true},
      {me:true,t:'강남 직거래 가능합니다.',read:false},
    ],
  },
  /* 최근 본 상품 */
  recentViewed: [
    {em:'👟',name:'Air Jordan 1 Chicago',price:'₩680,000',cat:'스니커즈'},
    {em:'⌚',name:'Rolex Sub 41mm',price:'₩12,800,000',cat:'시계'},
    {em:'👜',name:'Gucci Ophidia GG',price:'₩1,240,000',cat:'명품'},
  ],

  /* 북마크 — { postId, post } 형태로 저장 */
  bookmarks: [],

  /* 사용자가 직접 등록한 게시물 */
  userPosts: [],

  /* 알림 */
  notifications: [
    {type:'trade',msg:'sneaker.kang님의 Jordan 1이 예약됐습니다.',time:'3분 전',read:false},
    {type:'price',msg:'관심 상품 "Dunk Low Panda" 가격이 하락했습니다.',time:'1시간 전',read:false},
    {type:'chat',msg:'luxe.j님이 메시지를 보냈습니다.',time:'2시간 전',read:true},
    {type:'follow',msg:'techwear.s님이 팔로우했습니다.',time:'어제',read:true},
  ],
};

/* ── API 클라이언트 ── */
function mapProduct(raw) {
  return {
    id: raw.id, em: raw.em, bg: raw.bg,
    badgeCls: raw.badge_cls, badgeTxt: raw.badge_txt,
    cat: raw.cat, name: raw.name, seller: raw.seller,
    price: raw.price, interest: raw.interest,
    status: raw.status, tag: raw.tag,
  };
}

async function fetchProducts({ category = '전체', page = 1, limit = 8, sort = 'popular' } = {}) {
  const params = new URLSearchParams({ page, limit, sort });
  if (category !== '전체') params.set('category', category);
  const res = await fetch(`${API_BASE}/api/products?${params}`);
  if (!res.ok) throw new Error(`API ${res.status}`);
  const data = await res.json();
  return { items: (data.items || []).map(mapProduct), total: data.total, page: data.page, hasMore: data.hasMore };
}

/* ═══════════════════════════════════════════
   RG_CATEGORIES — 카테고리 트리 (Work 1)
   js/ui.js의 RG.categorySheet 에서 사용
═══════════════════════════════════════════ */
const RG_CATEGORIES = [
  { id:'clothing',  label:'의류',     icon:'👕', children:[
    { id:'mens',    label:'남성의류', children:[
      { id:'mens_top',    label:'상의',   children:[
        {id:'tshirt',  label:'티셔츠'},  {id:'shirt',   label:'셔츠'},
        {id:'knit',    label:'니트·스웨터'}, {id:'hoodie',  label:'후드·맨투맨'},
        {id:'sleeveless',label:'민소매'},
      ]},
      { id:'mens_outer',  label:'아우터', children:[
        {id:'jacket',  label:'재킷'},    {id:'coat',    label:'코트'},
        {id:'padded',  label:'패딩'},    {id:'vest',    label:'조끼·베스트'},
      ]},
      { id:'mens_bottom', label:'하의',   children:[
        {id:'pants',   label:'팬츠·슬랙스'}, {id:'jeans',   label:'청바지'},
        {id:'shorts',  label:'반바지'},  {id:'sweatpants',label:'스웨트팬츠'},
      ]},
    ]},
    { id:'womens',  label:'여성의류', children:[
      { id:'womens_top',  label:'상의',   children:[
        {id:'wtshirt', label:'티셔츠·블라우스'}, {id:'wknit',   label:'니트·스웨터'},
        {id:'wouter',  label:'아우터'},
      ]},
      { id:'womens_dress',label:'원피스·스커트', children:[
        {id:'dress',   label:'원피스'},  {id:'skirt',   label:'스커트'},
      ]},
    ]},
    { id:'unisex',  label:'유니섹스', children:[
      {id:'u_hoodie', label:'후드·맨투맨'}, {id:'u_tshirt', label:'티셔츠'},
      {id:'u_pants',  label:'팬츠'},
    ]},
  ]},
  { id:'shoes',     label:'신발',     icon:'👟', children:[
    { id:'sneakers',     label:'스니커즈', children:[
      {id:'hi_top',  label:'하이탑'},   {id:'lo_top',  label:'로우탑'},
      {id:'mid',     label:'미드탑'},   {id:'platform',label:'플랫폼'},
    ]},
    { id:'dress_shoes',  label:'구두·로퍼', children:[
      {id:'loafer',  label:'로퍼'},     {id:'oxford',  label:'옥스포드'},
      {id:'derby',   label:'더비'},
    ]},
    { id:'sandals',      label:'샌들·슬리퍼', children:[
      {id:'sandal',  label:'샌들'},     {id:'slipper', label:'슬리퍼'},
      {id:'birken',  label:'버켄스탁류'},
    ]},
    { id:'boots',        label:'부츠', children:[
      {id:'ankle_boot', label:'앵클부츠'}, {id:'mid_boot', label:'미드부츠'},
      {id:'long_boot',  label:'롱부츠'},
    ]},
  ]},
  { id:'bag',       label:'가방',     icon:'👜', children:[
    {id:'backpack',  label:'백팩'},    {id:'shoulder', label:'숄더백'},
    {id:'tote',      label:'토트백'},  {id:'clutch',   label:'클러치'},
    {id:'crossbody', label:'크로스바디'},
  ]},
  { id:'accessory', label:'패션잡화', icon:'🧣', children:[
    { id:'hat',    label:'모자',   children:[
      {id:'cap',    label:'볼캡·스냅백'}, {id:'beanie', label:'비니'},
      {id:'bucket', label:'버킷햇'},
    ]},
    { id:'wallet', label:'지갑',   children:[
      {id:'long_wallet',  label:'장지갑'}, {id:'short_wallet', label:'반지갑'},
      {id:'card_wallet',  label:'카드지갑'},
    ]},
    {id:'belt',    label:'벨트'},     {id:'scarf',   label:'스카프·머플러'},
    {id:'glasses', label:'안경·선글라스'},
  ]},
  { id:'luxury',    label:'명품',     icon:'💎', children:[
    {id:'lux_bag',      label:'명품 가방'},  {id:'lux_wallet',  label:'명품 지갑'},
    {id:'lux_clothes',  label:'명품 의류'},  {id:'lux_shoes',   label:'명품 신발'},
    {id:'lux_jewelry',  label:'주얼리·액세서리'},
  ]},
  { id:'watch',     label:'시계',     icon:'⌚', children:[
    {id:'mech_watch',    label:'기계식 시계'}, {id:'quartz_watch', label:'쿼츠 시계'},
    {id:'smartwatch',    label:'스마트워치'},  {id:'vintage_watch',label:'빈티지 시계'},
  ]},
  { id:'jewelry',   label:'주얼리',   icon:'💍', children:[
    {id:'necklace', label:'목걸이'},  {id:'ring',     label:'반지'},
    {id:'bracelet', label:'팔찌'},    {id:'earring',  label:'귀걸이'},
  ]},
  { id:'tech',      label:'테크·가전',icon:'💻', children:[
    {id:'phone',    label:'스마트폰'}, {id:'laptop',  label:'노트북·태블릿'},
    {id:'audio',    label:'음향기기'}, {id:'camera',  label:'카메라'},
    {id:'game',     label:'게임기기'},
  ]},
  { id:'etc',       label:'기타',     icon:'📦' },
];
