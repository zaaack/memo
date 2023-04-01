// import "trix";
// import { Button, Dropdown, Input, List, Tag, TextArea } from "antd-mobile";
// import React, { useEffect, useRef, useState } from "react";
// import { useBeforeUnload, useParams } from "react-router-dom";
// import { ReactTrixRTEInput,ReactTrixRTEToolbar } from 'react-trix-rte'
// import css from "./index.module.scss";
// import { useLiveQuery } from "dexie-react-hooks";
// import { Category, db, Note } from "../db";
// import dayjs from "dayjs";
// import { toText } from "../utils";
// import {
//   LeftOutline,
//   MoreOutline,
//   RedoOutline,
//   UndoOutline,
// } from "antd-mobile-icons";
// import { useNavigate, useNavigation } from "react-router";
// import { MoreSettings } from "./MoreSettings";
// import 'github-markdown-css/github-markdown.css'
// // github-markdown-light.css
// // github-markdown-dark.css
// export interface Props {}
// const modules = {
//   toolbar: [
//     [{ header: [1, 2, false] }],
//     ["bold", "italic", "underline", "strike", "blockquote"],
//     [
//       { list: "ordered" },
//       { list: "bullet" },
//       { indent: "-1" },
//       { indent: "+1" },
//     ],
//     ["link", "image", "code"],
//     ["clean"],
//   ],
//   history: {
//     delay: 2000,
//     maxStack: 500,
//     userOnly: true,
//   },
// };
// export function NotePage(props: Props) {
//   const [title, setTitle] = useState("");
//   const [content, setContent] = useState("");
//   const params = useParams<{ id: string }>();
//   const editorRef = useRef<any>(null);
//   const [titleHeight, setTitltHeight] = useState(0);
//   const navigate = useNavigate();
//   const titleRef = useRef<HTMLTextAreaElement>(null);
//   const updateTitleHeigth = (title: string) => {
//     let e = titleRef.current;
//     if (!e) return;
//     let div = document.createElement("div");
//     div.className = e.className;
//     div.style.overflow = "visible";
//     div.innerHTML = title || "哈";
//     e.parentElement?.appendChild(div);
//     setTitltHeight(div.offsetHeight);
//     e.parentElement?.removeChild(div);
//   };
//   const [note, cat] =
//     useLiveQuery(async () => {
//       if (params.id === "new") {
//         return [
//           {
//             title: "",
//             content: "",
//             createdAt: new Date(),
//             updatedAt: new Date(),
//             categoryId: 0,
//           } as Note,
//           null,
//         ];
//       }
//       let note = (await db.notes.get(Number(params.id!))) || null;
//       let cat: Category | void;
//       if (note) {
//         setTitle(note.title);
//         setContent(note.content);
//         cat = await db.categories.get(note.categoryId);
//       }
//       return [note, cat];
//     }, [params.id]) || [];
//   function saveNote() {
//     if (
//       (title || content) &&
//       note &&
//       (note.title !== title || note.content !== content)
//     ) {
//       note.title = title;
//       note.content = content;
//       if (note?.id) {
//         db.notes.update(note.id, {
//           title: title.trim(),
//           content: content,
//           updatedAt: new Date(),
//         });
//       } else {
//         db.notes.add(note);
//       }
//     }
//   }
//   useEffect(() => {
//     updateTitleHeigth(note?.title || "哈");
//   }, [note]);
//   useEffect(() => {
//     window.addEventListener("beforeunload", saveNote);
//     window.addEventListener("popstate", saveNote);
//     return () => {
//       window.removeEventListener("beforeunload", saveNote);
//       window.removeEventListener("popstate", saveNote);
//     };
//   }, [title, content, note]);

//   if (note === null) {
//     navigate("/");
//     return null;
//   } else if (note === void 0) {
//     return null;
//   }

//   const getEditorHistory = () => {
//     return editorRef.current?.editor
//   };
//   return (
//     <div className={css.root}>
//       <div className={css.navbar}>
//         <Button
//           fill="none"
//           onClick={(e) => {
//             navigate(-1);
//             saveNote()
//           }}
//         >
//           <LeftOutline />
//         </Button>
//         <div className={css.cat}>
//           <Tag color="#aaa">{cat?.title || "未分类"}</Tag>
//         </div>

//         <Button
//           fill="none"
//           disabled={!getEditorHistory()?.undoManager.undoEntries.length}
//           onClick={(e) => {
//             getEditorHistory().undo();
//           }}
//         >
//           <RedoOutline />
//         </Button>

//         <Button
//           fill="none"
//           disabled={!getEditorHistory()?.undoManager.redoEntries.length}
//           onClick={(e) => {
//             getEditorHistory().redo();
//           }}
//         >
//           <UndoOutline />
//         </Button>
//         <MoreSettings
//           noteId={note.id!}
//           onSave={saveNote}
//         />
//       </div>

//       <div className={css.main}>
//         <textarea
//           ref={titleRef}
//           value={title}
//           onChange={(e) => {
//             let t = e.target.value.replace(/\n+/g, "");
//             setTitle(t);
//             updateTitleHeigth(t);
//           }}
//           className={css.title}
//           placeholder="标题"
//           rows={1}
//           style={{ height: titleHeight || void 0 }}
//         />
//         <div className={css.info}>
//           {dayjs(note.updatedAt).format("MM-DD hh:mm")}{" "}
//           {content.length ? `${toText(content).length}字` : ""}
//         </div>


//         <ReactTrixRTEInput
//           toolbarId="react-trix-rte-editor"
//           trixInputRef={editorRef}
//           defaultValue={content}
//           onChange={(e: any,v: string) => {
//             setContent(v)
//           }}
//           className={(css.content+ ' markdown-body')}
//           placeholder={`内容`}
//         />
//         <ReactTrixRTEToolbar
//           className={css.toolbar}
//           disableGroupingAction
//           toolbarId="react-trix-rte-editor"
//           toolbarActions={[ "heading1","bold", "italic", "strike", "link","attachFiles", "quote", "code", "bullet", "number", "outdent", "indent", ]}
//         />
//       </div>
//     </div>
//   );
// }
export {}
