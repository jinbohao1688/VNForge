"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
const electron = require("electron");
const path = require("path");
const utils = require("@electron-toolkit/utils");
const Store = require("electron-store");
const child_process = require("child_process");
const fs = require("fs");
const crypto = require("crypto");
const store$1 = new Store({
  defaults: {
    theme: "dark",
    language: "en",
    aiProvider: "openai",
    aiApiKey: "",
    defaultProjectDir: "",
    editorFontSize: 14,
    editorFontFamily: "JetBrains Mono, Consolas, monospace",
    autoSave: true,
    autoSaveInterval: 30
  }
});
function setupSettingsHandler() {
  electron.ipcMain.handle("settings:get", (_, key) => {
    return { success: true, data: store$1.get(key) };
  });
  electron.ipcMain.handle("settings:getAll", () => {
    return { success: true, data: store$1.store };
  });
  electron.ipcMain.handle("settings:set", (_, key, value) => {
    store$1.set(key, value);
    return { success: true };
  });
  electron.ipcMain.handle("settings:setMany", (_, entries) => {
    Object.entries(entries).forEach(([k, v]) => store$1.set(k, v));
    return { success: true };
  });
}
const store = new Store();
function getWin() {
  return electron.BrowserWindow.getFocusedWindow();
}
function setupAIHandler() {
  electron.ipcMain.handle("ai:chat", async (_, messages, model) => {
    const apiKey = store.get("aiApiKey", "");
    const provider = store.get("aiProvider", "openai");
    if (!apiKey) {
      return { success: false, error: "AI API key not configured. Go to Settings." };
    }
    try {
      let result;
      if (provider === "openai") {
        result = await callOpenAI$1(apiKey, messages, model || "gpt-4o");
      } else if (provider === "claude") {
        result = await callClaude$1(apiKey, messages, model || "claude-3-5-sonnet-20241022");
      } else {
        result = await callGemini$1(apiKey, messages, model || "gemini-2.0-flash");
      }
      return { success: true, data: result };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });
  electron.ipcMain.handle("ai:generatePlan", async (_, idea) => {
    const apiKey = store.get("aiApiKey", "");
    const provider = store.get("aiProvider", "openai");
    if (!apiKey) {
      return { success: false, error: "AI API key not configured. Go to Settings." };
    }
    try {
      const messages = [
        {
          role: "user",
          content: `你是一个专业的视觉小说游戏策划。请根据以下想法，生成一个详细的大纲规划。

用户想法：${idea}

请以JSON格式返回，包含以下字段：
- title: 游戏名称
- genre: 游戏类型（从以下选择：恋爱,悬疑,奇幻,现代,其他）
- worldSetting: 世界观设定（100字左右）
- protagonist: { name: 主角姓名 }
- heroines: Array<{ name: 角色名, personality: 性格特点, endings: 结局类型数组如["HE","BE"] }>
- chapterOutline: Array<{ title: 章节标题, summary: 章节概要（50字）, keyChoices: 关键选择点数量(0-3) }>（至少5章）
- requiredAssets: { backgrounds: Array<string> }（至少5个背景场景）
- estimatedWords: 预计字数

只返回JSON，不要有其他内容。`
        }
      ];
      let result;
      if (provider === "openai") {
        result = await callOpenAI$1(apiKey, messages, "gpt-4o");
      } else if (provider === "claude") {
        result = await callClaude$1(apiKey, messages, "claude-3-5-sonnet-20241022");
      } else {
        result = await callGemini$1(apiKey, messages, "gemini-2.0-flash");
      }
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return { success: false, error: "AI 返回格式异常，无法解析" };
      }
      const planData = JSON.parse(jsonMatch[0]);
      return { success: true, data: planData };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });
  electron.ipcMain.handle("ai:testConnection", async (_, provider, config) => {
    const start = Date.now();
    try {
      const messages = [{ role: "user", content: "Hi" }];
      if (provider === "openai") {
        await callOpenAI$1(config.apiKey, messages, config.model || "gpt-4o");
      } else if (provider === "claude") {
        await callClaude$1(config.apiKey, messages, config.model || "claude-3-5-sonnet-20241022");
      } else {
        await callGemini$1(config.apiKey, messages, config.model || "gemini-2.0-flash");
      }
      const latency = Date.now() - start;
      return { success: true, data: { latency } };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });
  electron.ipcMain.handle("ai:streamChat", async (_, messages, model) => {
    const apiKey = store.get("aiApiKey", "");
    const provider = store.get("aiProvider", "openai");
    if (!apiKey) {
      getWin()?.webContents.send("ai:streamError", "AI API key not configured.");
      return;
    }
    try {
      if (provider === "openai") {
        await streamOpenAI(apiKey, messages, model || "gpt-4o");
      } else if (provider === "claude") {
        await streamClaude(apiKey, messages, model || "claude-3-5-sonnet-20241022");
      } else {
        await streamGemini(apiKey, messages, model || "gemini-2.0-flash");
      }
    } catch (e) {
      getWin()?.webContents.send("ai:streamError", e.message);
    }
  });
}
async function callOpenAI$1(apiKey, messages, model) {
  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ model, messages, stream: false })
  });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`OpenAI API error: ${resp.status} ${err}`);
  }
  const data = await resp.json();
  return data.choices[0]?.message?.content || "";
}
async function callClaude$1(apiKey, messages, model) {
  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      messages: messages.map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content }))
    })
  });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Claude API error: ${resp.status} ${err}`);
  }
  const data = await resp.json();
  return data.content[0]?.text || "";
}
async function callGemini$1(apiKey, messages, model) {
  const contents = messages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));
  const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ contents })
  });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Gemini API error: ${resp.status} ${err}`);
  }
  const data = await resp.json();
  return data.candidates[0]?.content?.parts[0]?.text || "";
}
async function streamOpenAI(apiKey, messages, model) {
  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ model, messages, stream: true })
  });
  if (!resp.ok) {
    throw new Error(`OpenAI stream error: ${resp.status}`);
  }
  const { Readable } = await import("stream");
  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = line.slice(6);
        if (data === "[DONE]") {
          getWin()?.webContents.send("ai:streamDone");
          return;
        }
        try {
          const parsed = JSON.parse(data);
          const token = parsed.choices?.[0]?.delta?.content;
          if (token) {
            getWin()?.webContents.send("ai:streamToken", token);
          }
        } catch {
        }
      }
    }
  }
  getWin()?.webContents.send("ai:streamDone");
}
async function streamClaude(apiKey, messages, model) {
  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
      "x-stream": "true"
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      stream: true,
      messages: messages.map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content }))
    })
  });
  if (!resp.ok) throw new Error(`Claude stream error: ${resp.status}`);
  const { Readable } = await import("stream");
  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = line.slice(6);
        try {
          const parsed = JSON.parse(data);
          if (parsed.type === "content_block_delta") {
            getWin()?.webContents.send("ai:streamToken", parsed.delta?.text || "");
          } else if (parsed.type === "message_stop") {
            getWin()?.webContents.send("ai:streamDone");
            return;
          }
        } catch {
        }
      }
    }
  }
  getWin()?.webContents.send("ai:streamDone");
}
async function streamGemini(apiKey, messages, model) {
  const contents = messages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));
  const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${apiKey}&alt=sse`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ contents })
  });
  if (!resp.ok) throw new Error(`Gemini stream error: ${resp.status}`);
  const { Readable } = await import("stream");
  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
      try {
        const parsed = JSON.parse(line);
        const token = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
        if (token) {
          getWin()?.webContents.send("ai:streamToken", token);
        }
      } catch {
      }
    }
  }
  getWin()?.webContents.send("ai:streamDone");
}
function setupEnvHandler() {
  electron.ipcMain.handle("env:check", async () => {
    return checkAllEnv();
  });
  electron.ipcMain.handle("env:checkPython", async () => {
    return checkPython();
  });
  electron.ipcMain.handle("env:checkRenpy", async () => {
    return checkRenpy();
  });
  electron.ipcMain.handle("env:checkJava", async () => {
    return checkJava();
  });
  electron.ipcMain.handle("env:runPythonScript", async (_, scriptPath, args) => {
    return runPythonScript(scriptPath, args);
  });
}
function execCommand(cmd, args) {
  return new Promise((resolve) => {
    const proc = child_process.spawn(cmd, args, { shell: true });
    let stdout = "";
    let stderr = "";
    proc.stdout?.on("data", (d) => {
      stdout += d.toString();
    });
    proc.stderr?.on("data", (d) => {
      stderr += d.toString();
    });
    proc.on("close", (code) => resolve({ stdout, stderr, code: code || 0 }));
    proc.on("error", (e) => resolve({ stdout: "", stderr: e.message, code: 1 }));
  });
}
async function checkAllEnv() {
  const [python, renpy, java, nodejs] = await Promise.all([
    checkPython(),
    checkRenpy(),
    checkJava(),
    checkNode()
  ]);
  return {
    success: true,
    data: { python, renpy, java, nodejs, androidSdk: java }
  };
}
async function checkPython() {
  try {
    const result = await execCommand("python", ["--version"]);
    if (result.code === 0) {
      return { status: "ok", version: result.stdout.trim() };
    }
    const result3 = await execCommand("python3", ["--version"]);
    if (result3.code === 0) {
      return { status: "ok", version: result3.stdout.trim() };
    }
    return { status: "missing", hint: "Install Python 3.8+ from python.org" };
  } catch {
    return { status: "missing", hint: "Python not found in PATH" };
  }
}
async function checkRenpy() {
  try {
    const result = await execCommand("renpy", ["--version"]);
    if (result.code === 0) {
      return { status: "ok", version: result.stdout.trim() };
    }
    return { status: "missing", hint: "Download Ren'Py SDK from renpy.org" };
  } catch {
    return { status: "missing", hint: "Ren'Py not found in PATH" };
  }
}
async function checkJava() {
  try {
    const result = await execCommand("java", ["-version"]);
    if (result.code === 0) {
      const firstLine = result.stderr.split("\n")[0];
      return { status: "ok", version: firstLine };
    }
    return { status: "missing", hint: "Install JDK 17+ from adoptium.net" };
  } catch {
    return { status: "missing", hint: "Java not found in PATH" };
  }
}
async function checkNode() {
  const version = process.version;
  const major = parseInt(version.replace("v", "").split(".")[0]);
  if (major >= 18) {
    return { status: "ok", version: `Node.js ${version}` };
  }
  return { status: "warn", version: `Node.js ${version}`, hint: "Node.js 18+ recommended" };
}
async function runPythonScript(scriptPath, args) {
  return new Promise((resolve) => {
    if (!fs.existsSync(scriptPath)) {
      resolve({ success: false, error: `Script not found: ${scriptPath}` });
      return;
    }
    const proc = child_process.spawn("python", [scriptPath, ...args], {
      cwd: electron.app.isPackaged ? path.join(electron.app.getAppPath(), "..") : electron.app.getAppPath()
    });
    let stdout = "";
    let stderr = "";
    proc.stdout?.on("data", (d) => {
      stdout += d.toString();
    });
    proc.stderr?.on("data", (d) => {
      stderr += d.toString();
    });
    proc.on("close", (code) => {
      resolve({ success: code === 0, stdout, stderr });
    });
    proc.on("error", (e) => resolve({ success: false, error: e.message }));
  });
}
const projectStore = new Store({ name: "projects" });
function setupProjectHandler() {
  electron.ipcMain.handle("project:list", () => {
    const projects = projectStore.get("projects", []);
    return { success: true, data: projects };
  });
  electron.ipcMain.handle("project:create", async (_, data) => {
    try {
      const projectDir = path.join(data.directory, data.name);
      if (!fs.existsSync(projectDir)) {
        fs.mkdirSync(projectDir, { recursive: true });
      }
      const project = {
        id: crypto.randomUUID(),
        name: data.name,
        description: data.description,
        directory: projectDir,
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
        status: "planning",
        stats: { wordCount: 0, sceneCount: 0, characterCount: 0, assetCount: 0 },
        config: {
          genre: "visual_novel",
          targetPlatforms: ["windows"]
        }
      };
      const projects = projectStore.get("projects", []).concat(project);
      projectStore.set("projects", projects);
      fs.writeFileSync(path.join(projectDir, "project.json"), JSON.stringify(project, null, 2));
      fs.mkdirSync(path.join(projectDir, "scripts"), { recursive: true });
      fs.mkdirSync(path.join(projectDir, "assets"), { recursive: true });
      fs.mkdirSync(path.join(projectDir, "characters"), { recursive: true });
      fs.mkdirSync(path.join(projectDir, "backgrounds"), { recursive: true });
      fs.mkdirSync(path.join(projectDir, "audio"), { recursive: true });
      return { success: true, data: project };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });
  electron.ipcMain.handle("project:open", async (_, projectId) => {
    try {
      const projects = projectStore.get("projects", []);
      const project = projects.find((p) => p.id === projectId);
      if (!project) return { success: false, error: "Project not found" };
      return { success: true, data: project };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });
  electron.ipcMain.handle("project:delete", async (_, projectId) => {
    try {
      const projects = projectStore.get("projects", []);
      const filtered = projects.filter((p) => p.id !== projectId);
      projectStore.set("projects", filtered);
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });
  electron.ipcMain.handle("dialog:selectDirectory", async () => {
    const result = await electron.dialog.showOpenDialog({
      properties: ["openDirectory", "createDirectory"],
      title: "选择项目保存位置"
    });
    if (result.canceled || result.filePaths.length === 0) {
      return { success: true, data: null };
    }
    return { success: true, data: result.filePaths[0] };
  });
  electron.ipcMain.handle("project:selectDirectory", async () => {
    const result = await electron.dialog.showOpenDialog({
      properties: ["openDirectory", "createDirectory"],
      title: "Select Project Directory"
    });
    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, error: "Cancelled" };
    }
    return { success: true, data: result.filePaths[0] };
  });
  electron.ipcMain.handle("project:readScript", async (_, projectId, scriptPath) => {
    try {
      const projects = projectStore.get("projects", []);
      const project = projects.find((p) => p.id === projectId);
      if (!project) return { success: false, error: "Project not found" };
      const fullPath = path.join(project.directory, "scripts", scriptPath);
      if (!fs.existsSync(fullPath)) return { success: false, error: "Script not found" };
      const content = fs.readFileSync(fullPath, "utf-8");
      return { success: true, data: { path: fullPath, content } };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });
  electron.ipcMain.handle("project:saveScript", async (_, projectId, scriptPath, content) => {
    try {
      const projects = projectStore.get("projects", []);
      const project = projects.find((p) => p.id === projectId);
      if (!project) return { success: false, error: "Project not found" };
      const fullPath = path.join(project.directory, "scripts", scriptPath);
      fs.writeFileSync(fullPath, content, "utf-8");
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });
  electron.ipcMain.handle("project:showInExplorer", async (_, directory) => {
    try {
      const { shell } = await import("electron");
      shell.openPath(directory);
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });
  electron.ipcMain.handle("project:createWithPlan", async (_, data) => {
    try {
      const projectDir = path.join(data.directory, data.plan.title);
      fs.mkdirSync(projectDir, { recursive: true });
      const project = {
        id: crypto.randomUUID(),
        name: data.plan.title,
        description: data.plan.worldSetting,
        directory: projectDir,
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
        status: "planning",
        stats: { wordCount: 0, sceneCount: data.plan.chapterOutline.length, characterCount: data.plan.heroines.length, assetCount: 0 },
        config: {
          genre: data.plan.genre,
          targetPlatforms: ["windows"],
          plan: data.plan
        }
      };
      const projects = projectStore.get("projects", []).concat(project);
      projectStore.set("projects", projects);
      fs.writeFileSync(path.join(projectDir, "project.json"), JSON.stringify(project, null, 2));
      fs.mkdirSync(path.join(projectDir, "scripts"), { recursive: true });
      fs.mkdirSync(path.join(projectDir, "assets"), { recursive: true });
      fs.mkdirSync(path.join(projectDir, "characters"), { recursive: true });
      fs.mkdirSync(path.join(projectDir, "backgrounds"), { recursive: true });
      fs.mkdirSync(path.join(projectDir, "audio"), { recursive: true });
      return { success: true, data: project };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });
}
const assetRegistry = /* @__PURE__ */ new Map();
function setupResourceHandler() {
  electron.ipcMain.handle("resource:import", async (_, projectId) => {
    try {
      const result = await electron.dialog.showOpenDialog({
        properties: ["openFile", "multiSelections"],
        filters: [
          { name: "Images", extensions: ["png", "jpg", "jpeg", "gif", "webp"] },
          { name: "Audio", extensions: ["mp3", "ogg", "wav", "flac"] },
          { name: "All Files", extensions: ["*"] }
        ]
      });
      if (result.canceled) return { success: false, error: "Cancelled" };
      const assets = result.filePaths.map((filePath) => {
        const name = filePath.split(/[\\/]/).pop() || "unknown";
        const ext = name.split(".").pop()?.toLowerCase() || "";
        const type = ["png", "jpg", "jpeg", "gif", "webp"].includes(ext) ? "image" : "audio";
        return {
          id: crypto.randomUUID(),
          projectId,
          type,
          originalName: name,
          fileName: `${crypto.randomUUID()}.${ext}`,
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        };
      });
      return { success: true, data: assets };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });
  electron.ipcMain.handle("resource:list", async (_, projectId) => {
    const assets = assetRegistry.get(projectId) || [];
    return { success: true, data: assets };
  });
  electron.ipcMain.handle("resource:delete", async (_, projectId, assetId) => {
    try {
      const assets = assetRegistry.get(projectId) || [];
      const filtered = assets.filter((a) => a.id !== assetId);
      assetRegistry.set(projectId, filtered);
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });
  electron.ipcMain.handle("resource:updateMetadata", async (_, projectId, assetId, metadata) => {
    try {
      const assets = assetRegistry.get(projectId) || [];
      const asset = assets.find((a) => a.id === assetId);
      if (!asset) return { success: false, error: "Asset not found" };
      asset.metadata = metadata;
      return { success: true, data: asset };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });
  electron.ipcMain.handle("resource:selectAsset", async () => {
    const result = await electron.dialog.showOpenDialog({
      properties: ["openFile"],
      filters: [
        { name: "Images", extensions: ["png", "jpg", "jpeg", "gif", "webp"] },
        { name: "Audio", extensions: ["mp3", "ogg", "wav", "flac"] }
      ]
    });
    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, error: "Cancelled" };
    }
    return { success: true, data: result.filePaths[0] };
  });
  electron.ipcMain.handle("resource:upload-asset", async (_, projectId, filePath, metadata) => {
    try {
      const ext = filePath.split(".").pop()?.toLowerCase() || "";
      const id = crypto.randomUUID();
      const isImage = ["png", "jpg", "jpeg", "webp", "gif"].includes(ext);
      const projectStore2 = new (await import("electron-store")).default();
      const projects = projectStore2.get("projects", []);
      const project = projects.find((p) => p.id === projectId);
      if (!project) return { success: false, error: "Project not found" };
      const typeDirMap = {
        background: "backgrounds",
        character: "characters",
        avatar: "characters",
        bgm: "audio/bgm",
        sfx: "audio/sfx"
      };
      const assetDir = typeDirMap[metadata.type] || "assets";
      const targetDir = path.join(project.directory, assetDir);
      fs.mkdirSync(targetDir, { recursive: true });
      const baseName = (metadata.renpyVariable || id).replace(/[^a-zA-Z0-9_\u4e00-\u9fa5]/g, "_");
      const fileName = `${baseName}.${ext}`;
      const targetPath = path.join(targetDir, fileName);
      fs.copyFileSync(filePath, targetPath);
      let thumbnailPath = "";
      if (isImage) {
        try {
          const { Jimp } = await import("jimp");
          const thumbDir = path.join(project.directory, ".vnforge", "thumbnails");
          fs.mkdirSync(thumbDir, { recursive: true });
          thumbnailPath = path.join(thumbDir, `${id}.jpg`);
          const image = await Jimp.read(targetPath);
          image.cover({ w: 200, h: 150 }).write(thumbnailPath);
        } catch {
          thumbnailPath = targetPath;
        }
      }
      const asset = {
        id,
        projectId,
        type: metadata.type || "unknown",
        originalName: metadata.originalName || fileName,
        fileName,
        filePath: targetPath,
        renpyVariable: metadata.renpyVariable || "",
        thumbnailPath,
        metadata: {
          characterName: metadata.characterName || "",
          sceneName: metadata.sceneName || "",
          emotions: metadata.emotions || [],
          loop: metadata.loop || false
        },
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      const assets = assetRegistry.get(projectId) || [];
      assets.push(asset);
      assetRegistry.set(projectId, assets);
      return { success: true, data: asset };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });
  electron.ipcMain.handle("resource:open-in-explorer", async (_, filePath) => {
    try {
      electron.shell.showItemInFolder(filePath);
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });
}
function setupRenpyHandler() {
  electron.ipcMain.handle("renpy:generate", async (_, projectId, data) => {
    try {
      for (const script of data.scripts) {
        const fullPath = path.join(data.projectDir, "scripts", script.path);
        if (!fs.existsSync(path.join(data.projectDir, "scripts"))) {
          fs.mkdirSync(path.join(data.projectDir, "scripts"), { recursive: true });
        }
        fs.writeFileSync(fullPath, script.content, "utf-8");
      }
      for (const char of data.characters) {
        const defContent = `define ${char.name.toLowerCase().replace(/\s/g, "_")} = Character("${char.name}", color="${char.color}")
`;
        const defPath = path.join(data.projectDir, "scripts", "definitions.rpy");
        const existing = fs.existsSync(defPath) ? require("fs").readFileSync(defPath, "utf-8") : "";
        fs.writeFileSync(defPath, existing + defContent, "utf-8");
      }
      return { success: true, data: { message: "Ren'Py project generated successfully" } };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });
  electron.ipcMain.handle("renpy:launch", async (_, projectPath) => {
    try {
      if (!fs.existsSync(projectPath)) {
        return { success: false, error: "Project directory not found" };
      }
      child_process.spawn("renpy", [projectPath], { detached: true, stdio: "ignore" }).unref();
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });
  electron.ipcMain.handle("renpy:build", async (_, projectPath, platform) => {
    try {
      const result = await new Promise((resolve) => {
        const proc = child_process.spawn("renpy", ["launch", projectPath, "--build-only"], { shell: true });
        let stdout = "";
        let stderr = "";
        proc.stdout?.on("data", (d) => {
          stdout += d.toString();
        });
        proc.stderr?.on("data", (d) => {
          stderr += d.toString();
        });
        proc.on("close", (code) => resolve({ stdout, stderr, code: code || 0 }));
        proc.on("error", (e) => resolve({ stdout: "", stderr: e.message, code: 1 }));
      });
      return {
        success: result.code === 0,
        data: { stdout: result.stdout, stderr: result.stderr },
        error: result.code !== 0 ? result.stderr : void 0
      };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });
  electron.ipcMain.handle("renpy:generateScript", async (_, storyContent, projectDir) => {
    try {
      const scriptPath = path.join(projectDir, "scripts", "auto_generated.rpy");
      fs.writeFileSync(scriptPath, storyContent, "utf-8");
      return { success: true, data: { path: scriptPath } };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });
  electron.ipcMain.handle("renpy:generateCode", async (_, scriptText, projectId) => {
    try {
      const store2 = (await import("electron-store")).default;
      const s = new store2();
      const apiKey = s.get("aiApiKey", "");
      const provider = s.get("aiProvider", "openai");
      if (!apiKey) {
        return { success: false, error: "请先在设置中配置 AI API Key" };
      }
      const systemPrompt = `你是一个 Ren'Py 视觉小说脚本生成器。将用户输入的剧本格式转换为标准的 Ren'Py 脚本代码。

规则：
- [背景：xxx] → scene bg_name with dissolve（背景文件对应 game/images/bg/bg_name.png）
- 白雪 "对话" → 角色名 "对话"
- （动作描述）→ narrator "动作描述"
- [选项] / A. B. → menu: ... end menu，配合 choice
- [章节：xxx] → # 第x章 注释
- # 开头的行 → 作为注释保留
- 保持原有格式，只转换语义标记

只返回 Ren'Py 代码，不要有其他解释。`;
      const userContent = `请将以下剧本转换为 Ren'Py 代码：

${scriptText}`;
      const messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent }
      ];
      let code = "";
      if (provider === "openai") {
        code = await callOpenAI(apiKey, messages, "gpt-4o");
      } else if (provider === "claude") {
        code = await callClaude(apiKey, messages, "claude-3-5-sonnet-20241022");
      } else {
        code = await callGemini(apiKey, messages, "gemini-2.0-flash");
      }
      const lineCount = code.split("\n").length;
      return { success: true, data: { code, lineCount, missingAssets: [] } };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });
  electron.ipcMain.handle("renpy:preview", async (_, projectPath) => {
    try {
      if (!fs.existsSync(projectPath)) {
        return { success: false, error: "项目目录不存在" };
      }
      const proc = child_process.spawn("renpy", [projectPath], { stdio: "ignore" });
      proc.unref();
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });
  electron.ipcMain.handle("renpy:importScript", async (_, filePath) => {
    try {
      if (!fs.existsSync(filePath)) {
        return { success: false, error: "文件不存在" };
      }
      const content = fs.readFileSync(filePath, "utf-8");
      return { success: true, data: content };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });
  electron.ipcMain.handle("renpy:openScriptFile", async () => {
    const { dialog } = await import("electron");
    const result = await dialog.showOpenDialog({
      properties: ["openFile"],
      filters: [
        { name: "剧本文件", extensions: ["txt", "md", "rpy", "docx"] },
        { name: "所有文件", extensions: ["*"] }
      ]
    });
    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, error: "Cancelled" };
    }
    return { success: true, data: result.filePaths[0] };
  });
}
async function callOpenAI(apiKey, messages, model) {
  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ model, messages, stream: false })
  });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`OpenAI API error: ${resp.status} ${err}`);
  }
  const data = await resp.json();
  return data.choices[0]?.message?.content || "";
}
async function callClaude(apiKey, messages, model) {
  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      messages: messages.map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content }))
    })
  });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Claude API error: ${resp.status} ${err}`);
  }
  const data = await resp.json();
  return data.content[0]?.text || "";
}
async function callGemini(apiKey, messages, model) {
  const contents = messages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));
  const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ contents })
  });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Gemini API error: ${resp.status} ${err}`);
  }
  const data = await resp.json();
  return data.candidates[0]?.content?.parts[0]?.text || "";
}
function setupShellHandler() {
  electron.ipcMain.handle("shell:openFile", async (_, options) => {
    const result = await electron.dialog.showOpenDialog({
      properties: ["openFile"],
      filters: options?.extensions ? [{ name: options.name || "文件", extensions: options.extensions }] : [{ name: "所有文件", extensions: ["*"] }]
    });
    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, error: "Cancelled" };
    }
    return { success: true, data: result.filePaths[0] };
  });
  electron.ipcMain.handle("shell:openDirectory", async () => {
    const result = await electron.dialog.showOpenDialog({
      properties: ["openDirectory", "createDirectory"]
    });
    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, error: "Cancelled" };
    }
    return { success: true, data: result.filePaths[0] };
  });
}
function createWindow() {
  const mainWindow = new electron.BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1e3,
    minHeight: 700,
    show: false,
    backgroundColor: "#0A0A0F",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
  });
  mainWindow.webContents.setWindowOpenHandler((details) => {
    electron.shell.openExternal(details.url);
    return { action: "deny" };
  });
  if (utils.is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
}
electron.app.whenReady().then(() => {
  utils.electronApp.setAppUserModelId("com.vnforge.app");
  electron.app.on("browser-window-created", (_, window) => {
    utils.optimizer.watchWindowShortcuts(window);
  });
  setupSettingsHandler();
  setupAIHandler();
  setupEnvHandler();
  setupProjectHandler();
  setupResourceHandler();
  setupRenpyHandler();
  setupShellHandler();
  electron.ipcMain.handle("app:version", () => electron.app.getVersion());
  createWindow();
  electron.app.on("activate", function() {
    if (electron.BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") electron.app.quit();
});
