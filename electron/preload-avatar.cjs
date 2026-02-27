const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("atlasAPI", {
  avatarClicked: () => ipcRenderer.invoke("avatar-clicked"),
  toggleRoam: () => ipcRenderer.invoke("avatar-toggle-roam"),
  onAvatarState: (cb) => ipcRenderer.on("avatar-state", (_e, state) => cb(state)),
  onAvatarDirection: (cb) => ipcRenderer.on("avatar-direction", (_e, dir) => cb(dir)),
});
