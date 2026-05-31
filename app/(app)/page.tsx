import { DataTableCard } from "@/components/dashboard/data-table-card";
import { SampleChartCard } from "@/components/dashboard/sample-chart-card";
import { ProjectDataCard } from "@/components/dashboard/project-data-card";
import { ComponentsCard } from "@/components/dashboard/components-card";
import { RecentActivitiesCard } from "@/components/dashboard/recent-activities-card";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <DataTableCard />
        </div>
        <SampleChartCard />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <ProjectDataCard />
        <ComponentsCard />
        <RecentActivitiesCard />
      </div>
    </div>
  );
}
