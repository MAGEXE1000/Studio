import { jsPDF } from 'jspdf';
import { Capacitor } from '@capacitor/core';
import type {
  ProductionDocumentData,
  ProductionDocumentSectionsConfig,
} from './projectProductionDocumentData';
import { DEFAULT_PRODUCTION_DOCUMENT_SECTIONS } from './projectProductionDocumentData';

export type PdfThemeMode = 'light' | 'dark' | 'amoled';

export interface GeneratePdfOptions {
  fileName?: string;
  share?: boolean;
  sections?: ProductionDocumentSectionsConfig;
  theme?: PdfThemeMode;
}

export interface GeneratePdfResult {
  fileName: string;
  pageCount: number;
  blob?: Blob;
  uri?: string;
  success?: boolean;
}

export interface PdfThemePalette {
  mode: PdfThemeMode;
  bgPage: readonly [number, number, number];
  bgCard: readonly [number, number, number];
  bgHeader: readonly [number, number, number];
  bgZebra: readonly [number, number, number];
  bgBlueprint: readonly [number, number, number];
  gridDot: readonly [number, number, number];
  textPrimary: readonly [number, number, number];
  textSecondary: readonly [number, number, number];
  textMuted: readonly [number, number, number];
  border: readonly [number, number, number];
  borderSubtle: readonly [number, number, number];
  blue: readonly [number, number, number];
  bluePillBg: readonly [number, number, number];
  amber: readonly [number, number, number];
  green: readonly [number, number, number];
}

export function resolvePdfTheme(theme?: PdfThemeMode): PdfThemePalette {
  if (theme === 'amoled') {
    return {
      mode: 'amoled',
      bgPage: [0, 0, 0] as const, // Pure pitch black #000000 for AMOLED
      bgCard: [10, 10, 14] as const,
      bgHeader: [16, 16, 22] as const,
      bgZebra: [12, 12, 16] as const,
      bgBlueprint: [4, 4, 6] as const,
      gridDot: [32, 32, 42] as const,
      textPrimary: [255, 255, 255] as const,
      textSecondary: [212, 212, 216] as const,
      textMuted: [140, 140, 150] as const,
      border: [42, 42, 52] as const,
      borderSubtle: [26, 26, 34] as const,
      blue: [59, 130, 246] as const,
      bluePillBg: [15, 23, 42] as const,
      amber: [245, 158, 11] as const,
      green: [16, 185, 129] as const,
    };
  }

  if (theme === 'dark') {
    return {
      mode: 'dark',
      bgPage: [9, 9, 11] as const, // #09090b
      bgCard: [20, 20, 26] as const,
      bgHeader: [27, 27, 35] as const,
      bgZebra: [15, 15, 20] as const,
      bgBlueprint: [12, 12, 15] as const,
      gridDot: [36, 36, 46] as const,
      textPrimary: [255, 255, 255] as const,
      textSecondary: [212, 212, 216] as const,
      textMuted: [140, 140, 150] as const,
      border: [45, 45, 55] as const,
      borderSubtle: [28, 28, 36] as const,
      blue: [59, 130, 246] as const,
      bluePillBg: [20, 30, 55] as const,
      amber: [245, 158, 11] as const,
      green: [16, 185, 129] as const,
    };
  }

  // Light (default)
  return {
    mode: 'light',
    bgPage: [255, 255, 255] as const,
    bgCard: [249, 250, 251] as const,
    bgHeader: [243, 244, 246] as const,
    bgZebra: [250, 250, 251] as const,
    bgBlueprint: [244, 245, 247] as const,
    gridDot: [224, 227, 233] as const,
    textPrimary: [17, 24, 39] as const,
    textSecondary: [75, 85, 99] as const,
    textMuted: [156, 163, 175] as const,
    border: [229, 231, 235] as const,
    borderSubtle: [243, 244, 246] as const,
    blue: [37, 99, 235] as const,
    bluePillBg: [239, 246, 255] as const,
    amber: [245, 158, 11] as const,
    green: [16, 185, 129] as const,
  };
}

function parseHexColor(
  hex?: string,
  fallback: readonly [number, number, number] = [59, 130, 246]
): [number, number, number] {
  if (!hex || typeof hex !== 'string') return [fallback[0], fallback[1], fallback[2]];
  const clean = hex.replace('#', '').trim();
  if (clean.length === 6) {
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    if (!isNaN(r) && !isNaN(g) && !isNaN(b)) return [r, g, b];
  } else if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    if (!isNaN(r) && !isNaN(g) && !isNaN(b)) return [r, g, b];
  }
  return [fallback[0], fallback[1], fallback[2]];
}

/**
 * Generates a clean, professional, multi-page vector PDF production document
 * from the canonical Stagex ProductionDocumentData contract, fully respecting
 * the active Studio theme (Light, Dark, AMOLED).
 */
export async function generateProductionDocumentPdf(
  data: ProductionDocumentData,
  options: GeneratePdfOptions = {}
): Promise<GeneratePdfResult> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const PAGE_WIDTH = 210;
  const PAGE_HEIGHT = 297;
  const MARGIN_LEFT = 14;
  const MARGIN_RIGHT = 14;
  const MARGIN_TOP = 16;
  const MARGIN_BOTTOM = 16;
  const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT; // 182mm

  // Active theme palette
  const T = resolvePdfTheme(options.theme);

  // Paint full background of a page with the theme's background color
  const fillPageBackground = () => {
    doc.setFillColor(T.bgPage[0], T.bgPage[1], T.bgPage[2]);
    doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F');
  };

  // Fill initial page 1
  fillPageBackground();

  let currentY = MARGIN_TOP;

  // Running Header Helper (pages 2+)
  const drawRunningHeader = (pageNumber: number) => {
    if (pageNumber <= 1) return;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(T.blue[0], T.blue[1], T.blue[2]);
    doc.text('STAGEX PRODUCTION DOCUMENT', MARGIN_LEFT, 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(T.textMuted[0], T.textMuted[1], T.textMuted[2]);
    const rightText = `${data.projectName.toUpperCase()} · ${data.sceneName.toUpperCase()}`;
    doc.text(rightText, PAGE_WIDTH - MARGIN_RIGHT, 10, { align: 'right' });

    doc.setDrawColor(T.border[0], T.border[1], T.border[2]);
    doc.setLineWidth(0.25);
    doc.line(MARGIN_LEFT, 12, PAGE_WIDTH - MARGIN_RIGHT, 12);
  };

  // Section Header Drawer with Page Break Check
  const ensureSpace = (heightNeeded: number): void => {
    if (currentY + heightNeeded > PAGE_HEIGHT - MARGIN_BOTTOM) {
      doc.addPage();
      fillPageBackground();
      currentY = MARGIN_TOP + 4;
      drawRunningHeader(doc.getNumberOfPages());
    }
  };

  const drawSectionTitle = (num: string, title: string, subtitle?: string) => {
    ensureSpace(12);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(T.blue[0], T.blue[1], T.blue[2]);
    doc.text(`${num} //`, MARGIN_LEFT, currentY);

    const titleX = MARGIN_LEFT + doc.getTextWidth(`${num} // `);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(T.textPrimary[0], T.textPrimary[1], T.textPrimary[2]);
    doc.text(title.toUpperCase(), titleX, currentY);

    if (subtitle) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(T.textMuted[0], T.textMuted[1], T.textMuted[2]);
      doc.text(subtitle, PAGE_WIDTH - MARGIN_RIGHT, currentY, { align: 'right' });
    }

    doc.setDrawColor(T.border[0], T.border[1], T.border[2]);
    doc.setLineWidth(0.2);
    doc.line(MARGIN_LEFT, currentY + 2.5, PAGE_WIDTH - MARGIN_RIGHT, currentY + 2.5);
    currentY += 7;
  };

  const sections: ProductionDocumentSectionsConfig = {
    ...DEFAULT_PRODUCTION_DOCUMENT_SECTIONS,
    ...(options.sections || {}),
  };

  let sectionCounter = 1;
  const getNextSectionNumber = (): string => String(sectionCounter++).padStart(2, '0');

  // ═══════════════════════════════════════════════════════════════════
  // PAGE 1: COVER, LOGISTICS, STAGE PLOT & SECTIONS
  // ═══════════════════════════════════════════════════════════════════

  // Document Type Pill
  doc.setFillColor(T.bluePillBg[0], T.bluePillBg[1], T.bluePillBg[2]);
  doc.roundedRect(MARGIN_LEFT, currentY, 58, 5.5, 1.2, 1.2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(T.blue[0], T.blue[1], T.blue[2]);
  doc.text('LIVE STAGE PRODUCTION DOCUMENT', MARGIN_LEFT + 3, currentY + 3.8);
  currentY += 8.5;

  // Project Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(T.textPrimary[0], T.textPrimary[1], T.textPrimary[2]);
  doc.text(data.projectName.toUpperCase(), MARGIN_LEFT, currentY);
  currentY += 5.5;

  // Subtitle / Scene Details
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(T.textSecondary[0], T.textSecondary[1], T.textSecondary[2]);
  doc.text(
    `Scene: ${data.sceneName} · Generated: ${data.date} ${data.time} · Document ID: ${data.documentId}`,
    MARGIN_LEFT,
    currentY
  );
  currentY += 6;

  // Production Logistics Card (Venue, Contact, Phone/Email)
  const hasLogistics = Boolean(data.venue || data.contactName || data.contactPhone);
  if (hasLogistics) {
    doc.setFillColor(T.bgCard[0], T.bgCard[1], T.bgCard[2]);
    doc.setDrawColor(T.border[0], T.border[1], T.border[2]);
    doc.setLineWidth(0.25);
    doc.roundedRect(MARGIN_LEFT, currentY, CONTENT_WIDTH, 14, 2, 2, 'FD');

    // Left Column: Venue
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(T.textMuted[0], T.textMuted[1], T.textMuted[2]);
    doc.text('VENUE / FESTIVAL', MARGIN_LEFT + 4, currentY + 4.5);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(T.textPrimary[0], T.textPrimary[1], T.textPrimary[2]);
    doc.text(data.venue || 'Production Stage / Main Hall', MARGIN_LEFT + 4, currentY + 9.5);

    // Right Column: Production Contact
    const col2X = MARGIN_LEFT + CONTENT_WIDTH / 2 + 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(T.textMuted[0], T.textMuted[1], T.textMuted[2]);
    doc.text('PRODUCTION CONTACT', col2X, currentY + 4.5);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(T.textPrimary[0], T.textPrimary[1], T.textPrimary[2]);
    const contactLine = [data.contactName, data.contactPhone].filter(Boolean).join(' · ');
    doc.text(contactLine || 'Stage Manager / FOH Engineer', col2X, currentY + 9.5);

    currentY += 18;
  }

  // ── SECTION: STAGE PLOT DIAGRAM (VECTOR VISUAL) ──────────────────
  if (sections.stagePlot) {
    drawSectionTitle(getNextSectionNumber(), 'Stage Plot', `Scale 1:50 · ${data.stageDimensions}`);

    const plotBoxH = data.isSquare ? 62 : 54;
    ensureSpace(plotBoxH + 4);

    // Stage Boundary Outer Box
    doc.setFillColor(T.bgBlueprint[0], T.bgBlueprint[1], T.bgBlueprint[2]);
    doc.setDrawColor(T.border[0], T.border[1], T.border[2]);
    doc.setLineWidth(0.3);
    doc.roundedRect(MARGIN_LEFT, currentY, CONTENT_WIDTH, plotBoxH, 2, 2, 'FD');

    // Blueprint Grid Dots
    doc.setFillColor(T.gridDot[0], T.gridDot[1], T.gridDot[2]);
    for (let gx = MARGIN_LEFT + 8; gx < MARGIN_LEFT + CONTENT_WIDTH - 6; gx += 8) {
      for (let gy = currentY + 7; gy < currentY + plotBoxH - 5; gy += 8) {
        doc.circle(gx, gy, 0.25, 'F');
      }
    }

    // Upstage marker bar
    doc.setFillColor(T.border[0], T.border[1], T.border[2]);
    doc.rect(MARGIN_LEFT + 2, currentY + 1, CONTENT_WIDTH - 4, 0.35, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(T.textPrimary[0], T.textPrimary[1], T.textPrimary[2]);
    doc.text('▲ UPSTAGE / BACKLINE WALL', MARGIN_LEFT + CONTENT_WIDTH / 2, currentY + 4, {
      align: 'center',
    });
    doc.setFontSize(5.5);
    doc.setTextColor(T.textMuted[0], T.textMuted[1], T.textMuted[2]);
    doc.text('STAGE LEFT (SL)', MARGIN_LEFT + 4, currentY + 4);
    doc.text('STAGE RIGHT (SR)', PAGE_WIDTH - MARGIN_RIGHT - 4, currentY + 4, { align: 'right' });

    // Centerline guide
    doc.setDrawColor(T.borderSubtle[0], T.borderSubtle[1], T.borderSubtle[2]);
    doc.setLineWidth(0.2);
    doc.setLineDashPattern([1.5, 1.5], 0);
    doc.line(
      MARGIN_LEFT + CONTENT_WIDTH / 2,
      currentY + 5,
      MARGIN_LEFT + CONTENT_WIDTH / 2,
      currentY + plotBoxH - 5
    );
    doc.setLineDashPattern([], 0); // Reset dash

    const elements = data.elements || [];
    const connections = data.connections || [];

    // Draw active connections
    if (connections.length > 0 && elements.length > 0) {
      connections.forEach((conn: any) => {
        const fromEl = elements.find((e: any) => e.id === conn.fromId);
        const toEl = elements.find((e: any) => e.id === conn.toId);
        if (!fromEl || !toEl) return;
        const fromX =
          MARGIN_LEFT +
          10 +
          Math.max(0, Math.min(1, fromEl.x / (data.refW || 650))) * (CONTENT_WIDTH - 20);
        const fromY =
          currentY + 9 + Math.max(0, Math.min(1, fromEl.y / (data.refH || 420))) * (plotBoxH - 18);
        const toX =
          MARGIN_LEFT +
          10 +
          Math.max(0, Math.min(1, toEl.x / (data.refW || 650))) * (CONTENT_WIDTH - 20);
        const toY =
          currentY + 9 + Math.max(0, Math.min(1, toEl.y / (data.refH || 420))) * (plotBoxH - 18);

        const connColor = parseHexColor(conn.color, T.blue);
        doc.setDrawColor(connColor[0], connColor[1], connColor[2]);
        doc.setLineWidth(0.25);
        if (conn.style === 'dashed') {
          doc.setLineDashPattern([2, 1.5], 0);
        } else if (conn.style === 'dotted') {
          doc.setLineDashPattern([0.8, 0.8], 0);
        }
        doc.line(fromX, fromY, toX, toY);
        doc.setLineDashPattern([], 0);
      });
    }

    // Draw Elements on Stage Plot
    if (elements.length === 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(T.textMuted[0], T.textMuted[1], T.textMuted[2]);
      doc.text(
        'No stage elements placed in active scene',
        MARGIN_LEFT + CONTENT_WIDTH / 2,
        currentY + plotBoxH / 2,
        {
          align: 'center',
        }
      );
    } else {
      elements.forEach((el, idx) => {
        const rawPctX = el.x / (data.refW || 650);
        const rawPctY = el.y / (data.refH || 420);
        const elX = MARGIN_LEFT + 10 + Math.max(0, Math.min(1, rawPctX)) * (CONTENT_WIDTH - 20);
        const elY = currentY + 9 + Math.max(0, Math.min(1, rawPctY)) * (plotBoxH - 18);

        const elColor = parseHexColor(el.color, T.blue);

        // Element badge circle
        doc.setFillColor(T.bgCard[0], T.bgCard[1], T.bgCard[2]);
        doc.setDrawColor(elColor[0], elColor[1], elColor[2]);
        doc.setLineWidth(0.35);
        doc.circle(elX, elY, 3.2, 'FD');

        // Element index number
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(5.5);
        doc.setTextColor(elColor[0], elColor[1], elColor[2]);
        doc.text(String(idx + 1), elX, elY + 1.2, { align: 'center' });

        // Label below element - Density-adapted typography
        const rawLabel = (el.label || el.name || el.type || `CH ${idx + 1}`).toUpperCase();
        const labelStr = rawLabel.length > 13 ? `${rawLabel.slice(0, 12)}…` : rawLabel;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(4.8);
        doc.setTextColor(T.textPrimary[0], T.textPrimary[1], T.textPrimary[2]);
        const labelY = Math.min(currentY + plotBoxH - 3.5, elY + 4.8);
        doc.text(labelStr, elX, labelY, { align: 'center' });
      });
    }

    // Downstage marker bar
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.5);
    doc.setTextColor(T.blue[0], T.blue[1], T.blue[2]);
    doc.text(
      '▼ DOWNSTAGE / AUDIENCE (FOH LINE)',
      MARGIN_LEFT + CONTENT_WIDTH / 2,
      currentY + plotBoxH - 2,
      {
        align: 'center',
      }
    );
    currentY += plotBoxH + 6;
  }

  // ── SECTION: INPUT CHANNELS & PATCH LIST ─────────────────────────
  if (sections.inputPatch) {
    ensureSpace(28);
    drawSectionTitle(
      getNextSectionNumber(),
      'Input Channel & Patch List',
      `${data.channels.length} Active Channels`
    );

    // Table Columns Setup
    const colChW = 12;
    const colInstW = 46;
    const colPerfW = 38;
    const colMicW = 44;
    const col48vW = 14;
    const colNotesW = CONTENT_WIDTH - (colChW + colInstW + colPerfW + colMicW + col48vW); // 28mm

    const drawTableHeader = () => {
      doc.setFillColor(T.bgHeader[0], T.bgHeader[1], T.bgHeader[2]);
      doc.setDrawColor(T.border[0], T.border[1], T.border[2]);
      doc.setLineWidth(0.2);
      doc.rect(MARGIN_LEFT, currentY, CONTENT_WIDTH, 6, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(T.textSecondary[0], T.textSecondary[1], T.textSecondary[2]);

      let x = MARGIN_LEFT + 2;
      doc.text('CH#', x, currentY + 4);
      x += colChW;
      doc.text('INSTRUMENT / SOURCE', x, currentY + 4);
      x += colInstW;
      doc.text('PERFORMER', x, currentY + 4);
      x += colPerfW;
      doc.text('TRANSDUCER / MIC / DI', x, currentY + 4);
      x += colMicW;
      doc.text('48V', x + col48vW / 2 - 2, currentY + 4, { align: 'center' });
      x += col48vW;
      doc.text('NOTES / MIX', x, currentY + 4);

      currentY += 6;
    };

    drawTableHeader();

    if (data.channels.length === 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(T.textMuted[0], T.textMuted[1], T.textMuted[2]);
      doc.text('No input channels configured', MARGIN_LEFT + CONTENT_WIDTH / 2, currentY + 6, {
        align: 'center',
      });
      currentY += 12;
    } else {
      data.channels.forEach((ch, idx) => {
        ensureSpace(7);
        if (currentY === MARGIN_TOP + 4) {
          drawTableHeader();
        }

        // Zebra striping
        if (idx % 2 === 1) {
          doc.setFillColor(T.bgZebra[0], T.bgZebra[1], T.bgZebra[2]);
          doc.rect(MARGIN_LEFT, currentY, CONTENT_WIDTH, 6, 'F');
        }

        doc.setDrawColor(T.border[0], T.border[1], T.border[2]);
        doc.setLineWidth(0.1);
        doc.line(MARGIN_LEFT, currentY + 6, PAGE_WIDTH - MARGIN_RIGHT, currentY + 6);

        let x = MARGIN_LEFT + 2;
        // CH
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(T.textMuted[0], T.textMuted[1], T.textMuted[2]);
        doc.text(ch.ch, x, currentY + 4.2);

        // Instrument
        x += colChW;
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(T.textPrimary[0], T.textPrimary[1], T.textPrimary[2]);
        doc.text(ch.source.slice(0, 24), x, currentY + 4.2);

        // Performer
        x += colInstW;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(T.textSecondary[0], T.textSecondary[1], T.textSecondary[2]);
        doc.text(ch.performer.slice(0, 20), x, currentY + 4.2);

        // Mic / DI
        x += colPerfW;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(T.textSecondary[0], T.textSecondary[1], T.textSecondary[2]);
        doc.text(ch.mic.slice(0, 24), x, currentY + 4.2);

        // 48V Phantom
        x += colMicW;
        if (ch.phantom) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(6);
          doc.setTextColor(T.amber[0], T.amber[1], T.amber[2]);
          doc.text('+48V', x + col48vW / 2 - 2, currentY + 4.2, { align: 'center' });
        } else {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7);
          doc.setTextColor(T.textMuted[0], T.textMuted[1], T.textMuted[2]);
          doc.text('—', x + col48vW / 2 - 2, currentY + 4.2, { align: 'center' });
        }

        // Notes
        x += col48vW;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(T.textMuted[0], T.textMuted[1], T.textMuted[2]);
        doc.text(ch.notes.slice(0, 18), x, currentY + 4.2);

        currentY += 6;
      });
      currentY += 5;
    }
  }

  // ── SECTION: TECHNICAL REQUIREMENTS (RIDER) ──────────────────────
  if (sections.technicalRequirements) {
    drawSectionTitle(
      getNextSectionNumber(),
      'Technical Requirements',
      `${data.totalRequirementsCount} Specifications`
    );

    const reqCardW = (CONTENT_WIDTH - 6) / 3;
    ensureSpace(24);

    // Card 1: FOH Audio Protocol
    doc.setFillColor(T.bgCard[0], T.bgCard[1], T.bgCard[2]);
    doc.setDrawColor(T.border[0], T.border[1], T.border[2]);
    doc.roundedRect(MARGIN_LEFT, currentY, reqCardW, 20, 1.5, 1.5, 'FD');
    doc.setFillColor(T.blue[0], T.blue[1], T.blue[2]);
    doc.rect(MARGIN_LEFT, currentY, 1.5, 20, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(T.blue[0], T.blue[1], T.blue[2]);
    doc.text('FOH PROTOCOL', MARGIN_LEFT + 4, currentY + 4.5);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(T.textPrimary[0], T.textPrimary[1], T.textPrimary[2]);
    const fohLines = doc.splitTextToSize(
      data.requirements.foh[0] || 'Dante 96kHz / 32ch minimum',
      reqCardW - 6
    );
    doc.text(fohLines.slice(0, 3), MARGIN_LEFT + 4, currentY + 9);

    // Card 2: Monitor / IEM
    const card2X = MARGIN_LEFT + reqCardW + 3;
    doc.setFillColor(T.bgCard[0], T.bgCard[1], T.bgCard[2]);
    doc.setDrawColor(T.border[0], T.border[1], T.border[2]);
    doc.roundedRect(card2X, currentY, reqCardW, 20, 1.5, 1.5, 'FD');
    doc.setFillColor(T.amber[0], T.amber[1], T.amber[2]);
    doc.rect(card2X, currentY, 1.5, 20, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(T.amber[0], T.amber[1], T.amber[2]);
    doc.text('MONITOR / IEM', card2X + 4, currentY + 4.5);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(T.textPrimary[0], T.textPrimary[1], T.textPrimary[2]);
    const monLines = doc.splitTextToSize(
      data.requirements.monitor[0] || 'Min 4 discrete stereo IEM mixes',
      reqCardW - 6
    );
    doc.text(monLines.slice(0, 3), card2X + 4, currentY + 9);

    // Card 3: Power Distribution
    const card3X = card2X + reqCardW + 3;
    doc.setFillColor(T.bgCard[0], T.bgCard[1], T.bgCard[2]);
    doc.setDrawColor(T.border[0], T.border[1], T.border[2]);
    doc.roundedRect(card3X, currentY, reqCardW, 20, 1.5, 1.5, 'FD');
    doc.setFillColor(T.green[0], T.green[1], T.green[2]);
    doc.rect(card3X, currentY, 1.5, 20, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(T.green[0], T.green[1], T.green[2]);
    doc.text('POWER REQUIREMENT', card3X + 4, currentY + 4.5);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(T.textPrimary[0], T.textPrimary[1], T.textPrimary[2]);
    const powerLines = doc.splitTextToSize(
      data.requirements.power[0] || '2× 20A isolated circuits Stage Left',
      reqCardW - 6
    );
    doc.text(powerLines.slice(0, 3), card3X + 4, currentY + 9);
    currentY += 24;

    // Additional hospitality or custom specs if present
    const extraSpecs = [
      ...(data.requirements.hospitality || []),
      ...(data.requirements.custom || []),
    ];
    if (extraSpecs.length > 0) {
      ensureSpace(14);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(T.textMuted[0], T.textMuted[1], T.textMuted[2]);
      doc.text('ADDITIONAL PRODUCTION SPECIFICATIONS:', MARGIN_LEFT, currentY);
      currentY += 4;

      extraSpecs.slice(0, 4).forEach((spec) => {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(T.textSecondary[0], T.textSecondary[1], T.textSecondary[2]);
        doc.text(`•  ${spec}`, MARGIN_LEFT + 2, currentY);
        currentY += 4;
      });
      currentY += 2;
    }
  }

  // ── SECTION: PRODUCTION & TECHNICAL NOTES ─────────────────────────
  if (sections.technicalNotes) {
    ensureSpace(24);
    drawSectionTitle(getNextSectionNumber(), 'Production & Technical Notes');

    const notesLines = doc.splitTextToSize(data.notes, CONTENT_WIDTH - 8);
    const notesBoxH = Math.max(16, notesLines.length * 4.2 + 6);

    ensureSpace(notesBoxH + 4);
    doc.setFillColor(T.bgCard[0], T.bgCard[1], T.bgCard[2]);
    doc.setDrawColor(T.border[0], T.border[1], T.border[2]);
    doc.setLineWidth(0.25);
    doc.roundedRect(MARGIN_LEFT, currentY, CONTENT_WIDTH, notesBoxH, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(T.textSecondary[0], T.textSecondary[1], T.textSecondary[2]);
    doc.text(notesLines, MARGIN_LEFT + 4, currentY + 5.5);
    currentY += notesBoxH + 6;
  }

  // ── SECTION: SETLIST RUNNING ORDER ────────────────────────────────
  if (sections.setlist) {
    ensureSpace(24);
    drawSectionTitle(
      getNextSectionNumber(),
      'Setlist Running Order',
      data.setlist.length > 0
        ? `${data.setlist.length} Songs · Total ${data.totalSetlistMinutes} Min`
        : '0 Songs'
    );

    if (data.setlist.length === 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(T.textMuted[0], T.textMuted[1], T.textMuted[2]);
      doc.text('No songs added to setlist', MARGIN_LEFT + CONTENT_WIDTH / 2, currentY + 6, {
        align: 'center',
      });
      currentY += 12;
    } else {
      // Setlist Header
      doc.setFillColor(T.bgHeader[0], T.bgHeader[1], T.bgHeader[2]);
      doc.rect(MARGIN_LEFT, currentY, CONTENT_WIDTH, 5.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(T.textSecondary[0], T.textSecondary[1], T.textSecondary[2]);

      doc.text('#', MARGIN_LEFT + 2, currentY + 3.8);
      doc.text('TRACK TITLE', MARGIN_LEFT + 12, currentY + 3.8);
      doc.text('ARTIST / NOTE', MARGIN_LEFT + 80, currentY + 3.8);
      doc.text('KEY', MARGIN_LEFT + 125, currentY + 3.8);
      doc.text('TEMPO', MARGIN_LEFT + 145, currentY + 3.8);
      doc.text('TIME', PAGE_WIDTH - MARGIN_RIGHT - 2, currentY + 3.8, { align: 'right' });
      currentY += 5.5;

      data.setlist.forEach((s, idx) => {
        ensureSpace(6);
        if (idx % 2 === 1) {
          doc.setFillColor(T.bgZebra[0], T.bgZebra[1], T.bgZebra[2]);
          doc.rect(MARGIN_LEFT, currentY, CONTENT_WIDTH, 5.5, 'F');
        }
        doc.setDrawColor(T.border[0], T.border[1], T.border[2]);
        doc.setLineWidth(0.1);
        doc.line(MARGIN_LEFT, currentY + 5.5, PAGE_WIDTH - MARGIN_RIGHT, currentY + 5.5);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(T.textMuted[0], T.textMuted[1], T.textMuted[2]);
        doc.text(String(idx + 1).padStart(2, '0'), MARGIN_LEFT + 2, currentY + 3.8);

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(T.textPrimary[0], T.textPrimary[1], T.textPrimary[2]);
        doc.text(s.title.slice(0, 36), MARGIN_LEFT + 12, currentY + 3.8);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(T.textSecondary[0], T.textSecondary[1], T.textSecondary[2]);
        doc.text((s.artist || s.notes || '—').slice(0, 24), MARGIN_LEFT + 80, currentY + 3.8);

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(T.blue[0], T.blue[1], T.blue[2]);
        doc.text(s.key || 'C', MARGIN_LEFT + 125, currentY + 3.8);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(T.textSecondary[0], T.textSecondary[1], T.textSecondary[2]);
        doc.text(`${s.bpm || 120} BPM`, MARGIN_LEFT + 145, currentY + 3.8);

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(T.textPrimary[0], T.textPrimary[1], T.textPrimary[2]);
        doc.text(s.duration || '04:00', PAGE_WIDTH - MARGIN_RIGHT - 2, currentY + 3.8, {
          align: 'right',
        });

        currentY += 5.5;
      });
      currentY += 5;
    }
  }

  // ── SECTION: GEAR / LOAD-IN CHECKLIST ─────────────────────────────
  if (sections.gear) {
    ensureSpace(24);
    drawSectionTitle(
      getNextSectionNumber(),
      'Gear / Load-In Checklist',
      `${data.totalGearItems} Items · ${data.totalGearUnits} Total Units (${data.packedGearUnits} Packed)`
    );

    if (data.gear.length === 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(T.textMuted[0], T.textMuted[1], T.textMuted[2]);
      doc.text('No gear items added to inventory', MARGIN_LEFT + CONTENT_WIDTH / 2, currentY + 6, {
        align: 'center',
      });
      currentY += 12;
    } else {
      doc.setFillColor(T.bgHeader[0], T.bgHeader[1], T.bgHeader[2]);
      doc.rect(MARGIN_LEFT, currentY, CONTENT_WIDTH, 5.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(T.textSecondary[0], T.textSecondary[1], T.textSecondary[2]);

      doc.text('ITEM NAME', MARGIN_LEFT + 2, currentY + 3.8);
      doc.text('CATEGORY', MARGIN_LEFT + 80, currentY + 3.8);
      doc.text('QTY', MARGIN_LEFT + 130, currentY + 3.8);
      doc.text('STATUS', PAGE_WIDTH - MARGIN_RIGHT - 2, currentY + 3.8, { align: 'right' });
      currentY += 5.5;

      data.gear.forEach((item, idx) => {
        ensureSpace(6);
        if (idx % 2 === 1) {
          doc.setFillColor(T.bgZebra[0], T.bgZebra[1], T.bgZebra[2]);
          doc.rect(MARGIN_LEFT, currentY, CONTENT_WIDTH, 5.5, 'F');
        }
        doc.setDrawColor(T.border[0], T.border[1], T.border[2]);
        doc.setLineWidth(0.1);
        doc.line(MARGIN_LEFT, currentY + 5.5, PAGE_WIDTH - MARGIN_RIGHT, currentY + 5.5);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(T.textPrimary[0], T.textPrimary[1], T.textPrimary[2]);
        doc.text(item.name.slice(0, 38), MARGIN_LEFT + 2, currentY + 3.8);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(T.textSecondary[0], T.textSecondary[1], T.textSecondary[2]);
        doc.text((item.category || 'General').slice(0, 24), MARGIN_LEFT + 80, currentY + 3.8);

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(T.textPrimary[0], T.textPrimary[1], T.textPrimary[2]);
        doc.text(`${item.qty || 1}x`, MARGIN_LEFT + 130, currentY + 3.8);

        if (item.packed) {
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(T.green[0], T.green[1], T.green[2]);
          doc.text('VERIFIED / PACKED', PAGE_WIDTH - MARGIN_RIGHT - 2, currentY + 3.8, {
            align: 'right',
          });
        } else {
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(T.textMuted[0], T.textMuted[1], T.textMuted[2]);
          doc.text('REQUIRED', PAGE_WIDTH - MARGIN_RIGHT - 2, currentY + 3.8, { align: 'right' });
        }

        currentY += 5.5;
      });
      currentY += 5;
    }
  }

  // ── SECTION: BAND & CREW ROSTER ───────────────────────────────────
  if (sections.bandCrew) {
    ensureSpace(24);
    drawSectionTitle(
      getNextSectionNumber(),
      'Band & Crew Roster',
      `${data.totalMembers} Members (${data.assignedMembersCount} Assigned)`
    );

    if (data.members.length === 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(T.textMuted[0], T.textMuted[1], T.textMuted[2]);
      doc.text('No members added to roster', MARGIN_LEFT + CONTENT_WIDTH / 2, currentY + 6, {
        align: 'center',
      });
      currentY += 12;
    } else {
      doc.setFillColor(T.bgHeader[0], T.bgHeader[1], T.bgHeader[2]);
      doc.rect(MARGIN_LEFT, currentY, CONTENT_WIDTH, 5.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(T.textSecondary[0], T.textSecondary[1], T.textSecondary[2]);

      doc.text('NAME', MARGIN_LEFT + 2, currentY + 3.8);
      doc.text('ROLE / POSITION', MARGIN_LEFT + 50, currentY + 3.8);
      doc.text('STAGE ELEMENT ASSIGNMENTS', MARGIN_LEFT + 100, currentY + 3.8);
      doc.text('CONTACT', PAGE_WIDTH - MARGIN_RIGHT - 2, currentY + 3.8, { align: 'right' });
      currentY += 5.5;

      data.members.forEach((m, idx) => {
        ensureSpace(6);
        if (idx % 2 === 1) {
          doc.setFillColor(T.bgZebra[0], T.bgZebra[1], T.bgZebra[2]);
          doc.rect(MARGIN_LEFT, currentY, CONTENT_WIDTH, 5.5, 'F');
        }
        doc.setDrawColor(T.border[0], T.border[1], T.border[2]);
        doc.setLineWidth(0.1);
        doc.line(MARGIN_LEFT, currentY + 5.5, PAGE_WIDTH - MARGIN_RIGHT, currentY + 5.5);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(T.textPrimary[0], T.textPrimary[1], T.textPrimary[2]);
        doc.text(m.name.slice(0, 24), MARGIN_LEFT + 2, currentY + 3.8);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(T.textSecondary[0], T.textSecondary[1], T.textSecondary[2]);
        doc.text((m.role || 'Member').slice(0, 24), MARGIN_LEFT + 50, currentY + 3.8);

        const assignText =
          m.assignedElements.length > 0 ? m.assignedElements.join(', ') : 'Unassigned';
        doc.setFont('helvetica', m.assignedElements.length > 0 ? 'bold' : 'normal');
        doc.setTextColor(
          m.assignedElements.length > 0 ? T.blue[0] : T.textMuted[0],
          m.assignedElements.length > 0 ? T.blue[1] : T.textMuted[1],
          m.assignedElements.length > 0 ? T.blue[2] : T.textMuted[2]
        );
        doc.text(assignText.slice(0, 30), MARGIN_LEFT + 100, currentY + 3.8);

        const contactStr = [m.phone, m.email].filter(Boolean).join(' · ');
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(T.textSecondary[0], T.textSecondary[1], T.textSecondary[2]);
        doc.text((contactStr || '—').slice(0, 20), PAGE_WIDTH - MARGIN_RIGHT - 2, currentY + 3.8, {
          align: 'right',
        });

        currentY += 5.5;
      });
      currentY += 5;
    }
  }

  // Fallback if all sections are disabled
  if (sectionCounter === 1) {
    ensureSpace(24);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(T.textMuted[0], T.textMuted[1], T.textMuted[2]);
    doc.text(
      'No document sections selected in export configuration.',
      MARGIN_LEFT + CONTENT_WIDTH / 2,
      currentY + 12,
      { align: 'center' }
    );
    currentY += 24;
  }

  // ═══════════════════════════════════════════════════════════════════
  // RUNNING FOOTERS & TOTAL PAGES CALCULATION
  // ═══════════════════════════════════════════════════════════════════
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    // Foot line
    doc.setDrawColor(T.border[0], T.border[1], T.border[2]);
    doc.setLineWidth(0.25);
    doc.line(MARGIN_LEFT, PAGE_HEIGHT - 12, PAGE_WIDTH - MARGIN_RIGHT, PAGE_HEIGHT - 12);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(T.textMuted[0], T.textMuted[1], T.textMuted[2]);
    doc.text('STAGEX PRODUCTION DOCUMENT', MARGIN_LEFT, PAGE_HEIGHT - 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.text(
      `LAST UPDATED: ${data.date} ${data.time}`,
      MARGIN_LEFT + CONTENT_WIDTH / 2,
      PAGE_HEIGHT - 8,
      {
        align: 'center',
      }
    );

    doc.setFont('helvetica', 'bold');
    doc.text(`PAGE ${p} OF ${totalPages}`, PAGE_WIDTH - MARGIN_RIGHT, PAGE_HEIGHT - 8, {
      align: 'right',
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  // EXPORT / SAVE / SHARE HANDLING (CROSS-PLATFORM)
  // ═══════════════════════════════════════════════════════════════════
  const rawFileName =
    options.fileName?.trim() || `${data.projectName.replace(/\s+/g, '_')}_Production_Document`;
  const sanitizedName = rawFileName.replace(/[\\/:*?"<>|]/g, '').trim() || 'Production_Document';
  const finalFileName = sanitizedName.toLowerCase().endsWith('.pdf')
    ? sanitizedName
    : `${sanitizedName}.pdf`;

  if (Capacitor.isNativePlatform()) {
    try {
      const { Filesystem, Directory } = await import('@capacitor/filesystem');
      const base64Data = doc.output('datauristring').split(',')[1];

      if (options.share) {
        const writeResult = await Filesystem.writeFile({
          path: finalFileName,
          data: base64Data,
          directory: Directory.Cache,
          recursive: true,
        });

        const { Share } = await import('@capacitor/share');
        await Share.share({
          title: data.projectName,
          text: `Stagex Production Document — ${data.projectName}`,
          url: writeResult.uri,
          dialogTitle: 'Share Production Document',
        });

        return {
          fileName: finalFileName,
          pageCount: totalPages,
          uri: writeResult.uri,
          success: true,
        };
      } else {
        // Save to Android public Downloads directory
        let savedUri = '';
        try {
          const writeResult = await Filesystem.writeFile({
            path: `Download/${finalFileName}`,
            data: base64Data,
            directory: Directory.ExternalStorage,
            recursive: true,
          });
          savedUri = writeResult.uri;
        } catch (extErr) {
          console.warn(
            'Saving to ExternalStorage/Download failed, falling back to Documents:',
            extErr
          );
          try {
            const writeResult = await Filesystem.writeFile({
              path: finalFileName,
              data: base64Data,
              directory: Directory.Documents,
              recursive: true,
            });
            savedUri = writeResult.uri;
          } catch (docErr) {
            console.warn('Saving to Documents failed, falling back to External:', docErr);
            const writeResult = await Filesystem.writeFile({
              path: finalFileName,
              data: base64Data,
              directory: Directory.External,
              recursive: true,
            });
            savedUri = writeResult.uri;
          }
        }

        return {
          fileName: finalFileName,
          pageCount: totalPages,
          uri: savedUri,
          success: true,
        };
      }
    } catch (nativeErr) {
      console.warn(
        'Capacitor native filesystem save/share failed, falling back to web download:',
        nativeErr
      );
    }
  }

  // Web Browser Download / Share Fallback
  const pdfBlob = doc.output('blob');
  if (typeof window !== 'undefined' && options.share && navigator.share && navigator.canShare) {
    try {
      const file = new File([pdfBlob], finalFileName, { type: 'application/pdf' });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: data.projectName,
          text: `Stagex Production Document — ${data.projectName}`,
        });
        return {
          fileName: finalFileName,
          pageCount: totalPages,
          blob: pdfBlob,
          success: true,
        };
      }
    } catch (shareErr) {
      console.warn('Web share failed, falling back to save:', shareErr);
    }
  }

  doc.save(finalFileName);

  return {
    fileName: finalFileName,
    pageCount: totalPages,
    blob: pdfBlob,
    success: true,
  };
}
