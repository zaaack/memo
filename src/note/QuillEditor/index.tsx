import React, { useEffect, useLayoutEffect, useRef } from "react";
import Quill, { QuillOptionsStatic } from "quill";
export interface Props {
  defaultValue: string;
  onChange: (v: string) => void;
  modules?: QuillOptionsStatic["modules"];
  getEditor?: (e: Quill) => void;
  className?:string
  placeholder?: string
}
function QuillEditor(props: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!rootRef.current) return;
    let editor = new Quill(rootRef.current, {
      modules: props.modules,
      theme: 'snow',
      placeholder: props.placeholder,
    });
    let el = rootRef.current.querySelector<HTMLDivElement>('.ql-editor')
    let t: any
    let handleChange = () => {
      t && clearTimeout(t)
      t=setTimeout(() => {
        props.onChange(editor.root.innerHTML)
      }, 100)
    }
    // HACK: text-change not fired some times
    editor.clipboard.dangerouslyPasteHTML(props.defaultValue)
    props.getEditor?.(editor)
    el?.addEventListener('keyup', handleChange)
    editor.on('text-change', handleChange)
    return () => {
    el?.removeEventListener('keyup', handleChange)
    editor.off('text-change', handleChange)
    }
  }, [rootRef.current]);
  return <div ref={rootRef} className={props.className}></div>;
}

export default QuillEditor;
