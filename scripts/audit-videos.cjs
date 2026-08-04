const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const videoDir = path.join(root, "assets/videos");
const output = path.join(root, "assets/media/video-probe-report.json");
const visualAudit = require(path.join(root, "assets/media/video-audit.json"));

function groupId(filename) {
  return filename
    .replace(/\.(mp4|webm)$/i, "")
    .replace(/-(desktop|mobile)$/, "");
}

function contentStatus(filename) {
  const id = groupId(filename);
  const audit = visualAudit.assets.find((entry) => entry.id === id);
  return audit ? audit.status : "not-classified";
}

const files = fs.readdirSync(videoDir).filter((filename) => /\.(mp4|webm)$/i.test(filename)).sort();
const assets = files.map((filename) => {
  const absolute = path.join(videoDir, filename);
  const stat = fs.statSync(absolute);
  const probe = spawnSync("ffprobe", [
    "-v", "error",
    "-show_entries", "format=duration:stream=codec_type,codec_name,width,height",
    "-of", "json",
    absolute
  ], { encoding: "utf8" });
  const parsed = probe.status === 0 ? JSON.parse(probe.stdout) : { streams: [], format: {} };
  const video = parsed.streams.find((stream) => stream.codec_type === "video");
  const audio = parsed.streams.some((stream) => stream.codec_type === "audio");
  const expectedCodecs = path.extname(filename).toLowerCase() === ".mp4" ? ["h264"] : ["vp9", "av1"];

  return {
    asset: `assets/videos/${filename}`,
    exists: true,
    nonzero: stat.size > 0,
    decodable: probe.status === 0 && Boolean(video),
    durationSeconds: Number(Number(parsed.format.duration || 0).toFixed(3)),
    dimensions: video ? `${video.width}x${video.height}` : null,
    sizeBytes: stat.size,
    codec: video ? video.codec_name : null,
    browserCompatible: Boolean(video && expectedCodecs.includes(video.codec_name)),
    audioTrack: audio,
    contentStatus: contentStatus(filename)
  };
});

const report = {
  auditedAt: new Date().toISOString(),
  note: "Codec validity does not establish genuine motion. contentStatus records the separate visual contact-sheet audit.",
  assets
};

fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
console.log(`Audited ${assets.length} video files: ${path.relative(root, output)}`);

if (assets.some((asset) => !asset.nonzero || !asset.decodable || !asset.browserCompatible || asset.audioTrack)) {
  process.exitCode = 1;
}
