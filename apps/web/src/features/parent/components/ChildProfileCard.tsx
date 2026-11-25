import { BookOpen, GraduationCap, ShieldCheck, User } from 'lucide-react';
import { Avatar, Badge, Card, Heading, Text } from '@/components/ui';
import type { DemoChildProfile } from '@/data/parentDemoData';

export interface ChildProfileCardProps {
  profile: DemoChildProfile;
}

const RELATIONSHIP_LABELS: Record<DemoChildProfile['relationshipType'], string> = {
  MOTHER: 'Mother',
  FATHER: 'Father',
  LEGAL_GUARDIAN: 'Legal Guardian',
  OTHER: 'Guardian',
};

export function ChildProfileCard({ profile }: ChildProfileCardProps) {
  const fullName = `${profile.firstName} ${profile.lastName}`;

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <Avatar name={fullName} size="lg" />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Heading level={3} size="h3">
                {fullName}
              </Heading>
              <Badge variant="brand">{RELATIONSHIP_LABELS[profile.relationshipType]}</Badge>
              {profile.isPrimaryContact && (
                <Badge variant="success">
                  <ShieldCheck className="mr-1 h-3 w-3" aria-hidden="true" />
                  Primary Contact
                </Badge>
              )}
            </div>
            <Text variant="small" className="mt-1">
              Student ID: <span className="font-mono">{profile.studentIdNumber}</span>
            </Text>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-[var(--color-text-secondary)]">
          <div className="flex items-center gap-1.5">
            <GraduationCap className="h-4 w-4 text-[var(--color-brand-primary)]" aria-hidden="true" />
            <span>
              <strong>{profile.className}</strong> · Section {profile.sectionName}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <BookOpen className="h-4 w-4 text-[var(--color-text-muted)]" aria-hidden="true" />
            <span>Academic Year {profile.academicYear}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <User className="h-4 w-4 text-[var(--color-text-muted)]" aria-hidden="true" />
            <span>Homeroom: {profile.homeroomTeacher}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
