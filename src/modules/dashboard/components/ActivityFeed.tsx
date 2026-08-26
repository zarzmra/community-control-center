import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/feedback/EmptyState";
import type { AuditLog } from "@/types/dashboard";

type ActivityFeedProps = {
  logs: readonly AuditLog[];
};

export function ActivityFeed({ logs }: ActivityFeedProps) {
  return (
    <Card ariaLabel="Actividad reciente">
      <CardHeader
        title="Actividad Reciente"
        description="Eventos recientes del sistema"
      />
      
      {logs.length === 0 ? (
        <EmptyState
          title="Sin actividad"
          description="Todavía no hay eventos registrados"
        />
      ) : (
        <ul className="divide-y divide-gray-200">
          {logs.map((log) => {
            const date = new Date(log.created_at);
            const formattedDate = new Intl.DateTimeFormat("es-MX", {
              dateStyle: "medium",
              timeStyle: "short",
            }).format(date);
            
            return (
              <li key={log.id} className="py-4">
                <div className="flex space-x-3">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-800 text-sm font-medium">
                        {log.event_type.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-900">
                      {log.details}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formattedDate}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
