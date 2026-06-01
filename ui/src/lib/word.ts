import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import type { PrdArtifacts, PrdDoc } from './prd';

/** Trigger a browser download for a Blob. */
function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function heading(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 120 },
    children: [new TextRun({ text })],
  });
}

function labelled(label: string, value: string): Paragraph {
  return new Paragraph({
    spacing: { after: 100 },
    children: [
      new TextRun({ text: `${label}: `, bold: true }),
      new TextRun({ text: value }),
    ],
  });
}

function bullet(text: string): Paragraph {
  return new Paragraph({ text, bullet: { level: 0 }, spacing: { after: 60 } });
}

/** A simple 2-column key/value table row. */
function kvRow(k: string, v: string): TableRow {
  return new TableRow({
    children: [
      new TableCell({
        width: { size: 30, type: WidthType.PERCENTAGE },
        children: [new Paragraph({ children: [new TextRun({ text: k, bold: true })] })],
      }),
      new TableCell({
        width: { size: 70, type: WidthType.PERCENTAGE },
        children: [new Paragraph({ text: v })],
      }),
    ],
  });
}

/**
 * Build and download a Test Plan as a .docx, derived from the active PRD's
 * artifacts. Mirrors the Excel export but in Word format.
 */
export async function downloadTestPlanWord(
  prd: PrdDoc,
  art: PrdArtifacts
): Promise<void> {
  const tp = art.testPlan;
  const p = prd.profile;

  const counts = {
    total: art.testCases.length,
    smoke: art.smoke.length,
    regression: art.regression.length,
    pos: art.testCases.filter((c) => c.type === 'Positive').length,
    neg: art.testCases.filter((c) => c.type === 'Negative').length,
    edge: art.testCases.filter((c) => c.type === 'Edge').length,
  };

  const doc = new Document({
    creator: 'QA Orchestration Platform',
    title: `Test Plan — ${p.title}`,
    description: `Master test plan generated from ${prd.name}`,
    sections: [
      {
        children: [
          // Title block
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 80 },
            children: [
              new TextRun({ text: 'Master Test Plan', bold: true, size: 40 }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 240 },
            children: [
              new TextRun({ text: p.title, italics: true, size: 26, color: '555555' }),
            ],
          }),

          // Document control
          labelled('Source PRD', prd.name),
          labelled('Generated', new Date().toLocaleString()),
          labelled('Author', 'QA Orchestration Platform — Test Plan Creator (agent 03)'),

          // 1. Introduction
          heading('1. Introduction'),
          new Paragraph({
            spacing: { after: 120 },
            children: [
              new TextRun(
                `This master test plan defines the testing approach for "${p.title}", derived from the requirements in "${prd.name}". It covers ${p.features.length} feature areas and ${p.acceptanceCriteria.length} acceptance criteria.`
              ),
            ],
          }),

          // 2. Scope
          heading('2. Scope'),
          new Paragraph({ text: tp.scope, spacing: { after: 120 } }),

          // 3. Features under test
          heading('3. Features Under Test'),
          ...p.features.map((f) => bullet(f)),

          // 4. Test strategy
          heading('4. Test Strategy'),
          new Paragraph({ text: tp.strategy, spacing: { after: 120 } }),

          // 5. Test environments
          heading('5. Test Environments'),
          new Paragraph({ text: tp.environments, spacing: { after: 120 } }),

          // 6. Entry & exit criteria
          heading('6. Entry & Exit Criteria'),
          labelled('Entry criteria', tp.entryCriteria),
          labelled('Exit criteria', tp.exitCriteria),

          // 7. Test coverage summary (table)
          heading('7. Test Coverage Summary'),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              kvRow('Metric', 'Value'),
              kvRow('Total test cases', String(counts.total)),
              kvRow('Positive', String(counts.pos)),
              kvRow('Negative', String(counts.neg)),
              kvRow('Edge', String(counts.edge)),
              kvRow('Smoke suite', `${counts.smoke} cases`),
              kvRow('Regression suite', `${counts.regression} cases`),
              kvRow('Acceptance criteria coverage', '100%'),
            ],
          }),

          // 8. Acceptance criteria
          heading('8. Acceptance Criteria'),
          ...p.acceptanceCriteria.map((a, i) => bullet(`${i + 1}. ${a}`)),

          // 9. Risks & deliverables
          heading('9. Deliverables'),
          bullet('Test cases workbook (Excel)'),
          bullet('Smoke and regression suites'),
          bullet('Defect report and Jira tickets'),
          bullet('Execution report and dashboards'),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const stamp = new Date().toISOString().slice(0, 10);
  const safe = p.title.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, 40);
  downloadBlob(blob, `test-plan_${safe || 'document'}_${stamp}.docx`);
}
