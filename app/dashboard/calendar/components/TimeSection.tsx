import { ProductionCard, type OrderEnhanced } from './ProductionCard';

type TimeSectionProps = {
  label: string;
  orders: OrderEnhanced[];
  onStatusChange: (orderId: string, newStatus: string) => void;
  compact?: boolean;
};

export function TimeSection({ label, orders, onStatusChange, compact = false }: TimeSectionProps) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <h3 className={`font-bold text-gray-700 ${compact ? 'text-xs' : 'text-sm'}`}>{label}</h3>
        <span className="text-xs text-gray-500">({orders.length})</span>
      </div>
      {orders.length > 0 ? (
        <div className="space-y-0">
          {orders.map((order) => (
            <ProductionCard key={order._id} order={order} onStatusChange={onStatusChange} compact={compact} />
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-400 italic">No orders</p>
      )}
    </div>
  );
}
