document.querySelectorAll("[data-open-dialog]").forEach((button) => {
  button.addEventListener("click", () => {
    document.getElementById(button.dataset.openDialog).showModal();
  });
});

document.querySelectorAll("[data-close-dialog]").forEach((button) => {
  button.addEventListener("click", () => button.closest("dialog").close());
});

document.querySelectorAll("[data-confirm-delete]").forEach((button) => {
  button.addEventListener("click", (event) => {
    const name = button.dataset.confirmDelete;
    if (!window.confirm(`確定要刪除「${name}」嗎？資料夾內的內容也會一併刪除。`)) {
      event.preventDefault();
    }
  });
});

async function uploadFiles(fileList, preservePaths) {
  if (!fileList.length || !window.workspaceConfig) return;

  const overlay = document.getElementById("upload-overlay");
  const status = document.getElementById("upload-status");
  overlay.hidden = false;
  status.textContent = `共 ${fileList.length} 個檔案`;

  const formData = new FormData();
  formData.append("csrf_token", window.workspaceConfig.csrfToken);
  formData.append("path", window.workspaceConfig.currentPath);
  Array.from(fileList).forEach((file) => {
    const filename = preservePaths && file.webkitRelativePath
      ? file.webkitRelativePath
      : file.name;
    formData.append("files", file, filename);
  });

  try {
    const response = await fetch(window.workspaceConfig.uploadUrl, {
      method: "POST",
      body: formData
    });
    if (!response.ok) {
      throw new Error(await response.text());
    }
    const result = await response.json();
    window.location.assign(result.redirect);
  } catch (error) {
    overlay.hidden = true;
    window.alert(`上傳失敗：${error.message}`);
  }
}

document.getElementById("file-upload")?.addEventListener("change", (event) => {
  uploadFiles(event.target.files, false);
});

document.getElementById("folder-upload")?.addEventListener("change", (event) => {
  uploadFiles(event.target.files, true);
});
