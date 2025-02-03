import axios from "axios"


export interface Folder {
  name: string
  sort: number
  mtime: number
}

class FolderApi {
  async list() {
    let res = await axios.get<{ folders: Folder[]}>("/api/folder/list")
    return res.data
  }
  async put(name: string) {
    let res = await axios.put(`/api/folder/${name}`);
    return res.data
  }
  async delete(name: string) {
    let res = await axios.delete(`/api/folder/${name}`)
    return res.data
  }

}

export const folderApi = new FolderApi
