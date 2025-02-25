// Sample data for the embedding space visualization

// Paper interface
export interface Paper {
  id: string
  title: string
  abstract: string
  author: string
  embedding: [number, number, number] // 3D position in embedding space
  topics: string[]
  year: number
  citations: number
}

// Topic interface
export interface Topic {
  id: string
  name: string
  embedding: [number, number, number] // 3D position in embedding space
  papers: string[] // IDs of related papers
  color: string
}

// Sample topics with embeddings
export const topics: Topic[] = [
  {
    id: "t1",
    name: "Agents",
    embedding: [-8, 4, 0],
    papers: ["p1", "p3", "p7"],
    color: "#6366f1" // Indigo
  },
  {
    id: "t2",
    name: "Embeddings",
    embedding: [8, -2, 2],
    papers: ["p2", "p5", "p8"],
    color: "#8b5cf6" // Violet
  },
  {
    id: "t3",
    name: "Leadership",
    embedding: [-4, -4, -2],
    papers: ["p4", "p6"],
    color: "#ec4899" // Pink
  },
  {
    id: "t4",
    name: "Teams",
    embedding: [4, 2, -4],
    papers: ["p3", "p6", "p9"],
    color: "#06b6d4" // Cyan
  },
  {
    id: "t5",
    name: "Memory",
    embedding: [-6, 0, 4],
    papers: ["p1", "p7", "p10"],
    color: "#14b8a6" // Teal
  },
  {
    id: "t6",
    name: "Identity",
    embedding: [0, -2, -4],
    papers: ["p4", "p9"],
    color: "#a855f7" // Purple
  }
]

// Sample papers with embeddings
export const papers: Paper[] = [
  {
    id: "p1",
    title: "Emergent Abilities of Large Language Models",
    abstract: "This paper explores the emergent abilities of large language models as they scale in size and complexity.",
    author: "Bryan Acton",
    embedding: [-7, 3, 1],
    topics: ["t1", "t5"],
    year: 2023,
    citations: 42
  },
  {
    id: "p2",
    title: "Vector Representations in Deep Learning",
    abstract: "An exploration of how vector representations enable deep learning models to capture semantic meaning.",
    author: "Bryan Acton",
    embedding: [7, -1, 3],
    topics: ["t2"],
    year: 2022,
    citations: 38
  },
  {
    id: "p3",
    title: "Multi-Agent Collaboration Systems",
    abstract: "This research presents a framework for enabling multiple AI agents to collaborate effectively on complex tasks.",
    author: "Bryan Acton",
    embedding: [-6, 2, -3],
    topics: ["t1", "t4"],
    year: 2023,
    citations: 27
  },
  {
    id: "p4",
    title: "Identity Formation in Digital Spaces",
    abstract: "An analysis of how individuals form and express identity in digital and virtual environments.",
    author: "Bryan Acton",
    embedding: [-2, -3, -3],
    topics: ["t3", "t6"],
    year: 2021,
    citations: 31
  },
  {
    id: "p5",
    title: "Semantic Embeddings for Knowledge Graphs",
    abstract: "This paper introduces a novel approach to creating semantic embeddings for complex knowledge graphs.",
    author: "Bryan Acton",
    embedding: [6, -3, 1],
    topics: ["t2"],
    year: 2022,
    citations: 45
  },
  {
    id: "p6",
    title: "Leadership Dynamics in Virtual Teams",
    abstract: "An examination of how leadership emerges and functions in distributed virtual team environments.",
    author: "Bryan Acton",
    embedding: [0, -2, -3],
    topics: ["t3", "t4"],
    year: 2021,
    citations: 29
  },
  {
    id: "p7",
    title: "Memory Augmentation in Large Language Models",
    abstract: "This research explores techniques for enhancing the memory capabilities of large language models.",
    author: "Bryan Acton",
    embedding: [-7, 1, 3],
    topics: ["t1", "t5"],
    year: 2023,
    citations: 36
  },
  {
    id: "p8",
    title: "Cross-Modal Embeddings for AI Systems",
    abstract: "A novel approach to creating embeddings that work across different modalities like text, images, and audio.",
    author: "Bryan Acton",
    embedding: [5, -1, 4],
    topics: ["t2"],
    year: 2022,
    citations: 33
  },
  {
    id: "p9",
    title: "Digital Identity in Collaborative Environments",
    abstract: "This paper examines how digital identity influences collaboration in virtual team settings.",
    author: "Bryan Acton",
    embedding: [2, 0, -4],
    topics: ["t4", "t6"],
    year: 2021,
    citations: 28
  },
  {
    id: "p10",
    title: "Episodic Memory in Artificial Intelligence",
    abstract: "An exploration of implementing episodic memory capabilities in artificial intelligence systems.",
    author: "Bryan Acton",
    embedding: [-5, -1, 5],
    topics: ["t5"],
    year: 2022,
    citations: 39
  }
] 