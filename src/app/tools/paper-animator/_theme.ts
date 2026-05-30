export interface PaperTheme {
  bgColor: string;
  bgGradientEnd: string;
  useGradient: boolean;
  headlineColor: string;
  bodyColor: string;
  breadcrumbColor: string;
  highlightColor: string;
  highlightTextColor: string;
  dividerColor: string;
  fontNameColor: string;
  vignetteColor: string;
  vignetteOpacity: number;
  noiseOpacity: number;
}

// Default = aged newspaper look matching the reference image
export const DEFAULT_THEME: PaperTheme = {
  bgColor: '#d9c9a3',
  bgGradientEnd: '#a8905c',
  useGradient: true,
  headlineColor: '#1a1208',
  bodyColor: 'rgba(20,16,8,0.78)',
  breadcrumbColor: 'rgba(50,38,15,0.50)',
  highlightColor: '#f5e642',
  highlightTextColor: '#1a1208',
  dividerColor: 'rgba(50,38,15,0.20)',
  fontNameColor: 'rgba(50,38,15,0.28)',
  vignetteColor: 'rgb(26,16,4)',
  vignetteOpacity: 0.38,
  noiseOpacity: 0.08,
};

export const DEFAULT_FRAMES = [
  {
    headline: 'World Markets Hit Record Highs',
    body: 'Global markets surged to all-time highs today as investors reacted positively to economic data. Analysts say the World economy continues to show resilience against headwinds.',
  },
  {
    headline: 'World Leaders Convene in Geneva',
    body: 'The annual World summit in Geneva brought together heads of state from over 80 nations. Discussions centered on climate, trade, and the path to a sustainable World order.',
  },
  {
    headline: 'New World Heritage Sites Announced',
    body: 'UNESCO unveiled twelve new World Heritage Sites this year, spanning four continents. The additions highlight humanity\'s shared commitment to preserving our World\'s cultural legacy.',
  },
  {
    headline: 'World Cup Fever Grips the Globe',
    body: 'As the World Cup draws near, excitement is building across stadiums and screens worldwide. The tournament promises to be the most-watched World sporting event in history.',
  },
];
