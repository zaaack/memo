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
import { useLiveQuery } from "dexie-react-hooks";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { db } from "../db";
import { BackButton } from "../lib/BackButton";
import css from "./index.module.scss";
import { cx } from "@emotion/css";
import { kv } from "../kv";
import { Category } from "../db/Category";
import { NavBar } from "../lib/NavBar";
import { useEvent } from "../lib/utils";
import { syncHelper } from "../sync/sync-helper";
import { Link, useHistory } from "react-router-dom";
export interface Props {}

let putCategory = async (cat?: Category) => {
  let value = "";
  Dialog.confirm({
    content: (
      <Input
        placeholder="请输入文件夹名"
        defaultValue={cat?.title}
        onChange={(e) => {
          value = e;
        }}
      />
    ),
    onConfirm: async () => {
      await db.categories.put(
        {
          ...(cat || Category.empty()),
          title: value,
        },
        cat?.id
      );
      syncHelper.updateCategorySyncInfo();
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
  cat: Category;
  count: number;
  index: number;
  cats: Category[];
}) => {
  let ref = useRef<SwipeActionRef>(null);
  let child = (
    <List.Item
      clickable={cat.id! > 0}
      key={cat.id}
      className={css.item}
      onClick={useEvent((e) => {
        console.log("click");
        ref.current && ref.current.show();
      })}
    >
      <div className={cx(css.title, cat.id! <= 0 && css.buildIn)}>
        {cat.title}
      </div>
      <div className={css.count}>{count}</div>
    </List.Item>
  );
  return (
    <SwipeAction
      key={cat.id}
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
                  let temp = cats[index - 1];
                  cats[index - 1] = cats[index];
                  cats[index] = temp;
                  cats = cats.map((c, i) => ({ ...c, sort: i }));
                  db.categories.bulkPut(cats);
                  syncHelper.updateCategorySyncInfo();
                },
              },
            ]
          : []),
        ...(index < cats.length - 1
          ? [
              {
                key: "down",
                text: "下移",
                color: "weak",
                onClick() {
                  let temp = cats[index + 1];
                  cats[index + 1] = cats[index];
                  cats[index] = temp;
                  cats = cats.map((c, i) => ({ ...c, sort: i }));
                  db.categories.bulkPut(cats);
                  syncHelper.updateCategorySyncInfo();
                },
              },
            ]
          : []),
        ...(cat.id! > 0
          ? [
              {
                key: "edit",
                text: "编辑",
                color: "warning",
                onClick() {
                  putCategory(cat);
                },
              },
              {
                key: "delete",
                text: "删除",
                color: "danger",
                onClick() {
                  Dialog.confirm({
                    content: `确定要删除文件夹 [${cat.title}] 吗?`,
                    confirmText: `删除`,
                    cancelText: `取消`,
                    onConfirm() {
                      db.categories.delete(cat.id!);
                      syncHelper.updateCategorySyncInfo();
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
  const history = useHistory()

  const cats = useLiveQuery(async () => {
    let cats = await db.categories.orderBy("sort").toArray();
    console.log("cats", cats);
    cats = Category.addAllAndDefault(cats);
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
      [...cats, { id: -2 }].map(async (c) => {
        if (!cache[c.id!]) {
          if (c.id === -1) {
            // 全部
            cache[c.id!] = await db.notes.where("trashedAt").equals(0).count();
            console.log("cache[-1]", cache[c.id!]);
          } else if (c.id === -2) {
            cache[-2] = await db.notes.where("trashedAt").notEqual(0).count();
          } else {
            cache[c.id!] = await db.notes
              .where({
                trashedAt: 0,
                categoryId: c.id,
              })
              .count();
          }
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
        {cats?.map((cat, index) => (
          <CatItem
            key={cat.id}
            index={index}
            cat={cat}
            cats={cats}
            count={folderCount[cat.id!] || 0}
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
        <List.Item className={css.addBtn} onClick={() => putCategory()}>
          <div>添加文件夹</div>
        </List.Item>
      </List>
    </div>
  );
}
