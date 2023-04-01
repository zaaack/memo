// import React, { useState } from "react";
// import { Editor } from "@tiptap/react";
// import { Button } from "antd-mobile";
// import css from './index.module.scss'
// import remixiconUrl from "remixicon/fonts/remixicon.symbol.svg";
// import { cx } from "@emotion/css";
// import { db, Note } from "../../../db";
// export interface Props {
//   note: Note
//   editor: Editor | null
// }

// export function Toolbar({ editor, note }: Props) {
//   if (!editor) return null
//   const items = [
//     {
//       icon: "bold",
//       title: "Bold",
//       action: () => editor.chain().focus().toggleBold().run(),
//       isActive: () => editor.isActive("bold"),
//     },
//     {
//       icon: "italic",
//       title: "Italic",
//       action: () => editor.chain().focus().toggleItalic().run(),
//       isActive: () => editor.isActive("italic"),
//     },
//     {
//       icon: "strikethrough",
//       title: "Strike",
//       action: () => editor.chain().focus().toggleStrike().run(),
//       isActive: () => editor.isActive("strike"),
//     },
//     {
//       icon: "code-view",
//       title: "Code",
//       action: () => editor.chain().focus().toggleCode().run(),
//       isActive: () => editor.isActive("code"),
//     },
//     {
//       icon: "mark-pen-line",
//       title: "Highlight",
//       action: () => editor.chain().focus().toggleHighlight().run(),
//       isActive: () => editor.isActive("highlight"),
//     },
//     {
//       icon: "h-1",
//       title: "Heading 1",
//       action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
//       isActive: ()=>editor.isActive("heading", { level: 1 }),
//     },
//     {
//       icon: "h-2",
//       title: "Heading 2",
//       action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
//       isActive: () => editor.isActive("heading", { level: 2 }),
//     },
//     // {
//     //   icon: "paragraph",
//     //   title: "Paragraph",
//     //   action: () => editor.chain().focus().setParagraph().run(),
//     //   isActive: () => editor.isActive("paragraph"),
//     // },
//     {
//       icon: "list-unordered",
//       title: "Bullet List",
//       action: () => editor.chain().focus().toggleBulletList().run(),
//       isActive: () => editor.isActive("bulletList"),
//     },
//     {
//       icon: "list-ordered",
//       title: "Ordered List",
//       action: () => editor.chain().focus().toggleOrderedList().run(),
//       isActive: () => editor.isActive("orderedList"),
//     },
//     {
//       icon: "list-check-2",
//       title: "Task List",
//       action: () => editor.chain().focus().toggleTaskList().run(),
//       isActive: () => editor.isActive("taskList"),
//     },
//     {
//       icon: "image-line",
//       title: "Image",
//       action: () => {},
//     },
//     {
//       icon: "code-box-line",
//       title: "Code Block",
//       action: () => editor.chain().focus().toggleCodeBlock().run(),
//       isActive: () => editor.isActive("codeBlock"),
//     },
//     {
//       icon: "double-quotes-l",
//       title: "Blockquote",
//       action: () => editor.chain().focus().toggleBlockquote().run(),
//       isActive: () => editor.isActive("blockquote"),
//     },
//     {
//       icon: "separator",
//       title: "Horizontal Rule",
//       action: () => editor.chain().focus().setHorizontalRule().run(),
//     },
//     {
//       icon: "text-wrap",
//       title: "Hard Break",
//       action: () => editor.chain().focus().setHardBreak().run(),
//     },
//     {
//       icon: "format-clear",
//       title: "Clear Format",
//       action: () => editor.chain().focus().clearNodes().unsetAllMarks().run(),
//     },
//     // {
//     //   icon: 'arrow-go-back-line',
//     //   title: 'Undo',
//     //   action: () => editor.chain().focus().undo().run(),
//     // },
//     // {
//     //   icon: 'arrow-go-forward-line',
//     //   title: 'Redo',
//     //   action: () => editor.chain().focus().redo().run(),
//     // },
//   ];
//   const [refresh, setRefresh] = useState(false)
//   return (
//     <div className={css.root}>
//       {items.map(({ icon, title, action, isActive = null }) => {
//         return (
//           <button
//             className={cx(css.menuItem, isActive && isActive() && css.active)}
//             onClick={action}
//             title={title}
//           >
//             <svg className="remix">
//               <use xlinkHref={`${remixiconUrl}#ri-${icon}`} />
//             </svg>
//             {title === 'Image' && (
//               <input className={css.imgUploader} type="file" onChange={e => {
//                 let file = e.target.files?.[0]
//                 if (file) {
//                   let fr = new FileReader()
//                   fr.addEventListener('load',async  e => {
//                     let id = await db.images.add({
//                       url: fr.result as string,
//                       noteId: note.id
//                     } as any)
//                     editor.chain().focus().insertContent(`<custom-image id="${id}" />`).run()
//                     // .setImage({ src: fr.result as string }).run()
//                   })
//                   fr.addEventListener('error', console.error)
//                   fr.readAsDataURL(file)
//                 }
//                 e.target.value = ''
//               }} />
//             )}
//           </button>
//         );
//       })}
//     </div>
//   );
// }
export {}
