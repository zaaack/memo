import { Button, Dialog, List, Modal } from "antd-mobile";
import { MoreOutline } from "antd-mobile-icons";
import dayjs from "dayjs";
import React, { useEffect, useState } from "react";
import { db } from "../../db";
import { Note } from "../../db/Note";
import {  moveNote } from "../../lib/utils";
import { syncHelper } from "../../sync/sync-helper";
import { toText } from "../../utils";
import css from "./index.module.scss";
import { useHistory } from "react-router";
export interface Props {
  note: Note;
}

export function MoreSettings(props: Props) {
  const [visible, setVisible] = useState(false);
  const history = useHistory()

  useEffect(() => {
    let hide = () => setVisible(false);
    document.body.addEventListener("click", hide);
    return () => {
      document.body.removeEventListener("click", hide);
    };
  }, []);
  return (
    <Button
      fill="none"
      onClick={(e) => {
        setVisible(!visible);
        e.stopPropagation();
      }}
      className={css.root}
    >
      <MoreOutline />
      {visible && (
        <List className={css.menu}>
          <List.Item
            onClick={(e) => {
              moveNote({
                notes: [props.note],
                onMove() {
                  setVisible(false);
                },
              });
            }}
          >
            移动
          </List.Item>
          <List.Item
            onClick={(e) => {
              if (props.note.topAt) {
                db.notes.update(props.note.id!, { topAt: 0 });
              } else {
                db.notes.update(props.note.id!, { topAt: Date.now() });
              }
            }}
          >
            {props.note.topAt ? `取消置顶` : `置顶`}
          </List.Item>
          <List.Item
            onClick={(e) => {
              Dialog.alert({
                content: (
                  <div>
                    <div>
                      创建时间：
                      {dayjs(props.note.createdAt).format(
                        "YYYY/MM/DD HH:mm:ss"
                      )}
                    </div>
                    <div>
                      修改时间：
                      {dayjs(props.note.updatedAt).format(
                        "YYYY/MM/DD HH:mm:ss"
                      )}
                    </div>
                    <div>字数: {toText(props.note.content).length}</div>
                  </div>
                ),
              });
            }}
          >
            信息
          </List.Item>
          <List.Item
            onClick={(e) => {
              if (props.note.id) {
                db.notes.update(props.note.id, { trashedAt: Date.now() });
              }
              history.go(-1)
            }}
          >
            删除
          </List.Item>
        </List>
      )}
    </Button>
  );
}
