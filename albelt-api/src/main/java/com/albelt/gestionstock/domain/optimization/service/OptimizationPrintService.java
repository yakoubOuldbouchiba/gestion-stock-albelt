package com.albelt.gestionstock.domain.optimization.service;

import com.albelt.gestionstock.domain.optimization.dto.OptimizationComparisonResponse;
import com.albelt.gestionstock.domain.optimization.dto.OptimizationMetricsResponse;
import com.albelt.gestionstock.domain.optimization.dto.OptimizationPlacementReportResponse;
import com.albelt.gestionstock.domain.optimization.dto.OptimizationSourceReportResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.*;

@Service
@RequiredArgsConstructor
public class OptimizationPrintService {

    private final OptimizationService optimizationService;
    private final MessageSource messageSource;

    public String generatePrintHtml(UUID itemId, String variant, Locale locale, boolean forceRegenerate) {
        OptimizationComparisonResponse comparison = optimizationService.getComparison(itemId, forceRegenerate);
        String normalizedVariant = normalizeVariant(variant);

        boolean suggested = "SUGGESTED".equals(normalizedVariant);
        String title = msg(suggested ? "pdf.optimization.suggestedTitle" : "pdf.optimization.actualTitle", locale);
        String svg = suggested
            ? comparison.getSuggested() != null ? comparison.getSuggested().getSvg() : null
            : comparison.getActualSvg();
        List<OptimizationSourceReportResponse> sources = suggested
            ? comparison.getSuggested() != null ? nullSafeSources(comparison.getSuggested().getSources()) : List.of()
            : nullSafeSources(comparison.getActualSources());
        List<OptimizationPlacementReportResponse> placements = suggested
            ? comparison.getSuggested() != null ? nullSafePlacements(comparison.getSuggested().getPlacements()) : List.of()
            : nullSafePlacements(comparison.getActualPlacements());
        OptimizationMetricsResponse metrics = suggested && comparison.getSuggested() != null
            ? comparison.getSuggested().getMetrics()
            : comparison.getActualMetrics();

        return buildHtml(title, svg, sources, placements, metrics, locale);
    }

    private String buildHtml(String title,
                              String svg,
                              List<OptimizationSourceReportResponse> sources,
                              List<OptimizationPlacementReportResponse> placements,
                              OptimizationMetricsResponse metrics,
                              Locale locale) {
        String dir = isArabic(locale) ? "rtl" : "ltr";
        String align = isArabic(locale) ? "right" : "left";
        List<String> printableSvgSlices = sliceSvgForPrint(svg);
        String metricsHtml = buildMetricsHtml(metrics, locale);
        String sourcesHtml = buildSourcesTable(sources, locale);
        String placementsHtml = buildPlacementsTable(sources, placements, locale);
        boolean hasLayout = printableSvgSlices != null && !printableSvgSlices.isEmpty();
        boolean hasSources = sources != null && !sources.isEmpty();
        boolean hasPlacements = placements != null && !placements.isEmpty();

        String layoutPagesHtml = hasLayout
            ? buildLayoutPagesHtml(title, metricsHtml, printableSvgSlices)
            : """
                <div class="page layout-page">
                  <h1>%s</h1>
                  %s
                  <div class="empty">%s</div>
                </div>
                """.formatted(
                escape(title),
                metricsHtml,
                escape(msg("pdf.optimization.noLayout", locale))
            );

        String reportPagesHtml = (hasSources || hasPlacements)
            ? """
                <div class="page report-page">
                  <h2>%s</h2>
                  %s
                  <h2>%s</h2>
                  %s
                </div>
                """.formatted(
                escape(msg("pdf.optimization.sources", locale)),
                sourcesHtml,
                escape(msg("pdf.optimization.placements", locale)),
                placementsHtml
            )
            : "";

        return """
            <!DOCTYPE html>
            <html lang="%s" dir="%s">
              <head>
                <meta charset="utf-8" />
                <title>%s</title>
                <style>
                  @page { size: A4 landscape; margin: 5mm; }
                  *, *::before, *::after { box-sizing: border-box; }
                  html, body {
                    margin: 0;
                    padding: 0;
                    background: #fff;
                    color: #111827;
                    font-family: Arial, sans-serif;
                    direction: %s;
                  }
                  .page {
                    width: 287mm;
                    page-break-after: always;
                    break-after: page;
                  }
                  .page:last-child {
                    page-break-after: auto;
                    break-after: auto;
                  }
                  h1, h2 {
                    margin: 0 0 3mm 0;
                    text-align: %s;
                  }
                  h1 { font-size: 16pt; }
                  h2 { font-size: 11pt; margin-top: 4mm; }
                  .layout-page {
                    height: 200mm;
                    display: flex;
                    flex-direction: column;
                    gap: 0;
                  }
                  .metrics {
                    display: grid;
                    grid-template-columns: repeat(4, minmax(0, 1fr));
                    gap: 3mm;
                    margin-bottom: 4mm;
                  }
                  .metric {
                    border: 1px solid #dbe1e8;
                    background: #f8fafc;
                    border-radius: 3px;
                    padding: 2.5mm;
                  }
                  .metric-label {
                    display: block;
                    font-size: 8pt;
                    color: #64748b;
                    margin-bottom: 1mm;
                    text-align: %s;
                  }
                  .metric-value {
                    display: block;
                    font-size: 10pt;
                    font-weight: 700;
                    text-align: %s;
                  }
                  .svg-wrapper {
                    width: 100%%;
                    flex: 1;
                    border: 1px solid #dbe1e8;
                    direction: ltr;
                    display: flex;
                    align-items: flex-start;
                    justify-content: center;
                    overflow: hidden;
                    min-height: 0;
                  }
                  .svg-wrapper svg {
                    width: 100%%;
                    height: 100%%;
                    display: block;
                  }
                  .empty {
                    border: 1px dashed #cbd5e1;
                    padding: 12mm;
                    text-align: center;
                    color: #64748b;
                  }
                  table {
                    width: 100%%;
                    border-collapse: collapse;
                    margin-top: 2mm;
                    font-size: 8pt;
                  }
                  th, td {
                    border: 1px solid #dbe1e8;
                    padding: 1.5mm;
                    text-align: %s;
                    vertical-align: top;
                  }
                  th {
                    background: #f1f5f9;
                    font-weight: 700;
                  }
                  .qr {
                    width: 16mm;
                    height: 16mm;
                    object-fit: contain;
                    border: 1px solid #dbe1e8;
                    background: #fff;
                  }
                  .muted { color: #64748b; }
                </style>
              </head>
              <body>
                %s%s
                <script>window.onload = () => { window.print(); };</script>
              </body>
            </html>
            """.formatted(
            escape(locale.getLanguage()),
            dir,
            escape(title),
            dir,
            align,
            align,
            align,
            align,
            layoutPagesHtml,
            reportPagesHtml
        );
    }

    private String buildLayoutPagesHtml(String title, String metricsHtml, List<String> printableSvgSlices) {
        StringBuilder html = new StringBuilder();
        int total = printableSvgSlices.size();
        for (int i = 0; i < total; i++) {
            String pageTitle = total > 1 ? title + " (" + (i + 1) + "/" + total + ")" : title;
            String metrics = i == 0 ? metricsHtml : "";
            html.append("<div class=\"page\">")
                .append("<h1>").append(escape(pageTitle)).append("</h1>")
                .append(metrics)
                .append("<div class=\"svg-wrapper\">").append(printableSvgSlices.get(i)).append("</div>")
                .append("</div>");
        }
        return html.toString();
    }

    private String buildMetricsHtml(OptimizationMetricsResponse metrics, Locale locale) {
        if (metrics == null) {
            return "";
        }
        return "<div class=\"metrics\">"
            + metric(msg("pdf.optimization.utilization", locale), formatNumber(metrics.getUtilizationPct()) + " %")
            + metric(msg("pdf.optimization.usedArea", locale), formatNumber(metrics.getUsedAreaM2()) + " m²")
            + metric(msg("pdf.optimization.wasteArea", locale), formatNumber(metrics.getWasteAreaM2()) + " m²")
            + metric(msg("pdf.optimization.pieces", locale),
                formatInteger(metrics.getPlacedPieces()) + " / " + formatInteger(metrics.getTotalPieces()))
            + "</div>";
    }

    private String metric(String label, String value) {
        return "<div class=\"metric\"><span class=\"metric-label\">"
            + escape(label)
            + "</span><span class=\"metric-value\">"
            + escape(value)
            + "</span></div>";
    }

    private String buildSourcesTable(List<OptimizationSourceReportResponse> sources, Locale locale) {
        StringBuilder html = new StringBuilder();
        html.append("<table><thead><tr>")
            .append(th(msg("pdf.type", locale)))
            .append(th(msg("pdf.reference", locale)))
            .append(th(msg("pdf.optimization.plies", locale)))
            .append(th(msg("pdf.optimization.thickness", locale)))
            .append(th(msg("pdf.color", locale)))
            .append(th(msg("pdf.optimization.widthMm", locale)))
            .append(th(msg("pdf.optimization.lengthM", locale)))
            .append(th(msg("pdf.qr", locale)))
            .append("</tr></thead><tbody>");

        for (OptimizationSourceReportResponse source : nullSafeSources(sources)) {
            String qr = source != null ? source.getQrCode() : null;
            String color = joinColor(source != null ? source.getColorName() : null, source != null ? source.getColorHexCode() : null);
            html.append("<tr>")
                .append(td(localizeSourceLabel(source, locale)))
                .append(td(source != null ? source.getReference() : null))
                .append(td(formatInteger(source != null ? source.getNbPlis() : null)))
                .append(td(formatNumber(source != null ? source.getThicknessMm() : null)))
                .append(td(color))
                .append(td(formatInteger(source != null ? source.getWidthMm() : null)))
                .append(td(formatNumber(source != null ? source.getLengthM() : null)))
                .append(tdQr(qr, msg("pdf.qr", locale)))
                .append("</tr>");
        }

        if (sources == null || sources.isEmpty()) {
            html.append("<tr><td colspan=\"8\" class=\"muted\">")
                .append(escape(msg("pdf.optimization.noSources", locale)))
                .append("</td></tr>");
        }

        html.append("</tbody></table>");
        return html.toString();
    }

    private String buildPlacementsTable(List<OptimizationSourceReportResponse> sources,
                                        List<OptimizationPlacementReportResponse> placements,
                                        Locale locale) {
        Map<String, OptimizationSourceReportResponse> sourcesByKey = new LinkedHashMap<>();
        for (OptimizationSourceReportResponse source : nullSafeSources(sources)) {
            if (source != null && source.getSourceType() != null && source.getSourceId() != null) {
                sourcesByKey.put(source.getSourceType() + "-" + source.getSourceId(), source);
            }
        }

        StringBuilder html = new StringBuilder();
        html.append("<table><thead><tr>")
            .append(th(msg("pdf.optimization.source", locale)))
            .append(th(msg("pdf.optimization.xMm", locale)))
            .append(th(msg("pdf.optimization.yMm", locale)))
            .append(th(msg("pdf.optimization.widthMm", locale)))
            .append(th(msg("pdf.optimization.heightMm", locale)))
            .append(th(msg("pdf.optimization.rotation", locale)))
            .append(th(msg("pdf.optimization.piece", locale)))
            .append(th(msg("pdf.optimization.area", locale)))
            .append(th(msg("pdf.color", locale)))
            .append(th(msg("pdf.qr", locale)))
            .append("</tr></thead><tbody>");

        for (OptimizationPlacementReportResponse placement : nullSafePlacements(placements)) {
            String sourceLabel = buildPlacementSourceLabel(placement, sourcesByKey, locale);
            String piece = buildPieceLabel(placement);
            String color = joinColor(placement != null ? placement.getPlacementColorName() : null,
                placement != null ? placement.getPlacementColorHexCode() : null);
            html.append("<tr>")
                .append(td(sourceLabel))
                .append(td(formatInteger(placement != null ? placement.getXMm() : null)))
                .append(td(formatInteger(placement != null ? placement.getYMm() : null)))
                .append(td(formatInteger(placement != null ? placement.getWidthMm() : null)))
                .append(td(formatInteger(placement != null ? placement.getHeightMm() : null)))
                .append(td(localizeRotation(placement != null ? placement.getRotated() : null, locale)))
                .append(td(piece))
                .append(td(formatNumber(placement != null ? placement.getAreaM2() : null)))
                .append(td(color))
                .append(tdQr(placement != null ? placement.getQrCode() : null, msg("pdf.qr", locale)))
                .append("</tr>");
        }

        if (placements == null || placements.isEmpty()) {
            html.append("<tr><td colspan=\"10\" class=\"muted\">")
                .append(escape(msg("pdf.optimization.noPlacements", locale)))
                .append("</td></tr>");
        }

        html.append("</tbody></table>");
        return html.toString();
    }

    private String buildPlacementSourceLabel(OptimizationPlacementReportResponse placement,
                                             Map<String, OptimizationSourceReportResponse> sourcesByKey,
                                             Locale locale) {
        if (placement == null) {
            return msg("pdf.notAvailable", locale);
        }
        String key = placement.getSourceType() + "-" + placement.getSourceId();
        OptimizationSourceReportResponse source = sourcesByKey.get(key);
        String sourceLabel = source != null && source.getReference() != null && !source.getReference().isBlank()
            ? source.getReference()
            : placement.getSourceId();
        return localizeSourceType(placement.getSourceType(), locale) + " " + safeShortId(sourceLabel);
    }

    private String safeShortId(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }
        return value.length() > 12 ? value.substring(0, 12) : value;
    }

    private String buildPieceLabel(OptimizationPlacementReportResponse placement) {
        if (placement == null || placement.getPieceWidthMm() == null || placement.getPieceLengthM() == null) {
            return "-";
        }
        return placement.getPieceWidthMm() + "mm x " + formatNumber(placement.getPieceLengthM()) + "m";
    }

    private String localizeRotation(Boolean rotated, Locale locale) {
        if (rotated == null) {
            return msg("pdf.notAvailable", locale);
        }
        return rotated ? msg("pdf.optimization.yes", locale) : msg("pdf.optimization.no", locale);
    }

    private String localizeSourceLabel(OptimizationSourceReportResponse source, Locale locale) {
        if (source == null) {
            return msg("pdf.notAvailable", locale);
        }
        return localizeSourceType(source.getSourceType(), locale);
    }

    private String localizeSourceType(String sourceType, Locale locale) {
        if ("ROLL".equalsIgnoreCase(sourceType)) {
            return msg("pdf.roll", locale);
        }
        if ("WASTE_PIECE".equalsIgnoreCase(sourceType)) {
            return msg("pdf.wastePiece", locale);
        }
        return sourceType != null ? sourceType : msg("pdf.notAvailable", locale);
    }

    private String joinColor(String colorName, String colorHexCode) {
        String name = colorName != null ? colorName.trim() : "";
        String hex = colorHexCode != null ? colorHexCode.trim() : "";
        if (!name.isEmpty() && !hex.isEmpty()) {
            return name + " / " + hex;
        }
        if (!name.isEmpty()) {
            return name;
        }
        if (!hex.isEmpty()) {
            return hex;
        }
        return "-";
    }

    private String td(String value) {
        return "<td>" + escape(value != null ? value : "-") + "</td>";
    }

    private String tdQr(String qr, String alt) {
        if (qr != null && qr.startsWith("data:image/")) {
            return "<td><img class=\"qr\" src=\"" + escapeAttribute(qr) + "\" alt=\"" + escapeAttribute(alt) + "\" /></td>";
        }
        return td(qr);
    }

    private String th(String value) {
        return "<th>" + escape(value) + "</th>";
    }

    private List<String> sliceSvgForPrint(String rawSvg) {
        int maxPages = 3;
        if (rawSvg == null || rawSvg.isBlank()) {
            return List.of();
        }
        ParsedSvg parsed = parseSvg(rawSvg);
        if (parsed == null || parsed.viewBoxWidth <= 0 || parsed.viewBoxHeight <= 0) {
            String normalized = normalizeSvg(rawSvg);
            return normalized != null ? List.of(normalized) : List.of();
        }

        double ratioW = parsed.viewBoxWidth / parsed.viewBoxHeight;
        double ratioH = parsed.viewBoxHeight / parsed.viewBoxWidth;
        double maxAspectRatio = 12.0; // keep layout page count low by default

        if (ratioW <= maxAspectRatio && ratioH <= maxAspectRatio) {
            return List.of(buildSvg(parsed, parsed.minX, parsed.minY, parsed.viewBoxWidth, parsed.viewBoxHeight));
        }

        boolean sliceAlongX = ratioW >= ratioH;
        double dominantRatio = sliceAlongX ? ratioW : ratioH;
        int desiredSlices = (int) Math.ceil(dominantRatio / maxAspectRatio);
        int slices = Math.min(Math.max(2, desiredSlices), Math.max(1, maxPages));

        if (sliceAlongX) {
            double sliceWidth = parsed.viewBoxWidth / slices;
            return java.util.stream.IntStream.range(0, slices)
                .mapToObj(i -> buildSvg(parsed, parsed.minX + i * sliceWidth, parsed.minY, sliceWidth, parsed.viewBoxHeight))
                .toList();
        }

        double sliceHeight = parsed.viewBoxHeight / slices;
        return java.util.stream.IntStream.range(0, slices)
            .mapToObj(i -> buildSvg(parsed, parsed.minX, parsed.minY + i * sliceHeight, parsed.viewBoxWidth, sliceHeight))
            .toList();
    }

    private static class ParsedSvg {
        private final String svgAttributes;
        private final String innerContent;
        private final double minX;
        private final double minY;
        private final double viewBoxWidth;
        private final double viewBoxHeight;

        private ParsedSvg(String svgAttributes, String innerContent, double minX, double minY, double viewBoxWidth, double viewBoxHeight) {
            this.svgAttributes = svgAttributes;
            this.innerContent = innerContent;
            this.minX = minX;
            this.minY = minY;
            this.viewBoxWidth = viewBoxWidth;
            this.viewBoxHeight = viewBoxHeight;
        }
    }

    private ParsedSvg parseSvg(String rawSvg) {
        int svgStart = rawSvg.indexOf("<svg");
        if (svgStart < 0) {
            return null;
        }
        int openEnd = rawSvg.indexOf(">", svgStart);
        if (openEnd < 0) {
            return null;
        }
        int closeStart = rawSvg.lastIndexOf("</svg>");
        if (closeStart < 0 || closeStart <= openEnd) {
            return null;
        }

        String openTag = rawSvg.substring(svgStart, openEnd + 1);
        String inner = rawSvg.substring(openEnd + 1, closeStart);
        String attrs = openTag
            .replaceFirst("^<svg", "")
            .replaceFirst(">$", "");

        String viewBox = extractAttribute(attrs, "viewBox");
        if (viewBox == null) {
            return null;
        }
        String[] parts = viewBox.trim().split("[,\\s]+");
        if (parts.length != 4) {
            return null;
        }
        try {
            double minX = Double.parseDouble(parts[0]);
            double minY = Double.parseDouble(parts[1]);
            double w = Double.parseDouble(parts[2]);
            double h = Double.parseDouble(parts[3]);
            return new ParsedSvg(attrs, inner, minX, minY, w, h);
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private String buildSvg(ParsedSvg parsed, double minX, double minY, double width, double height) {
        String cleanedAttrs = parsed.svgAttributes
            .replaceAll("\\s+width=\"[^\"]*\"", "")
            .replaceAll("\\s+height=\"[^\"]*\"", "")
            .replaceAll("\\s+preserveAspectRatio=\"[^\"]*\"", "");
        String viewBox = " viewBox=\"" + minX + " " + minY + " " + width + " " + height + "\"";
        return "<svg" + cleanedAttrs + viewBox + " preserveAspectRatio=\"xMidYMid meet\">" + parsed.innerContent + "</svg>";
    }

    private String extractAttribute(String attrs, String name) {
        var matcher = java.util.regex.Pattern.compile(name + "\\s*=\\s*\"([^\"]+)\"").matcher(attrs);
        return matcher.find() ? matcher.group(1) : null;
    }

    private String normalizeSvg(String rawSvg) {
        if (rawSvg == null || rawSvg.isBlank()) {
            return null;
        }
        return rawSvg
            .replaceFirst("<svg([^>]*?)>", "<svg$1 preserveAspectRatio=\"xMidYMid meet\">")
            .replaceAll("\\s+width=\"[^\"]*\"", "")
            .replaceAll("\\s+height=\"[^\"]*\"", "");
    }

    private String normalizeVariant(String variant) {
        if (variant == null || variant.isBlank()) {
            return "ACTUAL";
        }
        String value = variant.trim().toUpperCase(Locale.ROOT);
        return "SUGGESTED".equals(value) ? "SUGGESTED" : "ACTUAL";
    }

    private List<OptimizationSourceReportResponse> nullSafeSources(List<OptimizationSourceReportResponse> sources) {
        return sources != null ? sources : List.of();
    }

    private List<OptimizationPlacementReportResponse> nullSafePlacements(List<OptimizationPlacementReportResponse> placements) {
        return placements != null ? placements : List.of();
    }

    private String formatInteger(Integer value) {
        return value != null ? String.valueOf(value) : "-";
    }

    private String formatNumber(Number value) {
        if (value == null) {
            return "-";
        }
        if (value instanceof BigDecimal decimal) {
            return decimal.stripTrailingZeros().toPlainString();
        }
        return String.valueOf(value);
    }

    private boolean isArabic(Locale locale) {
        return locale != null && "ar".equalsIgnoreCase(locale.getLanguage());
    }

    private String msg(String key, Locale locale) {
        return messageSource.getMessage(key, null, key, locale);
    }

    private String escape(String value) {
        if (value == null) {
            return "";
        }
        return value
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace("\"", "&quot;")
            .replace("'", "&#39;");
    }

    private String escapeAttribute(String value) {
        return escape(value);
    }
}
