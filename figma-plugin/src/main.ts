figma.showUI(__html__, { width: 360, height: 520, themeColors: true });

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

  const node = selection[0];
  const existingTags = node.getSharedPluginData("index_patterns", "tags");
  const existingMeta = node.getSharedPluginData("index_patterns", "metadata");

  figma.ui.postMessage({
    type: "selection",
    data: {
      id: node.id,
      name: node.name,
      type: node.type,
      width: "width" in node ? node.width : 0,
      height: "height" in node ? node.height : 0,
      pageName: figma.currentPage.name,
      existingTags: existingTags ? JSON.parse(existingTags) : [],
      existingMeta: existingMeta ? JSON.parse(existingMeta) : null,
    },
  });
}

figma.on("selectionchange", () => {
  sendSelection();
  sendFileKey();
});

figma.ui.onmessage = async (msg) => {
  if (msg.type === "get-selection") {
    sendSelection();
  }

  if (msg.type === "capture-screenshot") {
    const selection = figma.currentPage.selection;
    if (selection.length === 0) {
      figma.ui.postMessage({ type: "screenshot-error", error: "No selection" });
      return;
    }

    const node = selection[0];
    if (!("exportAsync" in node)) {
      figma.ui.postMessage({
        type: "screenshot-error",
        error: "Selected node cannot be exported",
      });
      return;
    }

    try {
      const bytes = await node.exportAsync({
        format: "PNG",
        constraint: { type: "SCALE", value: 2 },
      });
      figma.ui.postMessage({ type: "screenshot", data: bytes });
    } catch (e) {
      figma.ui.postMessage({
        type: "screenshot-error",
        error: String(e),
      });
    }
  }

  if (msg.type === "save-tags") {
    const selection = figma.currentPage.selection;
    if (selection.length === 0) return;

    const node = selection[0];
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
