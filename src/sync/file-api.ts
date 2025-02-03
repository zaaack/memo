import axios from "axios"
import type { FolderMeta, Meta } from "./remote-db";
import { setupCache} from 'axios-cache-interceptor'
setupCache(axios, {
  ttl: 1000,
})
export interface FileInfo {
  name: string;
  sort: number;
  mtime: number;
  ctime: number;
}

class FileApi {
  async list(folder: string) {
    let res = await axios.get<{ files: FileInfo[] }>(
      `/api/folder/list/${folder}`
    );
    return res.data;
  }
  async get(props: { folder: string; name: string }) {
    let res = await axios.get(`/api/file/${props.folder}/${props.name}`);
    return res.data;
  }
  async put(props: { folder: string; name: string; content?: string, image?: Blob }) {
    const form = new FormData()
    if (props.content) {
      form.set("content", props.content);
    }
    if (props.image) {
      form.set('image', props.image)
    }
    let res = await axios.put(
      `/api/file/${props.folder}/${props.name}`,
      form,
    );
    return res.data;
  }
  async delete(path: string) {
    let res = await axios.delete(`/api/folder/${path}`);
    return res.data;
  }

  async rename(oldPath: string, newPath: string) {
    let res = await axios.post(`/api/file/rename`, void 0, {
      params: { oldPath, newPath},
    });
    return res;
  }
  async getMeta(): Promise<Meta>;
  async getMeta(folder: string): Promise<FolderMeta>;
  async getMeta(folder?: string) {
    let res = await axios.get<{ meta: Meta | FolderMeta  }>(`/api/meta`, {
      params: {
        folder,
      },
    });
    return res.data.meta;
  }
  async setMeta(data: Meta): Promise<void>;
  async setMeta(data: FolderMeta, folder: string): Promise<void>;
  async setMeta(data: Meta | FolderMeta, folder?: string) {
    let res = await axios.put(`/api/meta`, data, {
      params: {
        folder,
      },
    });
    return res.data;
  }
}

export const fileApi = new FileApi
