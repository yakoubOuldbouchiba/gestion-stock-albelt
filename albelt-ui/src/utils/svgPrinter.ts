/**
 * SVG Print Utility - Generates clean, printable PDFs focused on SVG representation
 * Emphasizes visual layout over complex data tables
 */

import CommandeService from '../services/commandeService';

export interface SvgPrintOptions {
  title: string;
  variant: 'actual' | 'suggested';
  itemLabel?: string;
  metrics?: {
    utilization?: number;
    usedArea?: number;
    wasteArea?: number;
    pieces?: number;
  };
  svgContent: string;
}

/**
 * Open server-generated simple print view (SVG-focused, minimal whitespace)
 * Uses the backend /optimization/print-simple endpoint via API service
 */
export async function printOptimizationSimple(itemId: string, variant: 'actual' | 'suggested', language: string = 'en'): Promise<void> {
  try {
    const blob = await CommandeService.printOptimizationSimple(itemId, variant, language);
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url, '_blank');
    if (!printWindow) {
      alert('Please disable pop-up blockers to use the print function.');
    }
    // Clean up the object URL after a delay to allow the window to open
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (error) {
    console.error('Failed to open print view:', error);
    alert('Failed to open print view. Please try again.');
  }
}

/**
 * Generate and open a clean SVG-focused print view (client-side fallback)
 * Focuses on visualization with minimal metadata
 */
export function printSvgLayout(options: SvgPrintOptions): void {
  const { title, variant, itemLabel, metrics, svgContent } = options;

  const metricsHtml = metrics ? `
    <div class="print-metrics">
      ${metrics.utilization !== undefined ? `<div class="metric-item"><span class="label">Utilization:</span> <span class="value">${Number(metrics.utilization).toFixed(1)}%</span></div>` : ''}
      ${metrics.usedArea !== undefined ? `<div class="metric-item"><span class="label">Used Area:</span> <span class="value">${Number(metrics.usedArea).toFixed(2)} m²</span></div>` : ''}
      ${metrics.wasteArea !== undefined ? `<div class="metric-item"><span class="label">Waste Area:</span> <span class="value">${Number(metrics.wasteArea).toFixed(2)} m²</span></div>` : ''}
      ${metrics.pieces !== undefined ? `<div class="metric-item"><span class="label">Pieces:</span> <span class="value">${metrics.pieces}</span></div>` : ''}
    </div>
  ` : '';

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${escapeHtml(title)}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          @page {
            size: A4 landscape;
            margin: 3mm;
          }

          @media print {
            body {
              background: white;
            }
          }

          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #f5f5f5;
            padding: 3mm;
            line-height: 1.2;
            height: 100vh;
            margin: 0;
          }

          .print-container {
            background: white;
            max-width: 100%;
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
          }

          .print-header {
            margin-bottom: 2mm;
            padding: 0;
            flex-shrink: 0;
          }

          .print-title {
            font-size: 13px;
            font-weight: 700;
            color: #1f2937;
            margin: 0 0 1px 0;
          }

          .print-subtitle {
            font-size: 8px;
            color: #6b7280;
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
            margin: 0;
          }

          .subtitle-item {
            display: flex;
            align-items: center;
            gap: 2px;
          }

          .subtitle-label {
            font-weight: 600;
            color: #4b5563;
          }

          .subtitle-value {
            color: #6b7280;
          }

          .print-metrics {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 1.5mm;
            margin-bottom: 1.5mm;
            padding: 0;
            flex-shrink: 0;
          }

          .metric-item {
            padding: 1.5mm 1mm;
            background: #f0f9ff;
            border: 0.5px solid #bfdbfe;
            border-radius: 1px;
            text-align: center;
            font-size: 8px;
          }

          .metric-item .label {
            font-weight: 600;
            color: #1e40af;
            font-size: 6px;
            display: block;
            margin: 0;
          }

          .metric-item .value {
            color: #111827;
            font-weight: 700;
            font-size: 9px;
            display: block;
            margin-top: 0.5px;
          }

          .svg-wrapper {
            display: flex;
            align-items: center;
            justify-content: center;
            border: 0.5px solid #d1d5db;
            border-radius: 1px;
            padding: 1.5mm;
            background: #fafafa;
            flex: 1;
            overflow: hidden;
            width: 100%;
          }

          .svg-wrapper svg {
            width: 100%;
            height: 100%;
            display: block;
          }

          @media print {
            body {
              padding: 0;
              height: auto;
            }

            .print-container {
              box-shadow: none;
              height: auto;
            }
          }

          @media (max-width: 768px) {
            .print-metrics {
              grid-template-columns: 1fr 1fr;
            }

            .print-title {
              font-size: 12px;
            }
          }
        </style>
      </head>
      <body>
        <div class="print-container">
          <div class="print-header">
            <div class="print-title">${escapeHtml(title)}</div>
            <div class="print-subtitle">
              <div class="subtitle-item">
                <span class="subtitle-label">Roll:</span>
                <span class="subtitle-value">4000mm × 130m</span>
              </div>
              ${itemLabel ? `<div class="subtitle-item"><span class="subtitle-label">Item:</span><span class="subtitle-value">${escapeHtml(itemLabel)}</span></div>` : ''}
            </div>
          </div>

          ${metricsHtml}

          <div class="svg-wrapper">
            ${svgContent}
          </div>
        </div>
      </body>
      <script>
        window.addEventListener('load', function() {
          window.print();
        });
      </script>
    </html>
  `;

  // Open in new window and trigger print
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  } else {
    alert('Please disable pop-up blockers to use the print function.');
  }
}

/**
 * Generate downloadable SVG file
 */
export function downloadSvgLayout(filename: string, svgContent: string): void {
  const blob = new Blob([svgContent], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Safe HTML escaping
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
