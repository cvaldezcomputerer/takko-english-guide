export interface SubShrine {
  name: { en: string; ja: string };
  description?: { en: string; ja: string };
  image?: string;
}

export interface Shrine {
  slug: string;
  name: { en: string; ja: string };
  deity: { en: string; ja: string };
  description: Array<{ en: string; ja: string }>;
  address: { en: string; ja: string };
  accessNotes?: { en: string; ja: string };
  coords?: [number, number]; // [lat, lng] — approximate until verified on-site
  mainImage?: string;
  roadViewImage?: string;
  galleryImages?: string[];
  galleryLayout?: 'strip' | 'grid' | 'mosaic';
  subShrines?: SubShrine[];
}

export const shrines: Shrine[] = [
  {
    slug: 'oyamatsumi',
    name: {
      en: 'Oyamatsumi Shrine',
      ja: '大山祇神社',
    },
    deity: {
      en: 'Dedicated to Oyamatsumi no Okami — deity of mountains, seas, and war',
      ja: '大山祇大神をお祀りする神社（山・海・戦の神様）',
    },
    description: [
      {
        en: 'A shrine in Takko Machi dedicated to Oyamatsumi no Okami, one of the great deities of Japan. Oyamatsumi is the god of mountains and the sea, and is revered by farmers, fishermen, and those who work in the mountains. It seems to have been rebuilt recently.',
        ja: '田子町にある大山祇大神をお祀りする神社です。大山祇大神は日本の偉大な神様のひとつで、山と海の神として、農家・漁師・山で働く人々に広く信仰されています。最近建て替えられたようです。',
      },
    ],
    address: {
      en: 'Sakanoshita Takko, Sannohe District, Aomori 039-0201, Japan (40.3631, 141.0863)',
      ja: '〒039-0201 青森県三戸郡田子町坂ノ下（40.3631, 141.0863）',
    },
    coords: [40.36309444444444, 141.0862888888889],
    accessNotes: {
      en: 'On the road to Soyu-mura 229 Ski Land.',
      ja: '創遊村229スキーランドへ向かう道沿いにあります。',
    },
    mainImage: '/images/shrines/大山祇大神/大山祇大神-header.jpeg',
    galleryLayout: 'grid',
    galleryImages: [
      '/images/shrines/大山祇大神/大山祇大神-closeup.jpeg',
      '/images/shrines/大山祇大神/大山祇大神-inner-srhine.jpeg',
    ],
  },
  {
    slug: 'hono',
    name: {
      en: 'Hono Inari Shrine',
      ja: '奉納稲荷神社',
    },
    deity: {
      en: 'Dedicated to Inari — deity of rice, agriculture, and prosperity',
      ja: '稲荷大神をお祀りする神社',
    },
    description: [
      {
        en: 'A traditional Inari shrine located in Takko Machi, recognizable by its tall red torii gate and steep stone steps leading up through the trees.',
        ja: '田子町にある稲荷神社です。高い朱色の鳥居と木々の中を登る急な石段が特徴です。',
      },
      {
        en: 'The exact name of this shrine is not clear — 奉納 and 稲荷 are general terms used at many shrines across Japan. This shrine is notable for its metal torii gate and stone steps. A metal torii gate is unusual and rarely seen.',
        ja: 'この神社の正確な名前は不明です。「奉納」と「稲荷」は日本各地の多くの神社で使われる一般的な言葉です。金属製の鳥居と石段が特徴的です。金属製の鳥居は珍しく、あまり見かけることがありません。',
      },
    ],
    address: {
      en: '14 Tose, Takko, Sannohe District, Aomori 039-0314, Japan',
      ja: '〒039-0314 青森県三戸郡田子町戸瀬14',
    },
    coords: [40.28441834579857, 141.07665591026574],
    mainImage: '/images/shrines/奉納/front-of-shrine.jpeg',
    roadViewImage: '/images/shrines/奉納/view-from-road.jpeg',
    galleryLayout: 'grid',
    galleryImages: [
      '/images/shrines/奉納/far-away-view.jpeg',
      '/images/shrines/奉納/closer-front-view.jpeg',
      '/images/shrines/奉納/shrine-main-building.jpeg',
      '/images/shrines/奉納/metal-showcase.jpeg',
      '/images/shrines/奉納/rock.jpeg',
    ],
    subShrines: [
      {
        name: { en: 'Massha', ja: '末社' },
        description: { en: 'Unknown deity.', ja: '祭神不明' },
        image: '/images/shrines/奉納/mini-shrine-1.jpeg',
      },
      {
        name: { en: 'Massha', ja: '末社' },
        description: { en: 'Unknown deity.', ja: '祭神不明' },
        image: '/images/shrines/奉納/mini-shrine-2.jpeg',
      },
      {
        name: { en: 'Souzen-sama', ja: '蒼縉様' },
        image: '/images/shrines/奉納/mini-shrine-4.jpeg',
      },
      {
        name: { en: 'Mountain God', ja: '山の神' },
        image: '/images/shrines/奉納/mini-shrine-6.jpeg',
      },
    ],
  },
];
