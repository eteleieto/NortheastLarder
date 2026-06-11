#!/usr/bin/env node
import { execFileSync } from "child_process"
import fs from "fs"
import path from "path"
import sharp from "sharp"

const contentDir = path.join(import.meta.dirname, "../content")
const attachmentsDir = path.join(contentDir, "Assets/Attachments")

const imageJobs = [
  {
    file: "Screenshot 2025-07-22 at 3.18.26 PM.png",
    out: "Screenshot 2025-07-22 at 3.18.26 PM.webp",
    width: 1200,
    quality: 82,
    markdown: ["Malt Garum.md"],
    from: "Screenshot 2025-07-22 at 3.18.26 PM.png",
    to: "Screenshot 2025-07-22 at 3.18.26 PM.webp",
  },
  {
    file: "Screenshot 2026-02-27 at 8.36.02 AM.png",
    out: "Screenshot 2026-02-27 at 8.36.02 AM.webp",
    width: 1200,
    quality: 82,
    markdown: ["Sweetness in the Northeast.md"],
    from: "Screenshot 2026-02-27 at 8.36.02 AM.png",
    to: "Screenshot 2026-02-27 at 8.36.02 AM.webp",
  },
  {
    file: "unnamed 1.png",
    out: "unnamed 1.webp",
    width: 800,
    quality: 82,
    markdown: ["Sweetness in the Northeast.md"],
    from: "unnamed 1.png",
    to: "unnamed 1.webp",
  },
  {
    file: "banner.png",
    inPlace: true,
    width: 1600,
    quality: 82,
  },
  {
    file: "sample-post.png",
    inPlace: true,
    width: 1200,
    quality: 82,
  },
  {
    file: "Unripe Peach Cheong.jpeg",
    inPlace: true,
    width: 1400,
    quality: 82,
  },
  {
    file: "Unripe Peach Cheong-1.jpeg",
    inPlace: true,
    width: 1400,
    quality: 82,
  },
  {
    file: "Unripe Peach Cheong-2.jpeg",
    inPlace: true,
    width: 1400,
    quality: 82,
  },
  {
    file: "logo.png",
    inPlace: true,
    width: 512,
    quality: 85,
  },
]

const videoJobs = [
  {
    file: "Unripe Peach Cheong Soda.mov",
    out: "Unripe Peach Cheong Soda.mp4",
    markdown: ["Unripe Peach Cheong Soda.md"],
    from: "Unripe Peach Cheong Soda.mov",
    to: "Unripe Peach Cheong Soda.mp4",
  },
]

async function optimizeImage(job) {
  const input = path.join(attachmentsDir, job.file)
  if (!fs.existsSync(input)) {
    console.warn(`skip missing image: ${job.file}`)
    return
  }

  const before = fs.statSync(input).size
  const outputName = job.inPlace ? job.file : job.out
  const output = path.join(attachmentsDir, outputName)
  const temp = `${output}.tmp`

  const pipeline = sharp(input).rotate().resize({ width: job.width, withoutEnlargement: true })

  if (outputName.endsWith(".webp")) {
    await pipeline.webp({ quality: job.quality }).toFile(temp)
  } else {
    await pipeline.png({ quality: job.quality, compressionLevel: 9 }).toFile(temp)
  }

  fs.renameSync(temp, output)
  const after = fs.statSync(output).size
  console.log(`${job.file} -> ${outputName}: ${(before / 1024 / 1024).toFixed(2)}MB -> ${(after / 1024 / 1024).toFixed(2)}MB`)

  if (!job.inPlace && job.file !== outputName) {
    fs.unlinkSync(input)
  }

  if (job.markdown) {
    for (const mdFile of job.markdown) {
      const mdPath = path.join(contentDir, mdFile)
      let text = fs.readFileSync(mdPath, "utf8")
      text = text.replaceAll(`[[${job.from}`, `[[${job.to}`)
      fs.writeFileSync(mdPath, text)
      console.log(`updated reference in ${mdFile}`)
    }
  }
}

function optimizeVideo(job) {
  const input = path.join(attachmentsDir, job.file)
  if (!fs.existsSync(input)) {
    console.warn(`skip missing video: ${job.file}`)
    return
  }

  const output = path.join(attachmentsDir, job.out)
  const before = fs.statSync(input).size

  execFileSync(
    "ffmpeg",
    ["-y", "-i", input, "-c:v", "libx264", "-crf", "28", "-preset", "slow", "-movflags", "+faststart", "-an", output],
    { stdio: "inherit" },
  )

  const after = fs.statSync(output).size
  console.log(`${job.file} -> ${job.out}: ${(before / 1024 / 1024).toFixed(2)}MB -> ${(after / 1024 / 1024).toFixed(2)}MB`)
  fs.unlinkSync(input)

  for (const mdFile of job.markdown) {
    const mdPath = path.join(contentDir, mdFile)
    let text = fs.readFileSync(mdPath, "utf8")
    text = text.replaceAll(`[[${job.from}`, `[[${job.to}`)
    fs.writeFileSync(mdPath, text)
    console.log(`updated reference in ${mdFile}`)
  }
}

for (const job of imageJobs) {
  await optimizeImage(job)
}

for (const job of videoJobs) {
  optimizeVideo(job)
}

// Remove duplicate unused originals if a webp sibling exists
for (const duplicate of ["unnamed.png", "Unripe Peach Cheong.heic"]) {
  const filePath = path.join(attachmentsDir, duplicate)
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath)
    console.log(`removed unused duplicate: ${duplicate}`)
  }
}
