import Link from "next/link";
import { FaGithub } from "react-icons/fa";
import { formatDistanceToNow } from "date-fns";
import { AlertCircleIcon, ArrowRightIcon, GlobeIcon, Loader2Icon } from "lucide-react";

import { Kbd } from "@/components/ui/kbd";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";

import { Doc } from "../../../../convex/_generated/dataModel";

import { useProjectsPartial } from "../hooks/use-projects";

const formatTimestamp = (timestamp: number) => {
  return formatDistanceToNow(new Date(timestamp), {
    addSuffix: true,
  });
};

const getProjectIcon = (project: Doc<"projects">) => {
  if (project.importStatus === "completed") {
    return <FaGithub className="size-3.5 text-muted-foreground" />;
  }
  if (project.importStatus === "failed") {
    return <AlertCircleIcon className="size-3.5 text-muted-foreground" />;
  }
  if (project.importStatus === "importing") {
    return <Loader2Icon className="size-3.5 text-muted-foreground animate-spin" />;
  }
  return <GlobeIcon className="size-3.5 text-muted-foreground" />;
};

interface ProjectsListProps {
  onViewAll: () => void;
}

const ContinueCard = ({ data }: { data: Doc<"projects"> }) => {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs text-muted-foreground">Last updated</span>
      <Button
        variant="outline"
        asChild
        className="h-auto items-start justify-start p-4 bg-background border rounded-none flex flex-col gap-2 hover:bg-muted/50 transition-colors"
      >
        <Link href={`/projects/${data._id}`} className="group w-full">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2.5">
              {getProjectIcon(data)}
              <span className="font-medium truncate max-w-[220px]">{data.name}</span>
            </div>
            <ArrowRightIcon className="size-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
          </div>
          <span className="text-xs text-muted-foreground mt-1">
            {formatTimestamp(data.updatedAt)}
          </span>
        </Link>
      </Button>
    </div>
  );
};

const ProjectItem = ({ data }: { data: Doc<"projects"> }) => {
  return (
    <Link
      href={`/projects/${data._id}`}
      className="text-sm font-medium text-foreground/70 hover:text-foreground py-1.5 px-1 flex items-center justify-between w-full group transition-colors"
    >
      <div className="flex items-center gap-2.5">
        {getProjectIcon(data)}
        <span className="truncate max-w-[240px]">{data.name}</span>
      </div>
      <span className="text-xs text-muted-foreground group-hover:text-foreground/70 transition-colors">
        {formatTimestamp(data.updatedAt)}
      </span>
    </Link>
  );
};

export const ProjectsList = ({ onViewAll }: ProjectsListProps) => {
  const projects = useProjectsPartial(10);   // still fetching 10 for safety

  if (projects === undefined) {
    return (
      <div className="py-6 flex justify-center">
        <Spinner className="size-5 text-primary animate-spin" />
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        No projects yet — create one to get started!
      </div>
    );
  }

  // No sorting — display exactly as received from Convex
  const [mostRecent, ...rest] = projects;

  return (
    <div className="flex flex-col gap-5">
      {mostRecent && <ContinueCard data={mostRecent} />}

      {rest.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Recent projects
            </span>
            <button
              onClick={onViewAll}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <span>View all</span>
              <Kbd className="bg-muted border text-[10px] px-1.5 py-0.5">⌘K</Kbd>
            </button>
          </div>

          <ul className="flex flex-col divide-y divide-border/50">
            {rest.slice(0, 5).map((project) => (
              <ProjectItem key={project._id} data={project} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};