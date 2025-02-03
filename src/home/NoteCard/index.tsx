import { ToTopOutlined } from "@ant-design/icons";
import { Card, Checkbox } from "antd-mobile";
import dayjs from "dayjs";
import React from "react";
import { Link } from "react-router-dom";
import css from "./index.module.scss";
import type { NoteInfo } from "../../sync/remote-db";

export interface Props {
  note: NoteInfo;
  bulkEditMode: boolean;
  checked?: boolean;
  search: string;
  bindLongPress: any;
  onCheck:(e: boolean) => void
}

export function NoteCard(props: Props) {
  let card = (
    <Card>
      {props.note.cover && <img src={props.note.cover} className={css.img} />}
      {props.note.title && <h2>{props.note.title}</h2>}
      <div className={css.content}>
        {(() => {
          // let text = toText(props.note.content);
          // if (props.search) {
          //   let index = text.indexOf(props.search);
          //   let prefix = text.slice(Math.max(index - 10, 0), index);
          //   let suffix = text.slice(
          //     index + props.search.length,
          //     index +
          //       props.search.length +
          //       (80 - prefix.length - props.search.length)
          //   );
          //   return [prefix, <b>{props.search}</b>, suffix];
          // }
          // return text.slice(0, 80);
          return ''
        })()}
      </div>
      <div className={css.info}>
        <div className={css.time}>
          {(() => {
            let d = props.note.lastmod;
            let now = dayjs();
            if (d.year() !== now.year()) {
              return d.format("YYYY-MM-DD");
            } else if (d.month() === now.month() && d.date() === now.date()) {
              return d.format("HH:mm");
            } else {
              return d.format("MM-DD");
            }
          })()}
        </div>
        {!!props.note.toped && <div className={css.isTop}>
          <ToTopOutlined />
        </div>}
        <div className={css.holder}></div>
        {props.bulkEditMode && <Checkbox checked={props.checked} />}
      </div>
    </Card>
  );
  if (props.bulkEditMode) return (
    <div className={css.note} onClick={e => {
      props.onCheck(!props.checked)
    }}>{card}</div>
  );
  return (
    <Link
      {...props.bindLongPress(props.note)}
      to={`/note/${props.note.folder}/${props.note.id}_${props.note.title}`}
      className={css.note}
    >
      {card}
    </Link>
  );
}
