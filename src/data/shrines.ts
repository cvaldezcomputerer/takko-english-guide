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
  directions: { en: string; ja: string };
  mainImage?: string;
  roadViewImage?: string;
  galleryImages?: string[];
  galleryLayout?: 'strip' | 'grid' | 'mosaic';
  subShrines?: SubShrine[];
}

export const shrines: Shrine[] = [
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
        en: 'The shrine grounds contain several smaller sub-shrines, each dedicated to a different deity.',
        ja: '境内にはいくつかの末社があり、それぞれ異なる神様をお祀りしています。',
      },
    ],
    address: {
      en: 'Takko Machi, Sannohe-gun, Aomori',
      ja: '青森県三戸郡田子町',
    },
    directions: {
      en: 'Placeholder — add directions here.',
      ja: 'アクセス情報を追加してください。',
    },
    mainImage: '/images/shrines/奉納/far-away-view.jpeg',
    roadViewImage: '/images/shrines/奉納/view-from-road.jpeg',
    galleryLayout: 'grid',
    galleryImages: [
      '/images/shrines/奉納/front-of-shrine.jpeg',
      '/images/shrines/奉納/closer-front-view.jpeg',
      '/images/shrines/奉納/shrine-main-building.jpeg',
      '/images/shrines/奉納/metal-showcase.jpeg',
      '/images/shrines/奉納/rock.jpeg',
    ],
    subShrines: [
      {
        name: { en: 'Placeholder Sub-shrine A', ja: '末社A（仮）' },
        description: { en: 'Placeholder description.', ja: '説明文（仮）' },
        image: '/images/shrines/奉納/mini-shrine-1.jpeg',
      },
      {
        name: { en: 'Placeholder Sub-shrine B', ja: '末社B（仮）' },
        description: { en: 'Placeholder description.', ja: '説明文（仮）' },
        image: '/images/shrines/奉納/mini-shrine-2.jpeg',
      },
      {
        name: { en: 'Placeholder Sub-shrine C', ja: '末社C（仮）' },
        image: '/images/shrines/奉納/mini-shrine-3.jpeg',
      },
      {
        name: { en: 'Placeholder Sub-shrine D', ja: '末社D（仮）' },
        image: '/images/shrines/奉納/mini-shrine-4.jpeg',
      },
      {
        name: { en: 'Placeholder Sub-shrine E', ja: '末社E（仮）' },
        image: '/images/shrines/奉納/mini-shrine-6.jpeg',
      },
    ],
  },
];
