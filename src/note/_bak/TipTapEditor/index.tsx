// import React, { MutableRefObject, useEffect } from 'react'

// import CharacterCount from '@tiptap/extension-character-count'
// import Highlight from '@tiptap/extension-highlight'
// import TaskItem from '@tiptap/extension-task-item'
// import TaskList from '@tiptap/extension-task-list'
// import Image from '@tiptap/extension-image'
// import { EditorContent, useEditor, Editor as TiptapEditor } from '@tiptap/react'
// import StarterKit from '@tiptap/starter-kit'
// import { Toolbar } from './Toolbar'
// import css from './index.module.scss'
// import { CustomImageExtension } from './CustomImageExtension'
// import { Note } from '../../../db'
// export interface Props {
//   note: Note
//   value: string,
//   onChange: (v: string) => void
//   getEditor?:(ref: TiptapEditor) =>void
// }

// export function TipTapEditor(props: Props) {
//   const editor = useEditor({
//     extensions: [
//       StarterKit.configure({
//       }),
//       Highlight,
//       TaskList,
//       TaskItem,
//       Image,
//       CustomImageExtension,
//       CharacterCount.configure({
//         // limit: 10000,
//       }),
//     ],
//     content: props.value,
//     onUpdate: (p) => {
//       props.onChange(p.editor
//         .getHTML())
//     },
//     onBeforeCreate() {
//       console.time('tiptap')
//     },
//     onCreate() {
//     },
//     onFocus() {
//     }
//   })
//   useEffect(() =>{
//     if (editor) {

//       props.getEditor?.(editor)
//       setTimeout(() => {
//         console.timeEnd('tiptap')
//       }, 100)
//     }
//   },[editor])
//   ;(window as any)['editor']= editor
//   return (
//     <div className={css.root}>
//       <EditorContent className={css.editor} editor={editor} />
//       <Toolbar editor={editor} note={props.note} />
//     </div>
//   )
// }

export {}
