import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { connectToDatabase } from "@/lib/mongodb";
import { Subject } from "@/models/Subject";
import { Topic } from "@/models/Topic";

export interface ExamPreset {
  id: string;
  name: string;
  badge: string;
  subjects: {
    name: string;
    color: string;
    icon: string;
    topics: string[];
  }[];
}

let cachedGateTopics: { name: string; topics: string[] }[] | null = null;

function loadGateCsSyllabus() {
  if (cachedGateTopics) return cachedGateTopics;

  try {
    const csvPath = path.join(process.cwd(), "dataset", "questions-data", "questions-data-new.csv");
    if (!fs.existsSync(csvPath)) return [];

    const content = fs.readFileSync(csvPath, "utf-8");
    const lines = content.split(/\r?\n/);

    const topicMap: Record<string, Set<string>> = {};

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;

      const commaIdx = line.indexOf(",");
      if (commaIdx === -1) continue;

      const rawTopic = line.substring(0, commaIdx).replace(/"/g, "").trim();
      if (!rawTopic) continue;

      if (!topicMap[rawTopic]) {
        topicMap[rawTopic] = new Set();
      }

      // Extract sample subtopics or question keywords
      const questionText = line.substring(commaIdx + 1).replace(/"/g, "").trim();
      const firstWords = questionText.split(" ").slice(0, 4).join(" ");
      if (firstWords && firstWords.length > 5) {
        topicMap[rawTopic].add(firstWords);
      }
    }

    const result = Object.entries(topicMap).map(([subjectName, subtopicsSet]) => ({
      name: subjectName,
      topics: Array.from(subtopicsSet).slice(0, 8),
    }));

    cachedGateTopics = result;
    return result;
  } catch (err) {
    console.error("Error loading GATE CS dataset:", err);
    return [];
  }
}

export async function GET() {
  try {
    const gateCsSubjects = loadGateCsSyllabus();

    const presets: ExamPreset[] = [
      {
        id: "gate_cs",
        name: "GATE Computer Science (CS/IT)",
        badge: "GATE 2026",
        subjects: gateCsSubjects.map((s, idx) => ({
          name: s.name,
          color: ["amber", "mint", "sky", "lavender", "coral", "rose"][idx % 6],
          icon: "💻",
          topics: s.topics.length > 0 ? s.topics : ["Core Principles", "PYQ Practice", "Mock Revision"],
        })),
      },
      {
        id: "gate_ee",
        name: "GATE Electrical & Electronics (EE/ECE)",
        badge: "GATE 2026",
        subjects: [
          { name: "Signals & Systems", color: "sky", icon: "⚡", topics: ["Fourier Transform", "Z-Transform", "LTI Systems", "Sampling Theorem"] },
          { name: "Control Systems", color: "mint", icon: "🕹️", topics: ["Bode Plot", "Nyquist Criterion", "State Space Analysis", "PID Controllers"] },
          { name: "Analog & Digital Electronics", color: "amber", icon: "🔌", topics: ["Op-Amps", "Diode Circuits", "MOSFET Amplifiers", "Logic Gates"] },
          { name: "Electrical Machines", color: "rose", icon: "⚙️", topics: ["Transformers", "Induction Motors", "Synchronous Machines", "DC Generators"] },
        ],
      },
      {
        id: "upsc_csat",
        name: "UPSC Civil Services (Prelims & Mains)",
        badge: "UPSC 2026",
        subjects: [
          { name: "Indian Polity & Governance", color: "lavender", icon: "🏛️", topics: ["Preamble & Fundamental Rights", "Directive Principles", "Parliamentary System", "Judiciary"] },
          { name: "Indian Economy & Social Dev", color: "mint", icon: "📈", topics: ["Fiscal Policy & Monetary Policy", "Inflation & GDP", "Banking & RBI", "Foreign Trade"] },
          { name: "Modern Indian History", color: "amber", icon: "📜", topics: ["Revolt of 1857", "Freedom Movement 1919-1947", "Governor Generals", "Post-Independence"] },
          { name: "Geography & Environment", color: "sky", icon: "🌍", topics: ["Physical Geography", "Monsoon Systems", "Biodiversity Hotspots", "Climate Change"] },
        ],
      },
      {
        id: "gre_gmat",
        name: "GRE & GMAT General Prep",
        badge: "GRE/GMAT",
        subjects: [
          { name: "Quantitative Reasoning", color: "mint", icon: "🔢", topics: ["Algebra & Functions", "Geometry & Coordinate", "Data Interpretation", "Permutations & Probability"] },
          { name: "Verbal Reasoning & Reading", color: "rose", icon: "📖", topics: ["Reading Comprehension", "Text Completion", "Sentence Equivalence", "Critical Reasoning"] },
          { name: "Analytical Writing (AWA)", color: "lavender", icon: "✍️", topics: ["Analyze an Issue Essay", "Argument Evaluation", "Cohesion & Vocabulary"] },
        ],
      },
      {
        id: "jee_advanced",
        name: "JEE Main & Advanced Prep",
        badge: "JEE 2026",
        subjects: [
          { name: "Physics — Mechanics & Electromagnetism", color: "rose", icon: "🧲", topics: ["Kinematics & Newton Laws", "Work Energy Power", "Electrostatics", "Magnetism & EMI"] },
          { name: "Chemistry — Organic & Inorganic", color: "mint", icon: "🧪", topics: ["Chemical Bonding", "Reaction Mechanisms", "Thermodynamics", "Coordination Compounds"] },
          { name: "Mathematics — Calculus & Algebra", color: "sky", icon: "📐", topics: ["Differential Calculus", "Integration & Area", "Vectors & 3D Geometry", "Matrices & Determinants"] },
        ],
      },
    ];

    return NextResponse.json({
      success: true,
      totalPresets: presets.length,
      presets,
    });
  } catch (err: any) {
    console.error("Syllabus API error:", err);
    return NextResponse.json({ error: err?.message || "Failed to fetch syllabus presets" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId = "guest", examId = "gate_cs" } = await req.json();

    const presetsRes = await GET();
    const { presets } = await presetsRes.json();

    const selectedPreset = presets.find((p: any) => p.id === examId) || presets[0];

    if (userId !== "guest") {
      await connectToDatabase();

      for (const sub of selectedPreset.subjects) {
        const subId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const createdSub = await Subject.create({
          id: subId,
          userId,
          name: sub.name,
          color: sub.color,
          icon: sub.icon,
          category: selectedPreset.name,
        });

        for (const topicTitle of sub.topics) {
          const topId = `top_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          await Topic.create({
            id: topId,
            userId,
            subjectId: createdSub.id,
            title: topicTitle,
            difficulty: "medium",
            status: "notStarted",
            confidence: 1,
            estimatedHours: 2,
            revisionsCount: 0,
            satisfactionRate: 5,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Generated syllabus for ${selectedPreset.name}! ✨`,
      preset: selectedPreset,
    });
  } catch (err: any) {
    console.error("Generate syllabus API error:", err);
    return NextResponse.json({ error: err?.message || "Failed to generate exam syllabus" }, { status: 500 });
  }
}
