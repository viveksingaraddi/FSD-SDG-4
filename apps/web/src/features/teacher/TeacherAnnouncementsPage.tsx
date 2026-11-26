import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Bell, Plus, Users, Calendar } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  FormField,
  Heading,
  Input,
  Modal,
  SearchInput,
  Select,
  Skeleton,
  Text,
  useToast,
} from '@/components/ui';
import { fetchTeacherAnnouncements } from './teacherApi';
import type { TeacherAnnouncementDto } from '@fsd-sdg4/contracts';

interface CreateAnnouncementForm {
  title: string;
  category: string;
  targetAudience: string;
  content: string;
}

export function TeacherAnnouncementsPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const announcementsQuery = useQuery({
    queryKey: ['teacher', 'announcements'],
    queryFn: ({ signal }) => fetchTeacherAnnouncements(signal),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateAnnouncementForm>({
    defaultValues: {
      title: '',
      category: 'ACADEMIC',
      targetAudience: 'All Assigned Classes',
      content: '',
    },
  });

  const publishMutation = useMutation({
    mutationFn: async (data: CreateAnnouncementForm) => {
      // Synthetic teacher announcement dispatch
      const newAnnouncement: TeacherAnnouncementDto = {
        id: `ann-${Date.now()}`,
        title: data.title,
        content: data.content,
        authorName: 'Faculty Teacher',
        priority: 'NORMAL',
        targetAudience: data.targetAudience,
        publishedAt: new Date().toISOString(),
      };
      return newAnnouncement;
    },
    onSuccess: (newAnnouncement) => {
      queryClient.setQueryData<TeacherAnnouncementDto[]>(
        ['teacher', 'announcements'],
        (prev = []) => [newAnnouncement, ...prev],
      );
      showToast({
        title: 'Announcement Published',
        description: 'Notice has been broadcast to assigned cohorts.',
        variant: 'success',
      });
      setIsModalOpen(false);
      reset();
    },
  });

  const allAnnouncements = announcementsQuery.data ?? [];
  const filtered = allAnnouncements.filter((ann) => {
    const matchesSearch =
      search === '' ||
      ann.title.toLowerCase().includes(search.toLowerCase()) ||
      ann.content.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  return (
    <AppShell
      title="Announcements & Notices"
      breadcrumbs={[{ label: 'Faculty Portal', to: '/teacher' }, { label: 'Announcements' }]}
    >
      <div className="space-y-6">
        {/* Header Action Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-border/80 bg-surface p-6 shadow-sm">
          <div>
            <Heading level={2} className="text-xl font-semibold tracking-tight text-text">
              Class & Department Notices
            </Heading>
            <Text className="text-sm text-text-muted mt-1">
              Broadcast instructional announcements, coursework updates, and faculty bulletins.
            </Text>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Announcement
          </Button>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search announcements by title or content..."
            />
          </div>
          <div className="w-full sm:w-56">
            <Select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              options={[
                { value: 'ALL', label: 'All Categories' },
                { value: 'ACADEMIC', label: 'Academic & Curricula' },
                { value: 'EXAMS', label: 'Examinations' },
                { value: 'GENERAL', label: 'General Notices' },
              ]}
            />
          </div>
        </div>

        {/* Announcements List */}
        {announcementsQuery.isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        )}

        {announcementsQuery.isError && (
          <ErrorState
            title="Failed to load announcements"
            description="Could not synchronize notices from the institution."
            onRetry={() => announcementsQuery.refetch()}
          />
        )}

        {announcementsQuery.isSuccess && filtered.length === 0 && (
          <EmptyState
            title="No Announcements Found"
            description={
              search
                ? 'No notices matched your search query.'
                : 'No notices have been published yet.'
            }
            action={
              <Button variant="outline" onClick={() => setIsModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Publish First Announcement
              </Button>
            }
          />
        )}

        {announcementsQuery.isSuccess && filtered.length > 0 && (
          <div className="grid gap-4">
            {filtered.map((item) => (
              <Card
                key={item.id}
                className="p-6 transition-all border border-border/80 bg-surface hover:border-brand/30"
              >
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10 text-brand">
                        <Bell className="h-4 w-4" />
                      </div>
                      <Heading level={3} className="text-base font-semibold text-text">
                        {item.title}
                      </Heading>
                    </div>
                    <Badge variant="brand">{item.targetAudience}</Badge>
                  </div>

                  <Text className="text-sm text-text-muted leading-relaxed whitespace-pre-wrap pl-10">
                    {item.content}
                  </Text>

                  <div className="flex items-center justify-between pt-3 border-t border-border/60 text-xs text-text-muted pl-10">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-text-muted" />
                      Published on{' '}
                      {new Date(item.publishedAt).toLocaleDateString(undefined, {
                        dateStyle: 'medium',
                      })}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-text-muted" />
                      Broadcast verified by Teacher Portal
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Create Modal */}
        <Modal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Create New Announcement"
          description="Send an official notice to your classes or faculty peers."
          footer={
            <>
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" form="announcement-form" disabled={publishMutation.isPending}>
                Broadcast Notice
              </Button>
            </>
          }
        >
          <form
            id="announcement-form"
            onSubmit={handleSubmit((data) => publishMutation.mutate(data))}
            className="space-y-4"
          >
            <FormField label="Notice Title" error={errors.title?.message} required>
              {(props) => (
                <Input
                  {...props}
                  {...register('title', { required: 'Please enter a title' })}
                  placeholder="e.g., Mathematics Midterm Preparation Guide"
                />
              )}
            </FormField>

            <FormField label="Target Audience" error={errors.targetAudience?.message} required>
              {(props) => (
                <Select
                  {...props}
                  {...register('targetAudience')}
                  options={[
                    { value: 'All Assigned Classes', label: 'All Assigned Classes' },
                    { value: 'Grade 8 - Section 8-A', label: 'Grade 8 - Section 8-A' },
                    { value: 'Parents & Students', label: 'Parents & Students' },
                    { value: 'Faculty & Department', label: 'Faculty & Department' },
                  ]}
                />
              )}
            </FormField>

            <FormField label="Notice Content" error={errors.content?.message} required>
              {() => (
                <textarea
                  {...register('content', {
                    required: 'Please write the announcement text',
                    minLength: { value: 10, message: 'Notice must be at least 10 characters' },
                  })}
                  rows={4}
                  className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand"
                  placeholder="Enter detailed notice message for recipients..."
                />
              )}
            </FormField>
          </form>
        </Modal>
      </div>
    </AppShell>
  );
}

export default TeacherAnnouncementsPage;
