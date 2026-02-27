type OrdersWorkspacePaginationProps = {
  ordersCount: number;
  total: number;
  isFetching: boolean;
  page: number;
  totalPages: number;
  onPrevious: () => void;
  onNext: () => void;
};

export default function OrdersWorkspacePagination({
  ordersCount,
  total,
  isFetching,
  page,
  totalPages,
  onPrevious,
  onNext,
}: OrdersWorkspacePaginationProps) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-gray-600">
        Showing {ordersCount} of {total} orders {isFetching ? '(refreshing...)' : ''}
      </p>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onPrevious}
          disabled={page <= 1}
          className="border border-gray-300 text-gray-700 py-1.5 px-3 rounded-md disabled:opacity-50"
        >
          Previous
        </button>
        <span className="text-sm text-gray-700 px-2 py-1.5">Page {page} / {totalPages}</span>
        <button
          type="button"
          onClick={onNext}
          disabled={page >= totalPages}
          className="border border-gray-300 text-gray-700 py-1.5 px-3 rounded-md disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
