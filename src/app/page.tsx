"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

const Projects = () => {
  const projects = useQuery(api.projects.get);
  const createProject = useMutation(api.projects.create);

  return (
    <div>
      <button
        onClick={() =>
          createProject({
            name: "New Project", // replace later with real user id
          })
        }
      >
        Create Project
      </button>

      {projects?.map((project) => (
        <div key={project._id}>
          <p>{project._id}</p>
          <p>name: {project.name}</p>
          <p>ownerId: {project.ownerId}</p>
        </div>
      ))}
    </div>
  );
};

export default Projects;
