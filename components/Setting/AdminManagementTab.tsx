import AdminList, { Admin } from '@/components/Setting/AdminList';

interface AdminManagementTabProps {
  name: string;
  email: string;
  phone: string;
  validationErrors: string[];
  isSubmitting: boolean;
  isError: boolean;
  errorMessage?: string;
  admins?: Admin[];
  isLoadingAdmins: boolean;
  adminError: unknown;
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onDeactivate: (id: string) => void;
  onInvite: (admin: Admin) => void;
  onDelete: (id: string) => void;
}

export default function AdminManagementTab({
  name,
  email,
  phone,
  validationErrors,
  isSubmitting,
  isError,
  errorMessage,
  admins,
  isLoadingAdmins,
  adminError,
  onNameChange,
  onEmailChange,
  onPhoneChange,
  onSubmit,
  onDeactivate,
  onInvite,
  onDelete,
}: AdminManagementTabProps) {
  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Add New Admin</h3>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Name *</label>
              <input
                type="text"
                placeholder="Enter full name"
                value={name}
                onChange={(e) => onNameChange(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-admin-primary focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
              <input
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => onEmailChange(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-admin-primary focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Phone *</label>
              <input
                type="tel"
                placeholder="+44 123 456 7890"
                value={phone}
                onChange={(e) => onPhoneChange(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-admin-primary focus:outline-none"
                required
              />
            </div>
          </div>

          {validationErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-1">
              {validationErrors.map((error, index) => (
                <p key={index} className="text-red-600 text-sm">{error}</p>
              ))}
            </div>
          )}
          {isError && validationErrors.length === 0 && errorMessage && (
            <p className="text-red-500 text-sm">Error: {errorMessage}</p>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-black text-white py-2.5 px-6 rounded-md hover:bg-gray-900 disabled:opacity-50 transition-all font-medium text-sm shadow-sm"
              disabled={isSubmitting}
            >
              {isSubmitting ? '⏳ Sending...' : '➕ Send Invitation'}
            </button>
          </div>
        </form>
      </div>

      <AdminList
        admins={admins}
        isLoading={isLoadingAdmins}
        error={adminError}
        onDeactivate={onDeactivate}
        onInvite={onInvite}
        onDelete={onDelete}
      />
    </>
  );
}
