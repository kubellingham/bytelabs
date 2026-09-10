import { ComingSoon } from '@/components/landing/ComingSoon';

export const metadata = {
  title: 'Courses',
  description: 'Author-led tracks — coming soon to ByteLabs.',
};

export default function CoursePage() {
  return (
    <ComingSoon
      zone="Courses"
      pitch="Curated modules that pair a Studying Kube theory lesson with a hands-on ByteLabs practical — the taught path from concept to code. The Brief zone is live today; Courses joins it next."
    />
  );
}
