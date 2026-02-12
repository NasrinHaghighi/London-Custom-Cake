import Link from "next/link";

interface QuickAction {
  label: string;
  href: string;
}

interface QuickActionsProps {
  actions: QuickAction[];
}

export default function QuickActions({ actions }: QuickActionsProps) {
  return (
    <section className="mb-10">
      <h2 className="text-lg font-semibold text-gray-800 mb-3">Quick Actions</h2>
      <div className="flex flex-wrap gap-4">
        {actions.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="inline-block px-5 py-2.5 bg-gradient-to-r from-gray-800 to-gray-900 text-white font-medium rounded-md shadow-admin hover:from-gray-900 hover:to-black focus:outline-none focus:ring-2 focus:ring-gray-800 transition"
          >
            {action.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
