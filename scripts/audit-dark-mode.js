const fs = require("fs");
const path = require("path");

function walk(dir) {
  let files = [];
  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item);
    if (["node_modules", ".next", ".git", "lightswind"].some((skip) => full.includes(skip))) continue;
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      files = files.concat(walk(full));
    } else if (full.endsWith(".tsx")) {
      files.push(full);
    }
  }
  return files;
}

const files = walk("src");
const issues = [];

files.forEach((file) => {
  const content = fs.readFileSync(file, "utf8");
  const lines = content.split("\n");
  lines.forEach((line, idx) => {
    // Only check className strings
    const classMatches = line.match(/className=["`{]([^"`}]+)["`}]/g);
    if (classMatches) {
      classMatches.forEach((cm) => {
        const classes = cm;
        // 1. bg-white without dark:bg (excluding where text-white or white border is meant)
        if (/\bbg-white\b/.test(classes) && !/dark:bg-/.test(classes)) {
          // Exclude buttons with dark backgrounds or badges that shouldn't change
          issues.push({ file, line: idx + 1, type: "bg-white without dark:bg", text: line.trim() });
        }
        // 2. text-[#161514] without dark:text
        if (/text-\[#161514\]/.test(classes) && !/dark:text-/.test(classes)) {
          // If the element has bg-[#CEF431] or bg-amber or similar high-contrast light badge, dark:text isn't needed
          if (!/bg-\[#CEF431\]|bg-\[#03D26F\]|bg-amber|bg-emerald|bg-yellow/.test(classes)) {
            issues.push({ file, line: idx + 1, type: "text-[#161514] without dark:text", text: line.trim() });
          }
        }
        // 3. text-gray-900 / text-neutral-900 / text-black / text-slate-900
        if (/\b(text-gray-900|text-neutral-900|text-black|text-slate-900)\b/.test(classes) && !/dark:text-/.test(classes)) {
          issues.push({ file, line: idx + 1, type: "dark text without dark:text", text: line.trim() });
        }
        // 4. text-[#6B6B6B] without dark:text
        if (/text-\[#6B6B6B\]/.test(classes) && !/dark:text-/.test(classes)) {
          issues.push({ file, line: idx + 1, type: "text-[#6B6B6B] without dark:text", text: line.trim() });
        }
        // 5. text-neutral-700 / text-gray-700 / text-slate-700
        if (/\b(text-gray-700|text-neutral-700|text-slate-700|text-zinc-700)\b/.test(classes) && !/dark:text-/.test(classes)) {
          issues.push({ file, line: idx + 1, type: "text-gray-700 without dark:text", text: line.trim() });
        }
      });
    }
  });
});

console.log(`Audited ${files.length} TSX files. Total potential dark mode contrast issues: ${issues.length}`);

// Group by file
const byFile = {};
issues.forEach((i) => {
  const norm = i.file.replace(/\\/g, "/");
  byFile[norm] = byFile[norm] || [];
  byFile[norm].push(i);
});

// Sort by issue count descending
const sorted = Object.entries(byFile).sort((a, b) => b[1].length - a[1].length);

sorted.forEach(([f, list]) => {
  console.log(`\n📄 ${f} (${list.length} issues)`);
  list.slice(0, 4).forEach((i) => {
    console.log(`   L${i.line}: [${i.type}] ${i.text.slice(0, 90)}`);
  });
  if (list.length > 4) {
    console.log(`   ... and ${list.length - 4} more`);
  }
});
