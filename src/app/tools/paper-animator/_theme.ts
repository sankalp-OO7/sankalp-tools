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

// Default = aged newspaper look matching the reference image perfectly
export const DEFAULT_THEME: PaperTheme = {
  bgColor: '#d8cba8',
  bgGradientEnd: '#ad9b6d',
  useGradient: true,
  headlineColor: '#1a1208',
  bodyColor: 'rgba(20,16,8,0.85)',
  breadcrumbColor: 'rgba(50,38,15,0.60)',
  highlightColor: 'rgba(242,222,46,0.80)', // Bright authentic translucent highlighter yellow
  highlightTextColor: '#000000',
  dividerColor: 'rgba(50,38,15,0.22)',
  fontNameColor: 'rgba(50,38,15,0.30)',
  vignetteColor: 'rgb(24,14,4)',
  vignetteOpacity: 0.42,
  noiseOpacity: 0.08,
};

export const DEFAULT_FRAMES = [
  {
    headline: 'Qualifier 2 in Frameworks',
    body: 'The introduction of Qualifier 2 in modern educational frameworks has become a pivotal criteria and standard.',
  },
  {
    headline: 'Qualifier 2 in Modern Curriculums',
    body: 'This article discusses how Qualifier 2 shapes standard requirements, evaluating compliance and quality.',
  },
  {
    headline: 'Origins of Qualifier 2',
    body: 'This new review traces the origins of Qualifier 2 and its foundational role in contemporary teaching systems.',
  },
  {
    headline: 'Qualifier 2 Guidelines',
    body: 'Educators must strictly apply Qualifier 2 across diverse schools, ensuring all classrooms meet the new standard.',
  },
];
