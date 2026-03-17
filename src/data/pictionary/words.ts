export const themes = {
  Animals: [
    'cat', 'dog', 'bird', 'fish', 'rabbit', 'elephant', 'monkey', 'snake',
    'lion', 'tiger', 'bear', 'duck', 'frog', 'butterfly', 'turtle', 'horse',
    'cow', 'pig', 'chicken', 'penguin', 'giraffe', 'zebra', 'whale', 'crab',
  ],
  Food: [
    'apple', 'banana', 'pizza', 'bread', 'cake', 'rice', 'soup', 'egg',
    'milk', 'cheese', 'carrot', 'tomato', 'sandwich', 'ice cream', 'cookie',
    'noodles', 'watermelon', 'grapes', 'strawberry', 'popcorn', 'sushi', 'ramen',
  ],
  School: [
    'book', 'pen', 'desk', 'teacher', 'backpack', 'ruler', 'computer', 'board',
    'pencil', 'eraser', 'notebook', 'scissors', 'glue', 'crayon', 'map',
    'clock', 'chair', 'glasses', 'stapler', 'folder', 'library', 'gym',
  ],
  Home: [
    'bed', 'chair', 'table', 'door', 'window', 'sofa', 'kitchen', 'bathroom',
    'clock', 'lamp', 'mirror', 'pillow', 'blanket', 'television', 'refrigerator',
    'stove', 'toilet', 'shower', 'curtain', 'shelf', 'stairs', 'garage',
  ],
  Nature: [
    'tree', 'flower', 'sun', 'moon', 'star', 'rain', 'mountain', 'river',
    'cloud', 'rainbow', 'ocean', 'beach', 'forest', 'snow', 'wind', 'leaf',
    'rock', 'grass', 'waterfall', 'volcano', 'island', 'desert',
  ],
  Sports: [
    'football', 'basketball', 'swimming', 'running', 'tennis', 'bicycle',
    'jump rope', 'baseball', 'golf', 'skiing', 'surfing', 'boxing', 'yoga',
    'bowling', 'archery', 'diving', 'gymnastics', 'rowing', 'climbing', 'skating',
  ],
} as const;

export type Theme = keyof typeof themes;
export const themeNames = Object.keys(themes) as Theme[];

export function getRandomWord(theme: Theme): string {
  const words = themes[theme];
  return words[Math.floor(Math.random() * words.length)];
}
