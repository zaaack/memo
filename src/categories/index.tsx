import {
  AutoCenter,
  Dialog,
  FloatingBubble,
  Input,
  List,
  ListRef,
  SwipeAction,
  SwipeActionRef,
  Checkbox,
} from "antd-mobile";
import { AddOutline, AntOutline, CheckOutline } from "antd-mobile-icons";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { BackButton } from "../components/BackButton";
import css from "./index.module.scss";
import { cx } from "@emotion/css";
import { kv } from "../utils/kv";
import { Category } from "../db/Category";
import { NavBar } from "../components/NavBar";
import { useEvent } from "../utils/utils";
import { Link, useHistory } from "react-router-dom";
import { remoteDb } from "../sync/remote-db";
import {
  useQuery,
  type QueryData,
  type QuerySuccessData,
} from "../utils/hooks";
export interface Props {}

let putCategory = async (cats: QueryData<string[]>, cat?: string,) => {
  let value = "";
  Dialog.confirm({
    content: (
      <Input
        placeholder="请输入文件夹名"
        defaultValue={cat}
        onChange={(e) => {
          value = e;
        }}
      />
    ),
    onConfirm: async () => {
      await remoteDb.addFolder(value);
      cats.invalid();
    },
    onClose: () => {},
  });
};
const CatItem = /*SortableElement<{ cat: Category; count: number }>*/ ({
  cat,
  count,
  index,
  cats,
}: {
  cat: string;
  count: number;
  index: number;
  cats: QuerySuccessData<string[]>;
}) => {
  let ref = useRef<SwipeActionRef>(null);
  let child = (
    <List.Item
      // clickable={cat}
      key={cat}
      className={css.item}
      onClick={useEvent((e) => {
        console.log("click");
        ref.current && ref.current.show();
      })}
    >
      <div className={cx(css.title)}>{cat}</div>
      <div className={css.count}>{count}</div>
    </List.Item>
  );
  return (
    <SwipeAction
      key={cat}
      ref={ref}
      closeOnAction={false}
      closeOnTouchOutside={true}
      rightActions={[
        ...(index > 0
          ? [
              {
                key: "up",
                text: "上移",
                color: "light",
                onClick() {
                  let data = cats.data;
                  let temp = data[index - 1];
                  data[index - 1] = data[index];
                  data[index] = temp;
                  remoteDb.saveMeta({
                    folderSort: data,
                  });
                },
              },
            ]
          : []),
        ...(index < cats.data.length - 1
          ? [
              {
                key: "down",
                text: "下移",
                color: "weak",
                onClick() {
                  let data = cats.data;
                  let temp = data[index + 1];
                  data[index + 1] = data[index];
                  data[index] = temp;
                  remoteDb.saveMeta({
                    folderSort: data,
                  });
                },
              },
            ]
          : []),
        ...(cat !== "默认"
          ? [
              {
                key: "edit",
                text: "编辑",
                color: "warning",
                onClick() {
                  putCategory(cats, cat);
                },
              },
              {
                key: "delete",
                text: "删除",
                color: "danger",
                onClick() {
                  Dialog.confirm({
                    content: `确定要删除文件夹 [${cat}] 吗?`,
                    confirmText: `删除`,
                    cancelText: `取消`,
                    onConfirm() {
                      remoteDb.deleteFolder(cat);
                      remoteDb.saveMeta({
                        folderSort: cats.data.filter((c) => c !== cat),
                      });
                    },
                  });
                },
              },
            ]
          : []),
      ]}
    >
      {child}
    </SwipeAction>
  );
};

export function Categories(props: Props) {
  const [folderCount, setFolderCount] = useState(kv.folderCount.get({}));
  const history = useHistory();

  const cats = useQuery(async () => {
    let cats = (await remoteDb.getFolders()) ?? [];
    console.log("cats", cats);
    return cats;
  }, []);
  useEffect(() => {
    if (!cats) return;
    console.time("findCount");
    let cache = kv.folderCount.get({});
    if (Date.now() - kv.get("countCategories", 0) > 24 * 3600 * 1000) {
      cache = {};
      kv.set("countCategories", Date.now());
    }
    Promise.all(
      [...(cats.data ?? []), "回收站"].map(async (c) => {
        if (!cache[c]) {
          // if (c === '回收站') {
          //   cache['回收站'] = (await remoteDb.getNotes('.trash'))?.length;
          // } else {
          //   cache[c] = await db.notes
          //     .where({
          //       trashedAt: 0,
          //       categoryId: c.id,
          //     })
          //     .count();
          // }
        }
      })
    ).then(() => {
      setFolderCount(cache);
      kv.folderCount.set(cache);
      console.timeEnd("findCount");
    });
  }, [cats]);
  const sortHelperRef = useRef(null);
  return (
    <div>
      <NavBar>文件夹</NavBar>
      <List>
        {cats.data?.map((cat, index) => (
          <CatItem
            key={cat}
            index={index}
            cat={cat}
            cats={cats}
            count={folderCount[cat] || 0}
          />
        ))}
        {/* <div ref={sortHelperRef}></div> */}

        <List.Item
          className={css.item}
          onClick={(e) => {
            history.push("/trash");
          }}
        >
          <div className={cx(css.title, css.buildIn, css.trash)}>回收站</div>
          <div className={css.count}>{folderCount[-2] || 0}</div>
        </List.Item>
        <List.Item
          className={css.addBtn}
          onClick={() => putCategory(cats)}
        >
          <div>添加文件夹</div>
        </List.Item>
      </List>
    </div>
  );
}
