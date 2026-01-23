import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function StandingsSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {[1, 2].map((conference) => (
        <Card key={conference}>
          <CardHeader className="pb-3">
            <div className="h-5 bg-muted rounded w-48 animate-pulse"></div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border/50 bg-muted/30">
                  <tr>
                    <th className="px-4 py-3 text-left w-12">
                      <div className="h-3 bg-muted rounded w-4 animate-pulse"></div>
                    </th>
                    <th className="px-4 py-3 text-left">
                      <div className="h-3 bg-muted rounded w-16 animate-pulse"></div>
                    </th>
                    <th className="px-4 py-3 text-center">
                      <div className="h-3 bg-muted rounded w-6 mx-auto animate-pulse"></div>
                    </th>
                    <th className="px-4 py-3 text-center">
                      <div className="h-3 bg-muted rounded w-6 mx-auto animate-pulse"></div>
                    </th>
                    <th className="px-4 py-3 text-center">
                      <div className="h-3 bg-muted rounded w-8 mx-auto animate-pulse"></div>
                    </th>
                    <th className="px-4 py-3 text-center">
                      <div className="h-3 bg-muted rounded w-12 mx-auto animate-pulse"></div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 15 }).map((_, i) => (
                    <tr key={i} className="border-b border-border/30">
                      <td className="px-4 py-3">
                        <div className="h-4 bg-muted rounded w-4 animate-pulse"></div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-muted rounded animate-pulse"></div>
                          <div className="h-4 bg-muted rounded w-32 animate-pulse"></div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-4 bg-muted rounded w-6 mx-auto animate-pulse"></div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-4 bg-muted rounded w-6 mx-auto animate-pulse"></div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-4 bg-muted rounded w-10 mx-auto animate-pulse"></div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-4 bg-muted rounded w-8 mx-auto animate-pulse"></div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
