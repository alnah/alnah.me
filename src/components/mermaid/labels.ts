const ROLE_LABELS: Record<string, string> = {
  architecture: "diagramme d'architecture",
  block: "diagramme de blocs",
  c4: "diagramme C4",
  class: "diagramme de classes",
  classDiagram: "diagramme de classes",
  er: "diagramme entité-association",
  erDiagram: "diagramme entité-association",
  flowchart: "diagramme de flux",
  "flowchart-v2": "diagramme de flux",
  "flowchart-elk": "diagramme de flux",
  gantt: "diagramme de Gantt",
  gitGraph: "graphique Git",
  journey: "diagramme de parcours utilisateur",
  kanban: "tableau Kanban",
  mindmap: "carte mentale",
  packet: "diagramme de paquets",
  pie: "graphique circulaire",
  quadrantChart: "graphique à quadrants",
  radar: "graphique radar",
  requirement: "diagramme d'exigences",
  requirementDiagram: "diagramme d'exigences",
  sankey: "diagramme de Sankey",
  sequence: "diagramme de séquence",
  sequenceDiagram: "diagramme de séquence",
  state: "diagramme d'états",
  stateDiagram: "diagramme d'états",
  "stateDiagram-v2": "diagramme d'états",
  timeline: "chronologie",
  xyChart: "graphique XY"
};

/**
 * French role description for Mermaid's internal diagram type key, announced
 * by screen readers through `aria-roledescription`. Unknown types fall back to
 * the generic word so the announcement never leaks an internal key.
 */
export function describeDiagramRole(typeKey: string): string {
  return ROLE_LABELS[typeKey] ?? "diagramme";
}
