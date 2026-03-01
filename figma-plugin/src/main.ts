figma.showUI(__html__, { width: 360, height: 560, themeColors: true });

function getFileKey(): string {
  if (figma.fileKey) return figma.fileKey;
  const stored = figma.root.getPluginData("fileKey");
  if (stored) return stored;
  return "";
}

function sendFileKey() {
  figma.ui.postMessage({
    type: "file-key",
    data: getFileKey(),
  });
}

function sendSelection() {
  const selection = figma.currentPage.selection;
  if (selection.length === 0) {
    figma.ui.postMessage({ type: "selection", data: null });
    return;
  }

  const nodes = selection.map((node) => {
    const existingTags = node.getSharedPluginData("index_patterns", "tags");
    const existingMeta = node.getSharedPluginData("index_patterns", "metadata");
    return {
      id: node.id,
      name: node.name,
      type: node.type,
      width: "width" in node ? node.width : 0,
      height: "height" in node ? node.height : 0,
      pageName: figma.currentPage.name,
      existingTags: existingTags ? JSON.parse(existingTags) : [],
      existingMeta: existingMeta ? JSON.parse(existingMeta) : null,
    };
  });

  figma.ui.postMessage({ type: "selection", data: nodes });
}

figma.on("selectionchange", () => {
  sendSelection();
  sendFileKey();
});

let captureQueue: readonly SceneNode[] = [];
let captureIndex = 0;

async function captureCurrentNode() {
  if (captureIndex >= captureQueue.length) {
    figma.ui.postMessage({ type: "capture-all-done" });
    return;
  }

  const node = captureQueue[captureIndex];
  const nodeId = node.id;
  const nodeName = node.name;

  if (!("exportAsync" in node)) {
    figma.ui.postMessage({
      type: "capture-single",
      index: captureIndex,
      nodeId,
      nodeName,
      error: "Cannot export this node",
    });
    return;
  }

  try {
    const bytes = await node.exportAsync({
      format: "PNG",
      constraint: { type: "SCALE", value: 2 },
    });
    figma.ui.postMessage({
      type: "capture-single",
      index: captureIndex,
      nodeId,
      nodeName,
      data: bytes,
    });
  } catch (e) {
    figma.ui.postMessage({
      type: "capture-single",
      index: captureIndex,
      nodeId,
      nodeName,
      error: String(e),
    });
  }
}

figma.ui.onmessage = async (msg) => {
  if (msg.type === "get-selection") {
    sendSelection();
  }

  if (msg.type === "capture-all-screenshots") {
    const selection = figma.currentPage.selection;
    if (selection.length === 0) {
      figma.ui.postMessage({ type: "capture-all-done" });
      return;
    }

    captureQueue = [...selection];
    captureIndex = 0;
    await captureCurrentNode();
  }

  if (msg.type === "capture-next") {
    captureIndex++;
    await captureCurrentNode();
  }

  if (msg.type === "save-tags") {
    const selection = figma.currentPage.selection;
    if (selection.length === 0) return;

    for (const node of selection) {
      node.setSharedPluginData(
        "index_patterns",
        "tags",
        JSON.stringify(msg.tags)
      );
      node.setSharedPluginData(
        "index_patterns",
        "metadata",
        JSON.stringify(msg.metadata)
      );
    }

    figma.ui.postMessage({ type: "saved" });
  }

  if (msg.type === "get-file-key") {
    sendFileKey();
  }

  if (msg.type === "set-file-key") {
    figma.root.setPluginData("fileKey", msg.data);
    sendFileKey();
  }

  if (msg.type === "get-user") {
    figma.ui.postMessage({
      type: "user",
      data: {
        name: figma.currentUser?.name || "Unknown",
        photoUrl: figma.currentUser?.photoUrl || "",
      },
    });
  }
};
