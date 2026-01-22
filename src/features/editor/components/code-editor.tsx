import { useEffect, useMemo, useRef } from "react";
import { EditorView, keymap } from "@codemirror/view";
import {oneDark} from "@codemirror/theme-one-dark";
import {indentWithTab} from "@codemirror/commands";
import { customTheme } from "../extentions/theme";
import { getLanguageExtention } from "../extentions/language-extenstion";
import { minimap } from "../extentions/minimap";

import {indentationMarkers} from "@replit/codemirror-indentation-markers";
import { customSetup } from "../extentions/custom-setup";
import { suggestion } from "../extentions/suggestion";
import { quickEdit } from "../extentions/quick-edit";
import { selectionTooltip } from "../extentions/selection-tooltip";


interface Props{
    fileName:string;
    intialValue?:string;
    onChange:(value:string)=>void;

}

export const CodeEditor = ({fileName,intialValue="",onChange}:Props) => {
   const editorRef = useRef<HTMLDivElement>(null);
   const viewRef=useRef<EditorView|null> (null);
   const LanguageExtension=useMemo(()=>getLanguageExtention(fileName),[fileName]);

   useEffect(()=>{
    if(!editorRef.current) return;
     const view=new EditorView({
       doc:intialValue,
       parent:editorRef.current,
       extensions:[
        customSetup,
        LanguageExtension,
        oneDark,
        customTheme,
        suggestion(fileName),
        quickEdit(fileName),
        selectionTooltip(),
        keymap.of([indentWithTab]),
        minimap(),
        indentationMarkers(),
        EditorView.updateListener.of((update)=>{
            if(update.docChanged){
                onChange(update.state.doc.toString());
            }
            })
      
       ]
     });
     viewRef.current=view;
     return ()=>{
        view.destroy();
     }
// eslint-disable-next-line react-hooks/exhaustive-deps --intialValue only used at start
   },[LanguageExtension])
   return(
    <div ref={editorRef} className="size-full p-4 bg-background"/>
   )
}