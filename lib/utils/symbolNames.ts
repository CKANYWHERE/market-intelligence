/**
 * 티커 → 회사명. en.wikipedia.org/wiki/Nasdaq-100 크롤링 결과 기반
 * (TRACKED_SYMBOLS와 동일 출처 — lib/batch/sync-stock-prices.ts 참고)
 */
export const SYMBOL_NAMES: Record<string, string> = {
  QQQ: 'Invesco QQQ Trust', SPY: 'SPDR S&P 500 ETF',
  ADBE: 'Adobe', ADP: 'ADP', AMD: 'AMD', ABNB: 'Airbnb', ALNY: 'Alnylam Pharmaceuticals',
  GOOGL: 'Alphabet', AMZN: 'Amazon', AEP: 'American Electric Power', AMGN: 'Amgen',
  ADI: 'Analog Devices', AAPL: 'Apple', AMAT: 'Applied Materials', APP: 'AppLovin',
  ARM: 'Arm', ASML: 'ASML', ALAB: 'Astera Labs', ADSK: 'Autodesk', AXON: 'Axon',
  BKR: 'Baker Hughes', BKNG: 'Booking Holdings', AVGO: 'Broadcom', CDNS: 'Cadence',
  CTAS: 'Cintas', CSCO: 'Cisco', CCEP: 'Coca-Cola Europacific Partners', CMCSA: 'Comcast',
  CEG: 'Constellation Energy', CPRT: 'Copart', CRWV: 'CoreWeave', COST: 'Costco',
  CRWD: 'CrowdStrike', CSX: 'CSX', DDOG: 'Datadog', DXCM: 'Dexcom',
  FANG: 'Diamondback Energy', DASH: 'DoorDash', EXC: 'Exelon', FAST: 'Fastenal',
  FER: 'Ferrovial', FTNT: 'Fortinet', GEHC: 'GE HealthCare', GILD: 'Gilead Sciences',
  HON: 'Honeywell', IDXX: 'Idexx Laboratories', INTC: 'Intel', INTU: 'Intuit',
  ISRG: 'Intuitive Surgical', KDP: 'Keurig Dr Pepper', KLAC: 'KLA', LRCX: 'Lam Research',
  LIN: 'Linde', LITE: 'Lumentum', MAR: 'Marriott International', MRVL: 'Marvell Technology',
  MELI: 'MercadoLibre', META: 'Meta Platforms', MCHP: 'Microchip Technology',
  MU: 'Micron Technology', MSFT: 'Microsoft', MSTR: 'MicroStrategy',
  MDLZ: 'Mondelez International', MPWR: 'Monolithic Power Systems', MNST: 'Monster Beverage',
  NBIS: 'Nebius Group', NFLX: 'Netflix', NVDA: 'Nvidia', NXPI: 'NXP',
  ORLY: "O'Reilly Auto Parts", ODFL: 'Old Dominion', PCAR: 'Paccar', PLTR: 'Palantir',
  PANW: 'Palo Alto Networks', PAYX: 'Paychex', PYPL: 'PayPal', PDD: 'PDD Holdings',
  PEP: 'PepsiCo', QCOM: 'Qualcomm', REGN: 'Regeneron', RKLB: 'Rocket Lab',
  ROP: 'Roper Technologies', ROST: 'Ross Stores', SNDK: 'Sandisk', STX: 'Seagate Technology',
  SHOP: 'Shopify', SPCX: 'SpaceX', SBUX: 'Starbucks', SNPS: 'Synopsys',
  TMUS: 'T-Mobile US', TTWO: 'Take-Two Interactive', TER: 'Teradyne', TSLA: 'Tesla',
  TXN: 'Texas Instruments', TRI: 'Thomson Reuters', VRTX: 'Vertex Pharmaceuticals',
  WMT: 'Walmart', WBD: 'Warner Bros. Discovery', WDC: 'Western Digital', WDAY: 'Workday',
  XEL: 'Xcel Energy',
};
