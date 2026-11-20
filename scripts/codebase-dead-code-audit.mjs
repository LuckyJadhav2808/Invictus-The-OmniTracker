import fs from "fs";
import path from "path";

const SRC_DIR = path.resolve("src");

function getAllFiles(dir, extensions = [".ts", ".tsx"]) {
  let files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "node_modules" && entry.name !== ".next") {
        files = files.concat(getAllFiles(fullPath, extensions));
      }
    } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
      files.push(fullPath);
    }
  }
  return files;
}

function normalizePath(p) {
  return p.replace(/\\/g, "/");
}

function runAudit() {
  console.log("🔍 Scanning codebase for dead code, unused components, and unused imports...");
  const allFiles = getAllFiles(SRC_DIR);
  console.log(`Found ${allFiles.length} source files in src/`);

  // Map of file -> content & ast-like inspection
  const fileMap = new Map();
  const fileImportRefs = new Map(); // file -> Set of imported file paths

  // Special files that don't need inbound imports
  const isSpecialFile = (relPath) => {
    const norm = normalizePath(relPath);
    if (norm.endsWith(".test.ts") || norm.endsWith(".test.tsx") || norm.endsWith(".spec.ts")) return true;
    if (norm.endsWith(".d.ts")) return true;
    if (norm.includes("src/app/") && (
      norm.endsWith("/page.tsx") ||
      norm.endsWith("/layout.tsx") ||
      norm.endsWith("/route.ts") ||
      norm.endsWith("/loading.tsx") ||
      norm.endsWith("/error.tsx") ||
      norm.endsWith("/not-found.tsx") ||
      norm.endsWith("/template.tsx")
    )) {
      return true;
    }
    return false;
  };

  // 1. Read all files and extract imports
  for (const filePath of allFiles) {
    const content = fs.readFileSync(filePath, "utf-8");
    const relPath = path.relative(process.cwd(), filePath);
    fileMap.set(normalizePath(filePath), {
      relPath: normalizePath(relPath),
      content,
    });
    fileImportRefs.set(normalizePath(filePath), 0);
  }

  // 2. Resolve imports across files
  const importRegex = /import\s+(?:(?:(?:type\s+)?[\w*\s{},$]+from\s+)?['"]([^'"]+)['"]|['"]([^'"]+)['"])/g;
  const dynamicImportRegex = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

  for (const [filePath, fileData] of fileMap.entries()) {
    const dir = path.dirname(filePath);
    let match;

    const parseImportSpecifier = (specifier) => {
      if (!specifier) return;
      let targetPath = null;
      if (specifier.startsWith("@/")) {
        targetPath = path.resolve(SRC_DIR, specifier.slice(2));
      } else if (specifier.startsWith(".")) {
        targetPath = path.resolve(dir, specifier);
      }

      if (targetPath) {
        // Try extensions
        const candidates = [
          targetPath,
          `${targetPath}.ts`,
          `${targetPath}.tsx`,
          `${targetPath}.d.ts`,
          path.join(targetPath, "index.ts"),
          path.join(targetPath, "index.tsx"),
        ];
        for (const cand of candidates) {
          const normCand = normalizePath(cand);
          if (fileMap.has(normCand)) {
            const count = fileImportRefs.get(normCand) || 0;
            fileImportRefs.set(normCand, count + 1);
            break;
          }
        }
      }
    };

    while ((match = importRegex.exec(fileData.content)) !== null) {
      parseImportSpecifier(match[1] || match[2]);
    }
    while ((match = dynamicImportRegex.exec(fileData.content)) !== null) {
      parseImportSpecifier(match[1]);
    }
  }

  // 3. Find Orphaned / Unused Files (0 inbound imports and not a special file)
  const orphanedFiles = [];
  for (const [filePath, count] of fileImportRefs.entries()) {
    const fileData = fileMap.get(filePath);
    if (count === 0 && !isSpecialFile(fileData.relPath)) {
      orphanedFiles.push({
        filePath: fileData.relPath,
        lineCount: fileData.content.split("\n").length,
      });
    }
  }

  // 4. Find Unused Imports in each file (simple regex-based token inspection)
  const unusedImportsList = [];
  for (const [filePath, fileData] of fileMap.entries()) {
    const content = fileData.content;
    const lines = content.split("\n");
    const namedImportRegex = /import\s*\{([^}]+)\}\s*from\s*['"][^'"]+['"]/g;

    let match;
    while ((match = namedImportRegex.exec(content)) !== null) {
      const importBlock = match[1];
      const items = importBlock.split(",").map((s) => s.trim()).filter(Boolean);

      for (let item of items) {
        // Handle alias: Foo as Bar
        if (item.startsWith("type ")) {
          item = item.replace("type ", "").trim();
        }
        let identifier = item;
        if (item.includes(" as ")) {
          identifier = item.split(" as ")[1].trim();
        }

        // Count occurrences of identifier in file
        const idRegex = new RegExp(`\\b${identifier}\\b`, "g");
        const count = (content.match(idRegex) || []).length;
        // If count === 1, it only appears in the import statement itself!
        if (count === 1) {
          unusedImportsList.push({
            file: fileData.relPath,
            identifier,
          });
        }
      }
    }
  }

  console.log(`\nFound ${orphanedFiles.length} orphaned/unreferenced files.`);
  console.log(`Found ${unusedImportsList.length} unused named imports.`);

  const auditReport = {
    summary: {
      totalFiles: allFiles.length,
      orphanedFilesCount: orphanedFiles.length,
      unusedImportsCount: unusedImportsList.length,
    },
    orphanedFiles,
    unusedImportsList: unusedImportsList.slice(0, 100), // top 100 for review
    allUnusedImports: unusedImportsList,
  };

  const outputPath = path.resolve("C:/Users/deel/.gemini/antigravity/brain/e4adc17f-e4c0-4e4d-96f3-1259bc4e3c9c/codebase_dead_code_audit.json");
  fs.writeFileSync(outputPath, JSON.stringify(auditReport, null, 2));
  console.log(`Audit saved to ${outputPath}`);

  // Print top orphaned files
  console.log("\n--- Top Orphaned Files ---");
  orphanedFiles.forEach((f) => console.log(`- ${f.filePath} (${f.lineCount} lines)`));
}

runAudit();
