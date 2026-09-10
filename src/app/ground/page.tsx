import { ComingSoon } from '@/components/landing/ComingSoon';

export const metadata = {
  title: 'Grounds',
  description: 'Open challenges — coming soon to ByteLabs.',
};

export default function GroundPage() {
  return (
    <ComingSoon
      zone="Grounds"
      pitch="A rotating bank of practice tasks — daily, weekly, and themed — with leaderboards and public solves. Right now, Brief is the way in; Grounds opens after that."
    />
  );
}
