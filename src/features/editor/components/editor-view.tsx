import { act, use, useRef } from "react";
import { Id } from "../../../../convex/_generated/dataModel"
import { useEditor } from "../hooks/use-editor";
import { FileBreadcrumbs } from "./file-breadcrums";
import { TopNavigation } from "./top-navigation"
import { useFile, useUpdateFile } from "@/features/projects/hooks/use-files";
import Image from "next/image";
import { CodeEditor } from "./code-editor";
const DEBOUNCE_MS=1500;
export const EditorView = ({ 
  projectId
}: {
  projectId: Id<"projects">
}) => {
    const {activeTabId}=useEditor(projectId);
      const activeFile=useFile(activeTabId);
      const updateFile=useUpdateFile();
      const timeoutRef=useRef<NodeJS.Timeout|null>(null);
      const isActiveFileBinary=activeFile && activeFile.storageId;
      const isActiveFileText=activeFile&&!activeFile.storageId;
      return(
        <div className="h-full flex flex-col">
            <div className="flex items-center">
                <TopNavigation projectId={projectId}/>

            </div>
            {activeTabId &&<FileBreadcrumbs projectId={projectId} />}
          <div className="flex-1 min-h-0 bg-background">
            {!activeFile &&(
                <div className="size-full flex items-center justify-center">
                    <Image
                     src="/vercel.svg"
                    alt="tibebcraft"
                      width={80}
                      height={80}
                      className="opacity-20 bg-white/55 rounded-md"
                    />

                </div>

            )}
         {isActiveFileText &&(
            <CodeEditor 
            key={activeFile._id}
            fileName={activeFile.name} 
            intialValue={activeFile.content}
            onChange={(content:string)=>{
              if(timeoutRef.current){
                clearTimeout(timeoutRef.current);
              }
              timeoutRef.current=setTimeout(()=>{
                updateFile({id:activeFile._id,content});
              },DEBOUNCE_MS);
            }

          }            
           />
         )}{
          isActiveFileBinary &&(
   <p> todo implement binary preview</p>
      )   }
          </div>
        </div>
    )
}