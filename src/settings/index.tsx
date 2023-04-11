import {
  Button,
  Dialog,
  Form,
  Input,
  List,
  SpinLoading,
  Toast,
} from "antd-mobile";
import { LeftOutline } from "antd-mobile-icons";
import React, { useState } from "react";
import { Link, useHistory } from "react-router-dom";
import { db } from "../db";
import { kv } from "../kv";
import { BackButton } from "../lib/BackButton";
import { NavBar } from "../lib/NavBar";
import { remoteDb } from "../sync/remote-db";
import { syncHelper } from "../sync/sync-helper";
import { importDB, exportDB } from "dexie-export-import";
import download from "downloadjs";
import { openFileDialog } from "../lib/open-file-dialog";

export interface Props {}

export function Settings(props: Props) {
  const [isEdited, setIsEdited] = useState(false);
  const history = useHistory()

  return (
    <div>
      <NavBar>设置</NavBar>
      <List>
        <List.Item onClick={(e) => history.push("/settings/webdav")}>
          配置webdav同步
        </List.Item>
        <List.Item
          onClick={async (e) => {
            Dialog.show({
              content: (
                <div>
                  <SpinLoading color="primary" />
                  <div style={{ textAlign: "center" }}>导出中...</div>
                </div>
              ),
            });
            let blob = await db.export();
            download(blob, "memo.db.json");
            Dialog.clear();
          }}
        >
          导出
        </List.Item>
        <List.Item
          onClick={(e) => {
            Dialog.confirm({
              content: `该操作会覆盖本地数据，确定要导入吗？`,
              onConfirm() {
                openFileDialog({ accept: "*.db.json" }, async (files) => {
                  let f = files?.[0];
                  if (f) {
                    Dialog.show({
                      content: (
                        <div>
                          <SpinLoading color="primary" />
                          <div style={{ textAlign: "center" }}>导入中...</div>
                        </div>
                      ),
                    });
                    await db.import(f);
                    Dialog.clear();
                  }
                });
              },
            });
          }}
          style={{ position: "relative" }}
        >
          导入
        </List.Item>
        <List.Item
          onClick={(e) => {
            Dialog.show({
              content: `确定要删除所有本地数据么?该操作不会影响webdav备份`,
              closeOnMaskClick: true,
              closeOnAction: true,
              actions: [
                {
                  key: "del",
                  text: "删除",
                  danger: true,
                  onClick() {
                    db.clean(false);
                    history.push("/");
                    location.reload();
                  },
                },
                {
                  key: "del2",
                  text: "删除但保留webdav配置",
                  danger: true,
                  onClick() {
                    db.clean(true);
                    history.push("/");
                    location.reload();
                  },
                },
                {
                  key: "cancel",
                  text: "取消",
                },
              ],
            });
          }}
        >
          清空本地数据
        </List.Item>
      </List>
    </div>
  );
}
