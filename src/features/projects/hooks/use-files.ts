import { useMutation, useQuery } from "convex/react"
import { Id } from "../../../../convex/_generated/dataModel"
import { api } from "../../../../convex/_generated/api"

export const useCreateFile=()=>{
return useMutation(api.files.createFile);
}

export const useRenameFile=()=>{
return useMutation(api.files.renameFile);
}


export const useDeleteFile=()=>{
return useMutation(api.files.deletFile);
}
export const useCreateFolder=()=>{
return useMutation(api.files.createFolder);
}



export const useFolderContents = ({
  projectId,
  parentId,
  enabled = true,
}: {
  projectId: Id<"projects">;
  parentId?: Id<"files">;
  enabled?: boolean;
}) => {
  return useQuery(
    api.files.getFolderContents,
    enabled ? { projectId, parentId } : "skip",
  );
};