'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useCustomers } from '@/hooks/useCustomers';
import type { CustomerListItem } from '@/lib/api/customers';
import { List, type RowComponentProps } from 'react-window';

const createdDateFormatter = new Intl.DateTimeFormat('en-GB', {
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

function formatCreatedDate(value?: string): string {
  if (!value) {
    return '-';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '-';
  }

  return createdDateFormatter.format(parsed);
}

export default function CustomersPage() {
  const { data: customers = [], isLoading, error } = useCustomers();
  const [search, setSearch] = useState('');

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = !query
      ? customers
      : customers.filter((customer) => {
        const fullName = `${customer.firstName} ${customer.lastName}`.toLowerCase();
        return fullName.includes(query);
      });

    return [...filtered].sort((a, b) => {
      const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
      const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [customers, search]);

  type RowProps = { items: CustomerListItem[] };
  const Row = ({ index, style, items }: RowComponentProps<RowProps>) => {
    const customer = items[index];
    if (!customer) return null;
    const createdLabel = formatCreatedDate(customer.createdAt);

    return (
      <div
        style={style}
        className="grid grid-cols-7 gap-4 px-6 items-center border-b border-gray-200 text-sm text-gray-700"
      >
        <div className="font-medium text-gray-900">
          {customer.firstName} {customer.lastName}
        </div>
        <div>{customer.phone}</div>
        <div className="truncate">{customer.email}</div>
        <div className="text-center">{customer.addressCount}</div>
        <div>{createdLabel}</div>
        <div className="truncate ">{customer.notes || '-'}</div>
        <div>
          <Link
            href={`/dashboard/customers/${customer._id}`}
            className="text-gray-900 font-medium hover:underline"
          >
            View
          </Link>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Customers</h1>
        <p className="text-gray-600 mt-2">All registered customers</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Search by name</label>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Type customer name..."
          className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-gray-800 focus:outline-none"
        />
      </div>

      {isLoading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center text-blue-700">
          Loading customers...
        </div>
      )}

      {!isLoading && error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center text-red-700">
          {error instanceof Error ? error.message : 'Failed to load customers'}
        </div>
      )}

      {!isLoading && !error && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="grid grid-cols-7 gap-4 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">
            <div>Name</div>
            <div>Phone</div>
            <div>Email</div>
            <div className="text-center">Addresses</div>
            <div>Created</div>
            <div>Notes</div>
            <div>Actions</div>
          </div>

          {filteredCustomers.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-gray-500">No customers found</div>
          ) : (
            <List
              defaultHeight={520}
              rowCount={filteredCustomers.length}
              rowHeight={56}
              rowComponent={Row}
              rowProps={{ items: filteredCustomers }}
              style={{ height: 520, width: '100%' }}
            >
            </List>
          )}
        </div>
      )}
    </div>
  );
}
