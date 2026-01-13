// Minimal File polyfill for undici/cheerio when running in Node < 20
// This provides a constructor reference expected by webidl modules.
globalThis.File = globalThis.File || class File {
  constructor(parts = [], name = "", options = {}) {
    this.parts = parts;
    this.name = name;
    this.type = options.type || "";
    this.size = parts.reduce((s, p) => s + (typeof p === 'string' ? Buffer.byteLength(p) : (p?.size || 0)), 0);
  }
};
