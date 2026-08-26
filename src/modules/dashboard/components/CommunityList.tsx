import Link from "next/link";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/feedback/EmptyState";
import type { RecentCommunity } from "@/types/dashboard";

type CommunityListProps = {
  communities: readonly RecentCommunity[];
};

export function CommunityList({ communities }: CommunityListProps) {
  return (
    <Card ariaLabel="Comunidades recientes">
      <CardHeader
        title="Comunidades Recientes"
        description="Las últimas comunidades registradas en el sistema"
      />
      
      {communities.length === 0 ? (
        <EmptyState
          title="Sin comunidades"
          description="Todavía no hay comunidades registradas"
          actionLabel="Crear comunidad"
          actionHref="/communities"
        />
      ) : (
        <ul className="divide-y divide-gray-200">
          {communities.map((community) => (
            <li key={community.id} className="py-4">
              <Link 
                href={`/communities/${community.id}`} 
                className="block hover:bg-gray-50 rounded-md p-2 -m-2 transition-colors"
              >
                <div className="flex justify-between">
                  <h3 className="text-sm font-medium text-gray-900">
                    {community.name}
                  </h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {community.status === "active" ? "Activa" : "Inactiva"}
                  </span>
                </div>
                
                {community.description && (
                  <p className="mt-1 text-sm text-gray-500">
                    {community.description}
                  </p>
                )}
                
                <div className="mt-2 flex text-sm text-gray-500">
                  <span className="mr-4">
                    {community.members} miembros
                  </span>
                  <span className="mr-4">
                    {community.bots} bots
                  </span>
                  <span>
                    {community.channels} canales
                  </span>
                </div>
              </Link>
            </li>
          ))}
          
          <li className="pt-4">
            <Link 
              href="/communities" 
              className="text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              Ver todas las comunidades →
            </Link>
          </li>
        </ul>
      )}
    </Card>
  );
}
