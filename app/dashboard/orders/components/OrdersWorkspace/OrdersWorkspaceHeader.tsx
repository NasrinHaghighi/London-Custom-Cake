type OrdersWorkspaceHeaderProps = {
  onCreateOrder: () => void;
};

export default function OrdersWorkspaceHeader({ onCreateOrder }: OrdersWorkspaceHeaderProps) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Orders</h1>
        <p className="text-gray-600 mt-1">Track and manage all customer orders</p>
      </div>
      <button
        type="button"
        onClick={onCreateOrder}
        className="bg-linear-to-r from-gray-800 to-gray-900 text-white py-2 px-5 rounded-md hover:from-gray-900 hover:to-black transition-all font-medium shadow-sm"
      >
        Create New Order
      </button>
    </div>
  );
}
