'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import AdminManagementTab from '@/components/Setting/AdminManagementTab';
import SettingsTabs from '@/components/Setting/SettingsTabs';
import TimeComplexityTab from '@/components/Setting/TimeComplexityTab';
import {
  fetchComplexityThresholdSettings,
  updateComplexityThresholdSettings,
} from '@/lib/api/settings';
import {
  DEFAULT_COMPLEXITY_THRESHOLDS,
  getComplexityRanges,
  normalizeComplexityThresholds,
} from '@/lib/complexity';

const THRESHOLD_DRAFT_TOAST_ID = 'complexity-threshold-draft-change';

const deactivateAdmin = async (id: string) => {
  const res = await fetch(`/api/admin/${id}/deactivate`, { method: 'PATCH' });
  if (!res.ok) throw new Error('Failed to deactivate admin');
  return res.json();
};

const fetchAdmins = async () => {
  const res = await fetch('/api/admin/list', { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch admins');
  return res.json();
};

const deleteAdmin = async (id: string) => {
  const res = await fetch(`/api/admin/${id}/delete`, { method: 'DELETE', credentials: 'include' });
  if (!res.ok) throw new Error('Failed to delete admin');
  return res.json();
};

export default function Settings() {
  const [activeTab, setActiveTab] = useState<'timeComplexity' | 'admin'>('timeComplexity');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const [lowMaxMinutesInput, setLowMaxMinutesInput] = useState<string | null>(null);
  const [mediumMaxMinutesInput, setMediumMaxMinutesInput] = useState<string | null>(null);
  const hadThresholdDraftChangesRef = useRef(false);

  const {
    data: thresholdSettings,
    isLoading: isThresholdSettingsLoading,
    refetch: refetchThresholdSettings,
  } = useQuery({
    queryKey: ['complexity-threshold-settings'],
    queryFn: fetchComplexityThresholdSettings,
    staleTime: 5 * 60 * 1000,
  });

  const effectiveLowMaxMinutesInput = lowMaxMinutesInput ?? String(thresholdSettings?.lowMaxMinutes || DEFAULT_COMPLEXITY_THRESHOLDS.lowMaxMinutes);
  const effectiveMediumMaxMinutesInput = mediumMaxMinutesInput ?? String(thresholdSettings?.mediumMaxMinutes || DEFAULT_COMPLEXITY_THRESHOLDS.mediumMaxMinutes);

  const normalizedThresholds = useMemo(() => {
    const lowCandidate = Number(effectiveLowMaxMinutesInput);
    const mediumCandidate = Number(effectiveMediumMaxMinutesInput);

    return normalizeComplexityThresholds({
      lowMaxMinutes: Number.isFinite(lowCandidate) && lowCandidate > 0
        ? Math.floor(lowCandidate)
        : thresholdSettings?.lowMaxMinutes || DEFAULT_COMPLEXITY_THRESHOLDS.lowMaxMinutes,
      mediumMaxMinutes: Number.isFinite(mediumCandidate) && mediumCandidate > 0
        ? Math.floor(mediumCandidate)
        : thresholdSettings?.mediumMaxMinutes || DEFAULT_COMPLEXITY_THRESHOLDS.mediumMaxMinutes,
    });
  }, [effectiveLowMaxMinutesInput, effectiveMediumMaxMinutesInput, thresholdSettings?.lowMaxMinutes, thresholdSettings?.mediumMaxMinutes]);

  const thresholdRanges = useMemo(() => getComplexityRanges(normalizedThresholds), [normalizedThresholds]);

  const hasThresholdDraftChanges = useMemo(() => {
    if (!thresholdSettings) {
      return false;
    }

    const lowValue = Number(effectiveLowMaxMinutesInput);
    const mediumValue = Number(effectiveMediumMaxMinutesInput);

    if (!Number.isFinite(lowValue) || !Number.isFinite(mediumValue)) {
      return true;
    }

    return (
      Math.floor(lowValue) !== thresholdSettings.lowMaxMinutes
      || Math.floor(mediumValue) !== thresholdSettings.mediumMaxMinutes
    );
  }, [effectiveLowMaxMinutesInput, effectiveMediumMaxMinutesInput, thresholdSettings]);

  useEffect(() => {
    if (hasThresholdDraftChanges && !hadThresholdDraftChangesRef.current) {
      toast('Threshold values changed. Click Save Thresholds to apply.', {
        id: THRESHOLD_DRAFT_TOAST_ID,
        icon: 'ℹ️',
      });
    }

    if (!hasThresholdDraftChanges && hadThresholdDraftChangesRef.current) {
      toast.dismiss(THRESHOLD_DRAFT_TOAST_ID);
    }

    hadThresholdDraftChangesRef.current = hasThresholdDraftChanges;
  }, [hasThresholdDraftChanges]);

  const thresholdMutation = useMutation({
    mutationFn: updateComplexityThresholdSettings,
    onSuccess: async (saved) => {
      setLowMaxMinutesInput(String(saved.lowMaxMinutes));
      setMediumMaxMinutesInput(String(saved.mediumMaxMinutes));
      await refetchThresholdSettings();
      toast.dismiss(THRESHOLD_DRAFT_TOAST_ID);
      toast.success('Complexity thresholds updated');
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Failed to update complexity thresholds';
      toast.error(message);
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: { name: string; email: string; phone: string }) => {
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.errors && Array.isArray(errorData.errors)) {
          setValidationErrors(errorData.errors);
          throw new Error('Validation failed');
        }
        throw new Error(errorData.message || 'Failed to send invitation');
      }
      return response.json();
    },
    onSuccess: (data) => {
      setValidationErrors([]);
      if (data.message === 'Invitation resent') {
        toast.success('Invitation resent to pending admin.');
      } else if (data.message === 'Invitation sent') {
        toast.success('Invitation sent to new admin.');
        setName('');
        setEmail('');
        setPhone('');
      } else {
        toast.success(data.message);
      }
    },
    onError: (error) => {
      if (error.message !== 'Validation failed') {
        setValidationErrors([]);
        toast.error(error.message || 'An error occurred');
      }
    },
  });

  const { data: adminData, isLoading: isLoadingAdmins, error: adminError, refetch } = useQuery({
    queryKey: ['admins'],
    queryFn: fetchAdmins,
  });

  const deactivateMutation = useMutation({
    mutationFn: deactivateAdmin,
    onSuccess: () => {
      toast.success('Admin deactivated');
      refetch();
    },
    onError: (error: unknown) => {
      let message = 'Failed to deactivate admin';
      if (error instanceof Error) {
        message = error.message;
      } else if (typeof error === 'string') {
        message = error;
      }
      toast.error(message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAdmin,
    onSuccess: () => {
      toast.success('Admin deleted');
      refetch();
    },
    onError: (error: unknown) => {
      let message = 'Failed to delete admin';
      if (error instanceof Error) {
        message = error.message;
      } else if (typeof error === 'string') {
        message = error;
      }
      toast.error(message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ name, email, phone });
  };

  const handleThresholdSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const lowMaxMinutes = Number(effectiveLowMaxMinutesInput);
    const mediumMaxMinutes = Number(effectiveMediumMaxMinutesInput);

    if (!Number.isFinite(lowMaxMinutes) || lowMaxMinutes < 1) {
      toast.error('Low threshold must be at least 1 minute.');
      return;
    }

    if (!Number.isFinite(mediumMaxMinutes) || mediumMaxMinutes < 2) {
      toast.error('Medium threshold must be at least 2 minutes.');
      return;
    }

    if (mediumMaxMinutes <= lowMaxMinutes) {
      toast.error('Medium threshold must be greater than low threshold.');
      return;
    }

    thresholdMutation.mutate({
      lowMaxMinutes: Math.floor(lowMaxMinutes),
      mediumMaxMinutes: Math.floor(mediumMaxMinutes),
    });
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Manage admin users and system settings</p>
      </div>

      <SettingsTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'timeComplexity' && (
        <TimeComplexityTab
          lowMaxMinutesInput={effectiveLowMaxMinutesInput}
          mediumMaxMinutesInput={effectiveMediumMaxMinutesInput}
          isLoading={isThresholdSettingsLoading}
          isSaving={thresholdMutation.isPending}
          thresholdRanges={thresholdRanges}
          onLowMaxMinutesChange={setLowMaxMinutesInput}
          onMediumMaxMinutesChange={setMediumMaxMinutesInput}
          onSubmit={handleThresholdSubmit}
        />
      )}

      {activeTab === 'admin' && (
        <AdminManagementTab
          name={name}
          email={email}
          phone={phone}
          validationErrors={validationErrors}
          isSubmitting={mutation.isPending}
          isError={mutation.isError}
          errorMessage={mutation.error instanceof Error ? mutation.error.message : undefined}
          admins={adminData?.admins}
          isLoadingAdmins={isLoadingAdmins}
          adminError={adminError}
          onNameChange={setName}
          onEmailChange={setEmail}
          onPhoneChange={setPhone}
          onSubmit={handleSubmit}
          onDeactivate={(id) => deactivateMutation.mutate(id)}
          onInvite={(admin) => mutation.mutate({ name: admin.name, email: admin.email, phone: admin.phone })}
          onDelete={(id) => deleteMutation.mutate(id)}
        />
      )}
    </div>
  );
}
