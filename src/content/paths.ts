import type { LearningPathInput } from '@/lib/content/schema';

/**
 * Paths group tracks so the horizon is measured in years rather than in whichever
 * track the learner happens to be inside. Tracks named here that do not exist yet
 * are shown as roadmap — the point is that the destination is visible from day one.
 */
export const PATHS: readonly LearningPathInput[] = [
  {
    id: 'frontend',
    slug: 'frontend-developer',
    title: 'Frontend Developer',
    subtitle: 'From a blank file to a working interface.',
    description:
      'Structure and style first, then logic, then the frameworks people actually hire for. Each track assumes the one before it and nothing else.',
    trackIds: ['html-css', 'javascript'],
  },
  {
    id: 'python',
    slug: 'python-developer',
    title: 'Python Developer',
    subtitle: 'Logic, data, and thinking algorithmically.',
    description:
      'The track for CS students and anyone heading towards data. No browser, no visual page — the reward is the answer coming back correct.',
    trackIds: ['python'],
  },
];
