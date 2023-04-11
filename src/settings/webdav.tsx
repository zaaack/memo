import { Button, Form, Input, Toast } from 'antd-mobile';
import React, { useState } from 'react'
import { kv } from '../kv';
import { NavBar } from '../lib/NavBar';
import { remoteDb } from '../sync/remote-db';
import { syncHelper } from '../sync/sync-helper';

export interface Props {

}

export function Webdav(props: Props) {
  const [isEdited, setIsEdited] = useState(false)
  return (
    <Form
      initialValues={kv.settings.get()?.webdav}
      onFinish={async (e) => {
        console.log('e', e)
        kv.settings.set({ webdav: e });
        remoteDb.updateConfig()
        if (await remoteDb.test()) {
          setIsEdited(true)
          syncHelper.sync()
          Toast.show('连接成功')
        } else {
          Toast.show('连接失败!')
        }
      }}
      onValuesChange={(_, e) => {
        setIsEdited(true)
      }}
      footer={
        <Button disabled={!isEdited} block type="submit" color="primary" size="large">
          提交
        </Button>
      }
    >
      <NavBar/>
      <Form.Item name="url" label="webdav链接">
        <Input placeholder="" />
      </Form.Item>
      <Form.Item name="user" label="webdav账号">
        <Input placeholder="" />
      </Form.Item>
      <Form.Item name="pass" label="webdav密码">
        <Input placeholder="" />
      </Form.Item>
    </Form>
  )
}
