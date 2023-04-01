import { Button, Tag } from "antd-mobile";
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useRef,
  useState,
} from "react";
import { useBeforeUnload, useParams } from "react-router-dom";

import "react-quill/dist/quill.snow.css";
import css from "./index.quill.module.scss";
import { useLiveQuery } from "dexie-react-hooks";
import { Note } from "../db/Note";
import dayjs from "dayjs";
import { toText } from "../utils";
import { CheckOutline, RedoOutline, UndoOutline } from "antd-mobile-icons";
import { useLocation, useNavigate, useNavigation } from "react-router";
import { MoreSettings } from "./MoreSettings";
import Quill from "quill";
import QuillEditor from "./QuillEditor";

import "./keepAttr";
import { syncHelper } from "../sync/sync-helper";
import { BackButton } from "../lib/BackButton";
// import { NavBar } from "../lib/NavBar";
import { Cat } from "../lib/Cat";
import { NavBar } from "../lib/NavBar";

{
  let Image = Quill.import("formats/image");
  Image.sanitize = (url: string) => url;
}
export interface Props {}
const modules = {
  toolbar: [
    [{ header: [1, 2, false] }],
    ["bold",
    "italic",
    "underline",
    "strike",
    "blockquote",
    "link",
    "image",
    "code"],
    [{ list: "ordered" },
    { list: "bullet" },
    { list: "check" },
    { indent: "-1" },
    { indent: "+1" },
    "clean"],
  ],
  history: {
    delay: 2000,
    maxStack: 500,
    userOnly: true,
  },
};

export function NotePage(props: Props) {
  console.time("quill");
  console.log(new Date().toLocaleTimeString());

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const contentForLength = useDeferredValue(content);
  const [isEdited, setIsEdited] = useState(false);
  const params = useParams<{ id: string }>();
  const loc = useLocation();
  const editorRef = useRef<Quill>();
  const [titleHeight, setTitltHeight] = useState(0);
  const navigate = useNavigate();
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
  const [note, cat, images] = useLiveQuery(async () => {
    let { note, cat, title, images, content } = await Note.getEditNote(
      params.id || "new",
      loc.state?.catId
    );
    setTitle(title);
    setContent(content);
    return [note, cat, images];
  }, [params.id]) || [void 0, void 0, []];
  let onTextChange = useCallback(
    (t: string) => {
      setContent(t);
      setIsEdited(true);
    },
    [setContent, setIsEdited]
  );
  async function saveNote() {
    if ((title || content) && note && isEdited) {
      await Note.saveEditNote(note, { title, content, images });
      syncHelper.sync();
    }
    setIsEdited(false);
  }
  useEffect(() => {
    return () => {
      saveNote();
    };
  }, []);
  useEffect(() => {
    updateTitleHeigth(note?.title || "哈");
  }, [note]);
  useBeforeUnload(saveNote);

  if (note === null) {
    navigate("/");
    return null;
  } else if (note === void 0) {
    return null;
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
        left={<Cat active>{cat?.title || "未分类"}</Cat>}
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
            <MoreSettings note={note} />
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
            updateTitleHeigth(t);
          }}
          className={css.title}
          placeholder="标题"
          rows={1}
          style={{ height: titleHeight || void 0 }}
        />
        <div className={css.info}>
          {dayjs(note.updatedAt).format("MM-DD hh:mm")}{" "}
          {contentForLength.length
            ? `${toText(contentForLength).length}字`
            : ""}
        </div>
        <QuillEditor
          getEditor={(e) => {
            console.timeEnd("quill");
            editorRef.current = e;
          }}
          modules={modules}
          defaultValue={content}
          onChange={onTextChange}
          className={css.content}
          placeholder={`内容`}
        />
      </div>
    </div>
  );
}
