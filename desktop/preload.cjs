const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('social', {
  state: () => ipcRenderer.invoke('social:state'),
  savePost: (post) => ipcRenderer.invoke('social:save', post),
  removePost: (id) => ipcRenderer.invoke('social:remove', id),
  publish: (id) => ipcRenderer.invoke('social:publish', id),
  resolve: (id) => ipcRenderer.invoke('social:resolve', id),
  settings: (settings) => ipcRenderer.invoke('social:settings', settings),
  check: (platform) => ipcRenderer.invoke('social:check', platform),
  disconnect: (platform) => ipcRenderer.invoke('social:disconnect', platform),
  pause: (paused) => ipcRenderer.invoke('social:pause', paused),
  open: (target) => ipcRenderer.invoke('social:open', target),
  export: () => ipcRenderer.invoke('social:export'),
  saveImage: (data) => ipcRenderer.invoke('social:image', data),
});
