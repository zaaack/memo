import { Button, Tag } from "antd-mobile";
import {
  useCallback,
  useContext,
  useDeferredValue,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useHistory, useLocation, useParams, Prompt } from "react-router-dom";

import "react-quill/dist/quill.snow.css";
import css from "./index.quill.module.scss";
// import { Note } from "../db/Note";
import dayjs from "dayjs";
import { toText } from "../utils";
import { CheckOutline, RedoOutline, UndoOutline } from "antd-mobile-icons";
import { MoreSettings } from "./MoreSettings";
import Quill from "quill";
import QuillEditor from "./QuillEditor";

import "./keepAttr";
import { BackButton } from "../components/BackButton";
// import { NavBar } from "../lib/NavBar";
import { CategoryTag } from "../components/CategoryTag";
import { NavBar } from "../components/NavBar";
import { useEvent } from "../utils/utils";
import { remoteDb } from "../sync/remote-db";
import { useQuery } from "../utils/hooks";
import LoadingPage from "../components/LoadingPage";
// https://github.com/Milkdown/milkdown
// https://github.com/mdx-editor/editor?tab=readme-ov-file
{
  let Image = Quill.import("formats/image");
  Image.sanitize = (url: string) => url;
}
export interface Props {}
const modules = {
  toolbar: [
    [{ header: [1, 2, false] }],
    [
      "bold",
      "italic",
      "underline",
      "strike",
      "blockquote",
      "link",
      "image",
      "code",
    ],
    [
      { list: "ordered" },
      { list: "bullet" },
      { list: "check" },
      { indent: "-1" },
      { indent: "+1" },
      "clean",
    ],
  ],
  history: {
    delay: 2000,
    maxStack: 500,
    userOnly: true,
  },
};

export function NotePage(props: Props) {
  const history = useHistory();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const contentForLength = useDeferredValue(content);
  const [isEdited, setIsEdited] = useState(false);
  const params = useParams<{ filename: string; folder: string }>();
  const editorRef = useRef<Quill>();
  const [titleHeight, setTitltHeight] = useState(0);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const updateTitleHeigth = (title: string) => {
    let e = titleRef.current;
    if (!e) return;
    let div = document.createElement("div");
    div.className = e.className;
    div.style.overflow = "visible";
    div.innerHTML = title || "哈";
    e.parentElement?.appendChild(div);
    setTitltHeight(div.offsetHeight);
    e.parentElement?.removeChild(div);
  };
  const note = useQuery(async () => {
    console.time("quill");
    console.time("getNote");
    let [id, title] = params.filename.split("_", 2);
    if (!title) {
      title = id;
      id = "";
    }
    let note = await remoteDb.getOrCreateNote({
      folder: params.folder || "默认",
      id: id || "",
      title: title || "新笔记",
      lastmod: dayjs(),
      ctime: dayjs().unix(),
    });
    console.log("note", note);
    console.timeEnd("getNote");
    setTitle(title);
    setContent(note?.content ?? content);
    editorRef.current?.setText(content, "silent");
    return note;
  }, []) ;
  let onTextChange = useEvent((t: string) => {
    setContent(t);
    setIsEdited(true);
  });
  const saveNote = useEvent(async function saveNote() {
    if ((title || content) && note.data && isEdited) {
      console.log("saveNote");
      // await Note.saveEditNote(note, { title, content, images });
      await remoteDb.saveNote({
        ...note.data,
        title,
        content,
      }, note.data);
    }
    setIsEdited(false);
    history.goBack();
  });
  useLayoutEffect(() => {
    updateTitleHeigth(title || "哈");
  }, [title]);

  if (note.isLoading) {
    return <LoadingPage />;
  }

  const getEditorHistory = () => {
    let editor = editorRef.current as any;
    return editor?.history;
  };
  return (
    <div className={css.root}>
      <NavBar
        onBack={saveNote}
        className={css.navbar}
        left={<CategoryTag active>{note.data?.folder || "默认"}</CategoryTag>}
        right={
          <>
            <Button
              fill="none"
              disabled={!getEditorHistory()?.stack.undo.length}
              onClick={(e) => {
                getEditorHistory().undo();
              }}
            >
              <RedoOutline />
            </Button>

            <Button
              fill="none"
              disabled={!getEditorHistory()?.stack.redo.length}
              onClick={(e) => {
                getEditorHistory().redo();
              }}
            >
              <UndoOutline />
            </Button>
            <Button
              fill="none"
              disabled={!isEdited}
              onClick={(e) => {
                saveNote();
              }}
            >
              <CheckOutline />
            </Button>
            {note.data && <MoreSettings note={note.data} />}
          </>
        }
      ></NavBar>
      <div className={css.main}>
        <textarea
          ref={titleRef}
          value={title}
          onChange={(e) => {
            let t = e.target.value.replace(/\n+/g, "");
            setTitle(t);
            setIsEdited(true);
          }}
          className={css.title}
          placeholder="标题"
          rows={1}
          style={{ height: titleHeight || void 0 }}
        />
        <div className={css.info}>
          {note.data?.lastmod.format("MM-DD hh:mm")}{" "}
          {contentForLength.length
            ? `${toText(contentForLength).length}字`
            : ""}
        </div>
        {note.data && (
          <QuillEditor
            getEditor={(e) => {
              console.timeEnd("quill");
              editorRef.current = e;
            }}
            modules={modules}
            defaultValue={note.data.content}
            onChange={onTextChange}
            className={css.content}
            placeholder={`内容`}
          />
        )}
      </div>
      <Prompt
      when={isEdited}
      message={`编辑尚未保存，确定要退出吗？`}
      />
    </div>
  );
}
