
import{StateField,StateEffect}from"@codemirror/state";
import { 
    Decoration,
    DecorationSet,
    EditorView,
    ViewPlugin,
    ViewUpdate,
    WidgetType,
    keymap 


} from "@codemirror/view";
import { fetcher } from "./fetcher";



const setSuggestionEffect=StateEffect.define<string|null>();

const suggestionState=StateField.define<string|null>({
  create(){
    return null;
  } ,
    update(value,transaction){
       for(const effect of transaction.effects){
        if(effect.is(setSuggestionEffect)){
            return effect.value;
        } 
    }
      return value;
    }

});




class SuggestionWidget extends WidgetType{
    constructor(readonly text:string|null){
        super();
    }
   toDOM(){
    const span=document.createElement("span");
    span.textContent=this.text;
    span.style.opacity="0.4";
    span.style.pointerEvents="none";
    return span;
   }
}

let debouneTimer:number|null=null;
let isWaitingForSuggestion=false;
const DEBOUNCE_DELAY=300;
let currentAbortController:AbortController|null=null;


const generatePayload = (view: EditorView, fileName: string) => {
  const code = view.state.doc.toString();
  if (!code || code.trim().length === 0) return null;

  const cursorPosition = view.state.selection.main.head;
  const currentLine = view.state.doc.lineAt(cursorPosition);
  const cursorInLine = cursorPosition - currentLine.from;

  const previousLines: string[] = [];
  const previousLinesToFetch = Math.min(5, currentLine.number - 1);
  for (let i = previousLinesToFetch; i >= 1; i--) {
    previousLines.push(view.state.doc.line(currentLine.number - i).text);
  }

  const nextLines: string[] = [];
  const totalLines = view.state.doc.lines;
  const linesToFetch = Math.min(5, totalLines - currentLine.number);
  for (let i = 1; i <= linesToFetch; i++) {
    nextLines.push(view.state.doc.line(currentLine.number + i).text);
  }

  return {
    fileName,
    code,
    currentLine: currentLine.text,
    previousLines: previousLines.join("\n"),
    textBeforeCursor: currentLine.text.slice(0, cursorInLine),
    textAfterCursor: currentLine.text.slice(cursorInLine),
    nextLines: nextLines.join("\n"),
    lineNumber: currentLine.number,
  }
}




const createDebouncePlugin=(fileName:string)=>{
    return ViewPlugin.fromClass(
        class{
              constructor(view:EditorView){
                this.triggerSuggestion(view);
              }
              update(update:ViewUpdate){
                if(update.docChanged||update.selectionSet){
                    this.triggerSuggestion(update.view);
                }}

              triggerSuggestion(view:EditorView){
                if(debouneTimer!==null){
                    clearTimeout(debouneTimer);
                }
    if(currentAbortController!==null){
        currentAbortController.abort();
    }
    



                isWaitingForSuggestion=true;
                debouneTimer=window.setTimeout(async()=>{
                   //fake async suggestion generation

                   const payload=generatePayload(view,fileName);
                   if(!payload){
                    isWaitingForSuggestion=false;
                    view.dispatch({effects:setSuggestionEffect.of(null)});
                   return;   
                }
                 currentAbortController=new AbortController();
                 const suggestion=await fetcher(
                    payload,
                    currentAbortController.signal
                 )  ;


               
                           isWaitingForSuggestion=false;
                           view.dispatch({
                            effects:setSuggestionEffect.of(suggestion)
                           });  
                    },DEBOUNCE_DELAY);
              }
              destroy(){
                if(debouneTimer!==null){
                    clearTimeout(debouneTimer);
                }

                if(currentAbortController!==null){
                    currentAbortController.abort();
                }
            }
        }
    )
}




const renderPlugin=ViewPlugin.fromClass(
    class{
        decorations:DecorationSet;

        constructor(view:EditorView){
            this.decorations=this.build(view);
        }
        update(update:ViewUpdate){
            const suggestionChanged=update.transactions.some((transtions)=>{
                return transtions.effects.some((effect)=>{
                    return effect.is(setSuggestionEffect);
                });
            });

            const shouldRebuild=update.docChanged||suggestionChanged||update.selectionSet;
            if(shouldRebuild){
                this.decorations=this.build(update.view);
            }
    }
        build(view:EditorView){
            if(isWaitingForSuggestion){
                return Decoration.none;
                        }
             
                        
            const suggestions=view.state.field(suggestionState);
            if(!suggestion){
                return Decoration.none;
            }
            const cursor=view.state.selection.main.head;
            return Decoration.set([
                Decoration.widget({
                    widget:new SuggestionWidget(suggestions),
                   side:1
                }).range(cursor), 
            ])
        }
},
{decorations:(Plugin)=>Plugin.decorations}
);


const accecptSuggestionKeymap=keymap.of([ 
    {
        key:"Tab",
        run:(view)=>{
            const suggestion=view.state.field(suggestionState);
            if(!suggestion){
                return false;

            }
            const cursor=view.state.selection.main.head;
            view.dispatch({
                changes:{
                    from:cursor,insert:suggestion},
                 selection:{
                    anchor:cursor+suggestion.length
                 }   ,
                 effects:setSuggestionEffect.of(null)
                 }
    
    
    );
    return true;
        }
    }
]);





export const suggestion=(fileName:string)=>[
 suggestionState,//state field to hold suggestion text
createDebouncePlugin(fileName),
 renderPlugin,//plugin to render suggestion in editor
 accecptSuggestionKeymap,//tab keymap to accept suggestion

];