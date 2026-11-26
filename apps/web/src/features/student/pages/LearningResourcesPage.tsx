import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  BookmarkIcon,
  DownloadIcon,
  ExternalLinkIcon,
  FileTextIcon,
  SearchIcon,
  VideoIcon,
} from '../../../components/icons/Icons.js';
import { EmptyState, LoadingState, StudentLayout } from '../../../components/student/index.js';
import { Badge, Button, Card, Modal, Tabs, useToast } from '../../../components/ui/index.js';
import {
  useMarkResourceAccessed,
  useStudentResources,
  useToggleSaveResource,
} from '../hooks/useStudentPortal.js';
import type { LearningResource, ResourceFormat } from '../types/student.types.js';

type ResourceTab = 'ALL' | 'RECENT' | 'SAVED';

export function LearningResourcesPage() {
  const [searchParams] = useSearchParams();
  const queryParam = searchParams.get('search') ?? '';
  const subjectParam = searchParams.get('subject') ?? '';
  const { showToast } = useToast();

  const { data: resources, isLoading } = useStudentResources();
  const toggleSaveMutation = useToggleSaveResource();
  const markAccessedMutation = useMarkResourceAccessed();

  const [tab, setTab] = useState<ResourceTab>('ALL');
  const [search, setSearch] = useState(queryParam);
  const [subjectFilter, setSubjectFilter] = useState(subjectParam || 'ALL');
  const [formatFilter, setFormatFilter] = useState<'ALL' | ResourceFormat>('ALL');
  const [activeResource, setActiveResource] = useState<LearningResource | null>(null);

  useEffect(() => {
    setSearch(queryParam);
  }, [queryParam]);

  useEffect(() => {
    if (subjectParam) {
      setSubjectFilter(subjectParam);
    }
  }, [subjectParam]);

  const subjects = useMemo(() => {
    const unique = new Set((resources ?? []).map((r) => r.subjectName));
    return ['ALL', ...Array.from(unique)];
  }, [resources]);

  const savedCount = (resources ?? []).filter((r) => r.saved).length;
  const recentCount = (resources ?? []).filter((r) => Boolean(r.recentlyAccessedAt)).length;

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (resources ?? []).filter((res) => {
      if (tab === 'SAVED' && !res.saved) return false;
      if (tab === 'RECENT' && !res.recentlyAccessedAt) return false;
      if (subjectFilter !== 'ALL' && res.subjectName !== subjectFilter) return false;
      if (formatFilter !== 'ALL' && res.format !== formatFilter) return false;
      if (
        term &&
        !res.title.toLowerCase().includes(term) &&
        !res.subjectName.toLowerCase().includes(term) &&
        !res.topic.toLowerCase().includes(term)
      ) {
        return false;
      }
      return true;
    });
  }, [resources, tab, subjectFilter, formatFilter, search]);

  const handleOpenResource = (res: LearningResource) => {
    setActiveResource(res);
    markAccessedMutation.mutate(res.id);
  };

  const handleToggleSave = (res: LearningResource) => {
    toggleSaveMutation.mutate(res.id, {
      onSuccess: (updated) => {
        if (activeResource?.id === updated.id) {
          setActiveResource(updated);
        }
        showToast({
          type: 'success',
          title: updated.saved ? 'Saved to library' : 'Removed from saved',
          description: updated.title,
        });
      },
    });
  };

  const renderFormatIcon = (format: ResourceFormat) => {
    if (format === 'Video')
      return <VideoIcon className="h-4 w-4 text-[var(--color-brand-primary)]" />;
    if (format === 'External Link') {
      return <ExternalLinkIcon className="h-4 w-4 text-[var(--color-brand-primary)]" />;
    }
    return <FileTextIcon className="h-4 w-4 text-[var(--color-brand-primary)]" />;
  };

  return (
    <StudentLayout
      breadcrumbs={[{ label: 'Student Portal', to: '/student' }, { label: 'Learning Resources' }]}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
            Learning Resources
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Explore subject notes, study PDFs, video lessons, and saved reference materials.
          </p>
        </div>

        <Tabs
          ariaLabel="Resource views"
          activeTab={tab}
          onChange={(id) => setTab(id as ResourceTab)}
          items={[
            { id: 'ALL', label: 'All Resources', badge: (resources ?? []).length },
            { id: 'RECENT', label: 'Recently Accessed', badge: recentCount },
            { id: 'SAVED', label: 'Saved', badge: savedCount },
          ]}
        />

        <Card padding="sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative flex-1 lg:max-w-sm">
              <label htmlFor="resource-search" className="sr-only">
                Search learning resources
              </label>
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
              <input
                id="resource-search"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search title, subject, or topic..."
                className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-canvas)] pl-9 pr-3 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-brand-primary)] focus:bg-white focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <select
                aria-label="Filter by subject"
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="h-10 rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-white px-3 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-brand-primary)] focus:outline-none"
              >
                {subjects.map((s) => (
                  <option key={s} value={s}>
                    {s === 'ALL' ? 'All Subjects' : s}
                  </option>
                ))}
              </select>

              <select
                aria-label="Filter by format"
                value={formatFilter}
                onChange={(e) => setFormatFilter(e.target.value as 'ALL' | ResourceFormat)}
                className="h-10 rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-white px-3 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-brand-primary)] focus:outline-none"
              >
                <option value="ALL">All Formats</option>
                <option value="PDF">PDF</option>
                <option value="Notes">Notes</option>
                <option value="Video">Video</option>
                <option value="External Link">External Link</option>
              </select>
            </div>
          </div>
        </Card>

        {isLoading ? (
          <LoadingState label="Loading learning resources..." cards={6} />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No learning resources found"
            description="Try clearing a filter or switching back to All Resources."
            action={
              <Button
                variant="outline"
                onClick={() => {
                  setTab('ALL');
                  setSubjectFilter('ALL');
                  setFormatFilter('ALL');
                  setSearch('');
                }}
              >
                Reset filters
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((res) => (
              <Card key={res.id} interactive className="flex h-full flex-col justify-between gap-4">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="brand">{res.subjectName}</Badge>
                      <Badge variant="neutral">{res.format}</Badge>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleSave(res)}
                      aria-label={res.saved ? `Unsave ${res.title}` : `Save ${res.title}`}
                      aria-pressed={res.saved}
                      className={`inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] transition-colors cursor-pointer ${res.saved
                          ? 'bg-[var(--color-brand-primary-subtle)] text-[var(--color-brand-primary)]'
                          : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-raised)]'
                        }`}
                    >
                      <BookmarkIcon filled={res.saved} className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-3 flex items-start gap-2.5">
                    <div className="mt-0.5 shrink-0">{renderFormatIcon(res.format)}</div>
                    <div>
                      <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                        {res.title}
                      </h2>
                      <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                        {res.description}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 border-t border-[var(--color-border-subtle)] pt-3">
                  <div className="flex items-center justify-between text-[11px] text-[var(--color-text-muted)]">
                    <span>Topic: {res.topic}</span>
                    <span>{res.durationOrSize}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-[var(--color-text-muted)]">
                      {res.recentlyAccessedAt ? `Opened ${res.recentlyAccessedAt}` : res.authorName}
                    </span>
                    <Button size="sm" variant="outline" onClick={() => handleOpenResource(res)}>
                      View resource
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Resource Viewer Modal */}
      <Modal
        open={Boolean(activeResource)}
        onClose={() => setActiveResource(null)}
        title={activeResource?.title ?? ''}
        description={
          activeResource
            ? `${activeResource.subjectName} · ${activeResource.format} · ${activeResource.durationOrSize}`
            : undefined
        }
        maxWidthClass="max-w-2xl"
      >
        {activeResource && (
          <div className="space-y-4">
            <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-canvas)] p-4 text-sm leading-relaxed text-[var(--color-text-secondary)]">
              {activeResource.previewContent}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--color-text-muted)]">
              <span>Shared by {activeResource.authorName}</span>
              <span>Updated {activeResource.updatedAt}</span>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[var(--color-border-subtle)] pt-4">
              <Button variant="outline" onClick={() => handleToggleSave(activeResource)}>
                <BookmarkIcon filled={activeResource.saved} className="h-4 w-4" />
                <span>{activeResource.saved ? 'Saved' : 'Save resource'}</span>
              </Button>
              {activeResource.externalUrl ? (
                <a
                  href={activeResource.externalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-[40px] items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-brand-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-brand-primary-hover)]"
                >
                  <ExternalLinkIcon className="h-4 w-4" />
                  <span>Open External Link</span>
                </a>
              ) : (
                <Button
                  onClick={() =>
                    showToast({
                      type: 'success',
                      title: 'Study file ready',
                      description: `Downloaded "${activeResource.title}" to your study folder.`,
                    })
                  }
                >
                  <DownloadIcon className="h-4 w-4" />
                  <span>Download Copy</span>
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </StudentLayout>
  );
}
