export interface CategoryGroup {
  label: string;
  ja: string;
  color: string;
  categories: { name: string; ja: string }[];
}

export const categoryGroups: CategoryGroup[] = [
  { label: "Food & Drink", ja: "たべもの・のみもの", color: "#e6a817", categories: [
    { name: "Drinks",               ja: "のみもの" },
    { name: "Dessert",              ja: "おかし" },
    { name: "Food",                 ja: "たべもの" },
    { name: "Japanese Food",        ja: "にほんのたべもの" },
    { name: "Fruit and Vegetables", ja: "くだもの・やさい" },
    { name: "Meals",                ja: "しょくじ" },
    { name: "Ingredients",          ja: "ざいりょう" },
    { name: "Taste",                ja: "あじ" },
  ]},
  { label: "People & Self", ja: "ひと・じぶん", color: "#d64f8a", categories: [
    { name: "Feelings",       ja: "きもち" },
    { name: "People",         ja: "ひと" },
    { name: "Personality",    ja: "せいかく" },
    { name: "Family",         ja: "かぞく" },
    { name: "Body Parts",     ja: "からだ" },
    { name: "Frequency",      ja: "ひんど" },
    { name: "Daily Routines", ja: "にちじょう" },
  ]},
  { label: "Clothes & Belongings", ja: "ふく・もちもの", color: "#7c5cbf", categories: [
    { name: "Clothes",             ja: "ふく" },
    { name: "Personal Belongings", ja: "もちもの" },
    { name: "Stationery",          ja: "ぶんぼうぐ" },
  ]},
  { label: "Nature & Animals", ja: "しぜん・どうぶつ", color: "#3a9e5f", categories: [
    { name: "Animals",              ja: "どうぶつ" },
    { name: "Sea Animals",          ja: "うみのいきもの" },
    { name: "Bugs",                 ja: "むし" },
    { name: "Nature",               ja: "しぜん" },
    { name: "Environment and 4Rs",  ja: "かんきょう" },
  ]},
  { label: "Date / Time", ja: "じかん・にちじ", color: "#1a8fa0", categories: [
    { name: "Months",  ja: "つき" },
    { name: "Dates",   ja: "ひにち" },
    { name: "Days",    ja: "ようび" },
    { name: "Seasons", ja: "きせつ" },
    { name: "Weather", ja: "てんき" },
  ]},
  { label: "School", ja: "がっこう", color: "#2a6db5", categories: [
    { name: "School Subjects",  ja: "きょうか" },
    { name: "School Places",    ja: "がっこうのばしょ" },
    { name: "Club Activities",  ja: "クラブかつどう" },
    { name: "School Events",    ja: "がっこうのイベント" },
  ]},
  { label: "Arts & Play", ja: "おんがく・あそび", color: "#d9622b", categories: [
    { name: "Musical Instruments", ja: "がっき" },
    { name: "Play and Activities", ja: "あそび" },
    { name: "Sports",              ja: "スポーツ" },
  ]},
  { label: "Town & Travel", ja: "まち・いどう", color: "#5a7a8a", categories: [
    { name: "Town and Places", ja: "まち・ばしょ" },
    { name: "Vehicles",        ja: "のりもの" },
    { name: "Directions",      ja: "ほうこう" },
    { name: "Positions",       ja: "いち" },
  ]},
  { label: "Language & Concepts", ja: "ことば・がいねん", color: "#c0394b", categories: [
    { name: "Jobs",               ja: "しごと" },
    { name: "Annual Events",      ja: "ねんじゅうぎょうじ" },
    { name: "Impressions",        ja: "いんしょう" },
    { name: "Conditions",         ja: "じょうたい" },
    { name: "Colors",             ja: "いろ" },
    { name: "Shapes",             ja: "かたち" },
    { name: "Verbs (5th Grade)",  ja: "どうし（5ねんせい）" },
    { name: "Verbs (6th Grade)",  ja: "どうし（6ねんせい）" },
    { name: "Past Tense Verbs",   ja: "かこのどうし" },
  ]},
];
