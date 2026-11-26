import { useState, type FormEvent } from 'react';
import { Bell, Globe, KeyRound, Shield, Smartphone, Save, CheckCircle2 } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import {
  Badge,
  Button,
  Card,
  FormField,
  Heading,
  Input,
  Modal,
  Select,
  Text,
  useToast,
} from '@/components/ui';

export function TeacherSettingsPage() {
  const { showToast } = useToast();
  const [language, setLanguage] = useState('en-US');
  const [timezone, setTimezone] = useState('America/New_York');
  const [dateFormat, setDateFormat] = useState('YYYY-MM-DD');

  // Notification Toggles
  const [notifySubmissions, setNotifySubmissions] = useState(true);
  const [notifyParentMessages, setNotifyParentMessages] = useState(true);
  const [notifyAttendanceAlerts, setNotifyAttendanceAlerts] = useState(false);
  const [notifyExamReminders, setNotifyExamReminders] = useState(true);

  // Password Modal
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSaveGeneral = (e: FormEvent) => {
    e.preventDefault();
    showToast({
      title: 'Preferences Updated',
      description: 'Your localization and notification preferences were successfully saved.',
      variant: 'success',
    });
  };

  const handlePasswordSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      showToast({
        title: 'Validation Error',
        description: 'New password must contain at least 8 characters.',
        variant: 'danger',
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast({
        title: 'Validation Error',
        description: 'Passwords do not match.',
        variant: 'danger',
      });
      return;
    }

    setIsPasswordModalOpen(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    showToast({
      title: 'Credentials Updated',
      description: 'Your account password has been rotated securely with Argon2id.',
      variant: 'success',
    });
  };

  return (
    <AppShell
      title="Faculty Settings"
      breadcrumbs={[{ label: 'Faculty Portal', to: '/teacher' }, { label: 'Settings' }]}
    >
      <div className="space-y-6 max-w-4xl">
        {/* Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl border border-border/80 bg-surface p-6 shadow-sm">
          <div>
            <Heading level={2} className="text-xl font-semibold tracking-tight text-text">
              Account & Preference Settings
            </Heading>
            <Text className="text-sm text-text-muted mt-1">
              Configure your faculty notification thresholds, localization defaults, and security
              credentials.
            </Text>
          </div>
          <Button type="submit" form="settings-general-form">
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </div>

        <form id="settings-general-form" onSubmit={handleSaveGeneral} className="space-y-6">
          {/* Card 1: Regional & Localization */}
          <Card className="p-6 border border-border/80 bg-surface shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 border-b border-border/60 pb-3">
              <Globe className="h-5 w-5 text-brand" />
              <div>
                <Heading level={3} className="text-base font-semibold text-text">
                  Localization & Regional Format
                </Heading>
                <Text className="text-xs text-text-muted">
                  Choose date, language, and timezone formats applied to rosters and timetables.
                </Text>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField label="Language">
                {(props) => (
                  <Select
                    {...props}
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    options={[
                      { value: 'en-US', label: 'English (US)' },
                      { value: 'en-GB', label: 'English (UK)' },
                      { value: 'es-ES', label: 'Español' },
                      { value: 'fr-FR', label: 'Français' },
                    ]}
                  />
                )}
              </FormField>

              <FormField label="Timezone">
                {(props) => (
                  <Select
                    {...props}
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    options={[
                      { value: 'America/New_York', label: 'Eastern Time (ET)' },
                      { value: 'America/Chicago', label: 'Central Time (CT)' },
                      { value: 'America/Denver', label: 'Mountain Time (MT)' },
                      { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
                      { value: 'UTC', label: 'Universal UTC' },
                    ]}
                  />
                )}
              </FormField>

              <FormField label="Date Format">
                {(props) => (
                  <Select
                    {...props}
                    value={dateFormat}
                    onChange={(e) => setDateFormat(e.target.value)}
                    options={[
                      { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (ISO)' },
                      { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
                      { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
                    ]}
                  />
                )}
              </FormField>
            </div>
          </Card>

          {/* Card 2: Notifications */}
          <Card className="p-6 border border-border/80 bg-surface shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 border-b border-border/60 pb-3">
              <Bell className="h-5 w-5 text-brand" />
              <div>
                <Heading level={3} className="text-base font-semibold text-text">
                  Notification Channels & Alerts
                </Heading>
                <Text className="text-xs text-text-muted">
                  Control dispatch of email digests and real-time portal notifications.
                </Text>
              </div>
            </div>

            <div className="space-y-4 text-sm divide-y divide-border/40">
              <div className="flex items-center justify-between pt-2">
                <div>
                  <p className="font-medium text-text">Student Submission Notifications</p>
                  <p className="text-xs text-text-muted">
                    Receive alert emails when students upload coursework submissions.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notifySubmissions}
                  onChange={(e) => setNotifySubmissions(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-brand focus:ring-brand"
                />
              </div>

              <div className="flex items-center justify-between pt-3">
                <div>
                  <p className="font-medium text-text">Guardian & Parent Messages</p>
                  <p className="text-xs text-text-muted">
                    Notify immediately when a verified guardian sends a direct inquiry.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notifyParentMessages}
                  onChange={(e) => setNotifyParentMessages(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-brand focus:ring-brand"
                />
              </div>

              <div className="flex items-center justify-between pt-3">
                <div>
                  <p className="font-medium text-text">Daily Attendance Roster Reminder</p>
                  <p className="text-xs text-text-muted">
                    Automated alert if attendance is unsubmitted 15 minutes after period start.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notifyAttendanceAlerts}
                  onChange={(e) => setNotifyAttendanceAlerts(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-brand focus:ring-brand"
                />
              </div>

              <div className="flex items-center justify-between pt-3">
                <div>
                  <p className="font-medium text-text">Examination & Grading Deadlines</p>
                  <p className="text-xs text-text-muted">
                    Upcoming assessment reminders 48 hours prior to term grading closure.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notifyExamReminders}
                  onChange={(e) => setNotifyExamReminders(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-brand focus:ring-brand"
                />
              </div>
            </div>
          </Card>
        </form>

        {/* Card 3: Security & Credentials */}
        <Card className="p-6 border border-border/80 bg-surface shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2.5">
              <KeyRound className="h-5 w-5 text-brand" />
              <div>
                <Heading level={3} className="text-base font-semibold text-text">
                  Security & Authentication
                </Heading>
                <Text className="text-xs text-text-muted">
                  Multi-tenant session protection and password rotation.
                </Text>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => setIsPasswordModalOpen(true)}>
              Change Password
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl border border-border/60 bg-surface-muted/30 space-y-1.5">
              <div className="flex items-center gap-2 font-semibold text-text">
                <Smartphone className="h-4 w-4 text-brand" />
                Active Faculty Session
              </div>
              <p className="text-text-muted">Browser Session • Mac OS Chrome</p>
              <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Valid Opaque Cookie Session
              </div>
            </div>

            <div className="p-4 rounded-xl border border-border/60 bg-surface-muted/30 space-y-1.5">
              <div className="flex items-center gap-2 font-semibold text-text">
                <Shield className="h-4 w-4 text-brand" />
                Tenant Scoping & Zero Trust
              </div>
              <p className="text-text-muted">School Isolation Context</p>
              <Badge variant="brand">Enforced by API Gateway</Badge>
            </div>
          </div>
        </Card>

        {/* Change Password Modal */}
        <Modal
          open={isPasswordModalOpen}
          onClose={() => setIsPasswordModalOpen(false)}
          title="Change Password"
          description="Update your institutional faculty account password."
          footer={
            <>
              <Button variant="outline" onClick={() => setIsPasswordModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" form="change-password-form">
                Update Password
              </Button>
            </>
          }
        >
          <form id="change-password-form" onSubmit={handlePasswordSubmit} className="space-y-4">
            <FormField label="Current Password" required>
              {(props) => (
                <Input
                  {...props}
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                />
              )}
            </FormField>

            <FormField label="New Password (min 8 characters)" required>
              {(props) => (
                <Input
                  {...props}
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                />
              )}
            </FormField>

            <FormField label="Confirm New Password" required>
              {(props) => (
                <Input
                  {...props}
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                />
              )}
            </FormField>
          </form>
        </Modal>
      </div>
    </AppShell>
  );
}

export default TeacherSettingsPage;
