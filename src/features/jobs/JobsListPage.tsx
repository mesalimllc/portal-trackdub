import { useMemo, useState } from "react";
import { useNavigate } from "@/lib/router-compat";
import { useJobsList, type Job } from "@/api/hooks/useJobs";
import { Pagination, ErrorState, LoadingSpinner } from "@/components/portal";
import type { Column } from "@/components/portal";
import { JobStatusBadge } from "./JobStatusBadge";

const STATUS_OPTIONS: Array<{ label: string; value: string }> = [
  { label: "All", value: "All" },
  { label: "Queued", value: "Queued" },
  { label: "Running", value: "Running" },
  { label: "Completed", value: "Completed" },
  { label: "Failed", value: "Failed" },
  { label: "Cancelled", value: "Cancelled" },
];

const PAGE_SIZE = 20;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null) return "—";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
}

export function JobsListPage() {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const { data, isLoading, isError, refetch } = useJobsList({
    status: statusFilter !== "All" ? statusFilter : undefined,
  });

  const sortedJobs = useMemo(() => {
    const items = [...(data?.items ?? [])];
    items.sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      return sortOrder === "desc" ? bTime - aTime : aTime - bTime;
    });
    return items;
  }, [data?.items, sortOrder]);

  const totalCount = sortedJobs.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const offset = (currentPage - 1) * PAGE_SIZE;
  const jobs = sortedJobs.slice(offset, offset + PAGE_SIZE);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleSortToggle = () => {
    setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"));
    setCurrentPage(1);
  };

  const handleRowClick = (job: Job) => {
    navigate(`/jobs/${job.id}`);
  };

  const columns: Column<Job>[] = [
    {
      key: "projectName",
      header: "Project",
      render: (job) => <span className="font-medium text-gray-900">{job.projectName}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (job) => <JobStatusBadge status={job.status} />,
    },
    {
      key: "sourceLanguage",
      header: "Source",
      render: (job) => job.sourceLanguage,
    },
    {
      key: "targetLanguage",
      header: "Target",
      render: (job) => job.targetLanguage,
    },
    {
      key: "createdAt",
      header: (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleSortToggle();
          }}
          className="inline-flex items-center gap-1 uppercase tracking-wider hover:text-gray-700"
          aria-label={`Sort by date ${sortOrder === "desc" ? "ascending" : "descending"}`}
        >
          Created
          <span aria-hidden="true">{sortOrder === "desc" ? "↓" : "↑"}</span>
        </button>
      ),
      render: (job) => formatDate(job.createdAt),
    },
    {
      key: "duration",
      header: "Duration",
      render: (job) => formatDuration(job.duration),
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-lg font-semibold tracking-tight" style={{ color: "#1c1c1a" }}>
          Jobs
        </h1>
        <LoadingSpinner message="Loading jobs…" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <h1 className="text-lg font-semibold tracking-tight" style={{ color: "#1c1c1a" }}>
          Jobs
        </h1>
        <ErrorState message="Failed to load jobs. Please try again." onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold tracking-tight" style={{ color: "#1c1c1a" }}>
          Jobs
        </h1>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <label
          htmlFor="status-filter"
          className="text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: "#8a8a82" }}
        >
          Status
        </label>
        <select
          id="status-filter"
          value={statusFilter}
          onChange={handleStatusChange}
          className="px-3 py-1.5 text-xs font-mono focus:outline-none"
          style={{
            border: "1px solid #c0b8ac",
            background: "#fff",
            color: "#1c1c1a",
          }}
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Table with clickable rows */}
      <div
        className="overflow-x-auto"
        style={{ border: "1px solid #e0dbd2", borderTop: "2px solid #c0b8ac" }}
      >
        <table
          className="min-w-full bg-white"
          style={{ borderCollapse: "collapse" }}
          aria-label="Jobs list"
        >
          <thead>
            <tr style={{ borderBottom: "1px solid #e0dbd2", background: "#faf8f4" }}>
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={`px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest ${col.className ?? ""}`}
                  style={{ color: "#8a8a82" }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {jobs.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-10 text-center font-mono text-xs"
                  style={{ color: "#8a8a82" }}
                >
                  No jobs found.
                </td>
              </tr>
            ) : (
              jobs.map((job) => (
                <tr
                  key={job.id}
                  onClick={() => handleRowClick(job)}
                  className="cursor-pointer transition-colors"
                  style={{ borderBottom: "1px solid #f0ede8" }}
                  role="link"
                  tabIndex={0}
                  aria-label={`View job: ${job.projectName}`}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "#f9f7f3";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "";
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleRowClick(job);
                    }
                  }}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`whitespace-nowrap px-4 py-3 text-sm ${col.className ?? ""}`}
                      style={{ color: "#3a3a32" }}
                    >
                      {col.render(job, 0)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={totalCount}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
