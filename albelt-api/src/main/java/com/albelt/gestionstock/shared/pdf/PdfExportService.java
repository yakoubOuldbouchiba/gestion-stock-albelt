package com.albelt.gestionstock.shared.pdf;

import com.albelt.gestionstock.domain.purchasebons.dto.PurchaseBonItemResponse;
import com.albelt.gestionstock.domain.purchasebons.dto.PurchaseBonResponse;
import com.albelt.gestionstock.domain.rolls.dto.RollMovementDTO;
import com.albelt.gestionstock.domain.rolls.dto.TransferBonDTO;
import com.ibm.icu.text.ArabicShaping;
import com.ibm.icu.text.ArabicShapingException;
import com.ibm.icu.text.Bidi;
import com.lowagie.text.*;
import com.lowagie.text.pdf.BaseFont;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.MessageSource;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.FormatStyle;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PdfExportService {

    private final MessageSource messageSource;

    public byte[] generatePurchaseBonPdf(PurchaseBonResponse bon, Locale locale) {
        try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4, 36, 36, 36, 36);
            PdfWriter writer = PdfWriter.getInstance(document, outputStream);
            applyViewerPreferences(writer, locale);
            document.open();

            FontSet fonts = resolveFonts(locale);
            addCompanyHeader(document, locale, fonts);
            addHeader(document,
                    msg("pdf.purchase.title", locale),
                    msg("pdf.purchase.subtitle", locale),
                    locale,
                    fonts);

            PdfPTable summary = createTable(locale, 2);
            addLabelValue(summary, msg("pdf.reference", locale), bon.getReference(), locale, fonts);
            addLabelValue(summary, msg("pdf.date", locale), formatDate(bon.getBonDate(), locale), locale, fonts);
            addLabelValue(summary, msg("pdf.supplier", locale), bon.getSupplierName(), locale, fonts);
            addLabelValue(summary, msg("pdf.status", locale), bon.getStatus() != null ? bon.getStatus().name() : null, locale, fonts);
            addLabelValue(summary, msg("pdf.validatedAt", locale), formatDateTime(bon.getValidatedAt(), locale), locale, fonts);
            addLabelValue(summary, msg("pdf.createdBy", locale), bon.getCreatedBy() != null ? bon.getCreatedBy().getUsername() : null, locale, fonts);
            document.add(summary);

            addSectionTitle(document, msg("pdf.items", locale), locale, fonts);
            PdfPTable itemsTable = createTable(locale, new float[]{0.7f, 1.3f, 1.6f, 0.9f, 1.1f, 1.1f, 1.1f});
            addHeaderCell(itemsTable, "#", locale, fonts);
            addHeaderCell(itemsTable, msg("pdf.material", locale), locale, fonts);
            addHeaderCell(itemsTable, msg("pdf.dimensions", locale), locale, fonts);
            addHeaderCell(itemsTable, msg("pdf.quantity", locale), locale, fonts);
            addHeaderCell(itemsTable, msg("pdf.color", locale), locale, fonts);
            addHeaderCell(itemsTable, msg("pdf.workshop", locale), locale, fonts);
            addHeaderCell(itemsTable, msg("pdf.qr", locale), locale, fonts);

            List<PurchaseBonItemResponse> items = bon.getItems() != null ? bon.getItems() : List.of();
            for (PurchaseBonItemResponse item : items) {
                addBodyCell(itemsTable, String.valueOf(item.getLineNumber()), locale, fonts);
                addBodyCell(itemsTable, enumOrText(item.getMaterialType()), locale, fonts);
                addBodyCell(itemsTable, buildDimensions(item.getWidthMm(), item.getLengthM(), item.getAreaM2()), locale, fonts);
                addBodyCell(itemsTable, String.valueOf(item.getQuantity()), locale, fonts);
                addBodyCell(itemsTable, item.getColorName(), locale, fonts);
                addBodyCell(itemsTable, item.getAltierLibelle(), locale, fonts);
                addBodyCell(itemsTable, item.getQrCode(), locale, fonts);
            }
            document.add(itemsTable);

            addSectionTitle(document, msg("pdf.notes", locale), locale, fonts);
            document.add(createNotesParagraph(bon.getNotes(), locale, fonts));
            document.close();
            return outputStream.toByteArray();
        } catch (Exception ex) {
            log.error("Failed to generate purchase bon PDF for {}", bon.getId(), ex);
            throw new IllegalStateException("Failed to generate purchase bon PDF", ex);
        }
    }

    public byte[] generateTransferBonPdf(TransferBonDTO bon, Locale locale) {
        try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4, 36, 36, 36, 36);
            PdfWriter writer = PdfWriter.getInstance(document, outputStream);
            applyViewerPreferences(writer, locale);
            document.open();

            FontSet fonts = resolveFonts(locale);
            addCompanyHeader(document, locale, fonts);
            addHeader(document,
                    msg("pdf.transfer.title", locale),
                    msg("pdf.transfer.subtitle", locale),
                    locale,
                    fonts);

            PdfPTable summary = createTable(locale, 2);
            addLabelValue(summary, msg("pdf.fromWorkshop", locale), bon.getFromAltier() != null ? bon.getFromAltier().getLibelle() : null, locale, fonts);
            addLabelValue(summary, msg("pdf.toWorkshop", locale), bon.getToAltier() != null ? bon.getToAltier().getLibelle() : null, locale, fonts);
            addLabelValue(summary, msg("pdf.exitDate", locale), formatDateTime(bon.getDateSortie(), locale), locale, fonts);
            addLabelValue(summary, msg("pdf.entryDate", locale), formatDateTime(bon.getDateEntree(), locale), locale, fonts);
            addLabelValue(summary, msg("pdf.status", locale), isDelivered(bon) ? msg("pdf.delivered", locale) : msg("pdf.pending", locale), locale, fonts);
            addLabelValue(summary, msg("pdf.operator", locale), bon.getOperator() != null ? bon.getOperator().getUsername() : null, locale, fonts);
            document.add(summary);

            addSectionTitle(document, msg("pdf.items", locale), locale, fonts);
            PdfPTable movementsTable = createTable(locale, new float[]{0.7f, 1.0f, 1.9f, 1.2f, 1.2f, 1.0f});
            addHeaderCell(movementsTable, "#", locale, fonts);
            addHeaderCell(movementsTable, msg("pdf.type", locale), locale, fonts);
            addHeaderCell(movementsTable, msg("pdf.element", locale), locale, fonts);
            addHeaderCell(movementsTable, msg("pdf.exitDate", locale), locale, fonts);
            addHeaderCell(movementsTable, msg("pdf.entryDate", locale), locale, fonts);
            addHeaderCell(movementsTable, msg("pdf.status", locale), locale, fonts);

            List<RollMovementDTO> movements = bon.getMovements() != null ? bon.getMovements() : List.of();
            int index = 1;
            for (RollMovementDTO movement : movements) {
                addBodyCell(movementsTable, String.valueOf(index++), locale, fonts);
                addBodyCell(movementsTable, movement.getRollId() != null ? msg("pdf.roll", locale) : msg("pdf.wastePiece", locale), locale, fonts);
                addBodyCell(movementsTable, buildMovementLabel(movement), locale, fonts);
                addBodyCell(movementsTable, formatDateTime(movement.getDateSortie(), locale), locale, fonts);
                addBodyCell(movementsTable, formatDateTime(movement.getDateEntree(), locale), locale, fonts);
                addBodyCell(movementsTable, movement.getDateEntree() != null ? msg("pdf.delivered", locale) : msg("pdf.pending", locale), locale, fonts);
            }
            document.add(movementsTable);

            addSectionTitle(document, msg("pdf.notes", locale), locale, fonts);
            document.add(createNotesParagraph(bon.getNotes(), locale, fonts));
            document.close();
            return outputStream.toByteArray();
        } catch (Exception ex) {
            log.error("Failed to generate transfer bon PDF for {}", bon.getId(), ex);
            throw new IllegalStateException("Failed to generate transfer bon PDF", ex);
        }
    }

    private void applyViewerPreferences(PdfWriter writer, Locale locale) {
        // Table/cell run direction is applied below; no viewer preference needed here.
    }
    

    /*private void addHeader(Document document, String title, String subtitle, Locale locale, FontSet fonts) throws DocumentException {
        Paragraph titleParagraph = new Paragraph(title, fonts.title());
        titleParagraph.setAlignment(isArabic(locale) ? Element.ALIGN_RIGHT : Element.ALIGN_LEFT);
        document.add(titleParagraph);

        Paragraph subtitleParagraph = new Paragraph(subtitle, fonts.normal());
        subtitleParagraph.setSpacingAfter(14f);
        subtitleParagraph.setAlignment(isArabic(locale) ? Element.ALIGN_RIGHT : Element.ALIGN_LEFT);
        document.add(subtitleParagraph);
    }*/

    private Phrase phrase(String value, Font font, Locale locale) {
        String text = orDash(value);
        return new Phrase(isArabic(locale) ? shapeArabic(text) : text, font);
    }

    /*private void addSectionTitle(Document document, String title, Locale locale, FontSet fonts) throws DocumentException {
        Paragraph paragraph = new Paragraph(title, fonts.section());
        paragraph.setSpacingBefore(10f);
        paragraph.setSpacingAfter(8f);
        paragraph.setAlignment(isArabic(locale) ? Element.ALIGN_RIGHT : Element.ALIGN_LEFT);
        document.add(paragraph);
    }*/

    private void addSectionTitle(Document document, String title, Locale locale, FontSet fonts)
            throws DocumentException {

        Paragraph paragraph = new Paragraph(
                phrase(title, fonts.section(), locale)
        );

        paragraph.setSpacingBefore(10f);
        paragraph.setSpacingAfter(8f);
        paragraph.setAlignment(isArabic(locale) ? Element.ALIGN_RIGHT : Element.ALIGN_LEFT);

        document.add(paragraph);
    }

    private Paragraph createNotesParagraph(String notes, Locale locale, FontSet fonts) {
        Paragraph paragraph = new Paragraph(orDash(notes), fonts.normal());
        paragraph.setAlignment(isArabic(locale) ? Element.ALIGN_RIGHT : Element.ALIGN_LEFT);
        paragraph.setSpacingAfter(8f);
        return paragraph;
    }

    private PdfPTable createTable(Locale locale, int columns) {
        PdfPTable table = new PdfPTable(columns);
        configureTable(table, locale);
        return table;
    }

    private PdfPTable createTable(Locale locale, float[] widths) throws DocumentException {
        PdfPTable table = new PdfPTable(widths.length);
        table.setWidths(widths);
        configureTable(table, locale);
        return table;
    }

    private void configureTable(PdfPTable table, Locale locale) {
        table.setWidthPercentage(100f);
        table.setSpacingAfter(10f);
        if (isArabic(locale)) {
            table.setRunDirection(PdfWriter.RUN_DIRECTION_RTL);
        }
    }


    private void addLabelValue(PdfPTable table, String label, String value, Locale locale, FontSet fonts) {
        addBodyCell(table, label, locale, fonts.bold(), true);
        addBodyCell(table, value, locale, fonts.normal(), false);
    }

    private void addHeaderCell(PdfPTable table, String value, Locale locale, FontSet fonts) {
        PdfPCell cell = new PdfPCell(new Phrase(orDash(value), fonts.bold()));
        styleCell(cell, locale, true);
        table.addCell(cell);
    }

    private void addBodyCell(PdfPTable table, String value, Locale locale, FontSet fonts) {
        addBodyCell(table, value, locale, fonts.normal(), false);
    }

    private void addBodyCell(PdfPTable table, String value, Locale locale, Font font, boolean shaded) {
        PdfPCell cell = new PdfPCell(new Phrase(orDash(value), font));
        styleCell(cell, locale, shaded);
        table.addCell(cell);
    }

    private void styleCell(PdfPCell cell, Locale locale, boolean shaded) {
        cell.setPadding(6f);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        cell.setHorizontalAlignment(isArabic(locale) ? Element.ALIGN_RIGHT : Element.ALIGN_LEFT);
        if (isArabic(locale)) {
            cell.setRunDirection(PdfWriter.RUN_DIRECTION_RTL);
        }
        if (shaded) {
            cell.setBackgroundColor(new java.awt.Color(230, 236, 242));
        }
        cell.setBorderColor(new java.awt.Color(203, 213, 225));
    }

    private FontSet resolveFonts(Locale locale) {
        BaseFont baseFont = loadBestFont(locale);
        return new FontSet(
                new Font(baseFont, 18, Font.BOLD),
                new Font(baseFont, 12, Font.BOLD),
                new Font(baseFont, 10, Font.NORMAL),
                new Font(baseFont, 10, Font.BOLD)
        );
    }

    private BaseFont loadBestFont(Locale locale) {
        List<String> candidates = isArabic(locale)
                ? List.of(
                        "C:/Windows/Fonts/arial.ttf",
                        "C:/Windows/Fonts/tahoma.ttf",
                        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
                        "/usr/share/fonts/truetype/noto/NotoSansArabic-Regular.ttf",
                        "/usr/share/fonts/truetype/freefont/FreeSans.ttf"
                )
                : List.of(
                        "C:/Windows/Fonts/arial.ttf",
                        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
                );

        for (String candidate : candidates) {
            try {
                File file = new File(candidate);
                if (file.exists()) {
                    return BaseFont.createFont(file.getAbsolutePath(), BaseFont.IDENTITY_H, BaseFont.EMBEDDED);
                }
            } catch (Exception ignored) {
                // Try next candidate.
            }
        }

        try {
            return BaseFont.createFont(BaseFont.HELVETICA, BaseFont.CP1252, BaseFont.NOT_EMBEDDED);
        } catch (Exception ex) {
            throw new IllegalStateException("Unable to initialize PDF font", ex);
        }
    }

    private String buildDimensions(Integer widthMm, BigDecimal lengthM, BigDecimal areaM2) {
        return orDash(widthMm != null ? widthMm + " mm x " + decimal(lengthM) + " m (" + decimal(areaM2) + " m2)" : null);
    }

    private String buildMovementLabel(RollMovementDTO movement) {
        UUID itemId = movement.getRollId() != null ? movement.getRollId() : movement.getWastePieceId();
        return itemId != null ? itemId.toString() : null;
    }

    private boolean isDelivered(TransferBonDTO bon) {
        return bon.getDateEntree() != null || Boolean.TRUE.equals(bon.getStatusEntree());
    }

    private String decimal(BigDecimal value) {
        return value != null ? value.stripTrailingZeros().toPlainString() : msg("pdf.notAvailable", Locale.ENGLISH);
    }

    private String formatDate(LocalDate value, Locale locale) {
        if (value == null) return msg("pdf.notAvailable", locale);
        return value.format(DateTimeFormatter.ofLocalizedDate(FormatStyle.MEDIUM).withLocale(locale));
    }

    private String formatDateTime(LocalDateTime value, Locale locale) {
        if (value == null) return msg("pdf.notAvailable", locale);
        return value.format(DateTimeFormatter.ofLocalizedDateTime(FormatStyle.MEDIUM).withLocale(locale));
    }

    private String orDash(String value) {
        return value == null || value.isBlank() ? "-" : value;
    }

    private String enumOrText(Object value) {
        return value != null ? value.toString() : null;
    }

    private String msg(String key, Locale locale) {
        return messageSource.getMessage(key, null, locale);
    }

    private boolean isArabic(Locale locale) {
        return locale != null && "ar".equalsIgnoreCase(locale.getLanguage());
    }

    private record FontSet(Font title, Font section, Font normal, Font bold) {}

    private String shapeArabic(String text) {
        if (text == null) return null;

        try {
            ArabicShaping shaper = new ArabicShaping(ArabicShaping.LETTERS_SHAPE);
            String shaped = shaper.shape(text);

            Bidi bidi = new Bidi(shaped, Bidi.DIRECTION_RIGHT_TO_LEFT);
            return bidi.writeReordered(Bidi.DO_MIRRORING);

        } catch (ArabicShapingException e) {
            return text;
        }
    }

    private void addHeader(Document document, String title, String subtitle, Locale locale, FontSet fonts)
            throws DocumentException {

        boolean rtl = isArabic(locale);

        Paragraph titleParagraph = new Paragraph(
                rtl ? shapeArabic(title) : title,
                fonts.title()
        );
        titleParagraph.setAlignment(rtl ? Element.ALIGN_RIGHT : Element.ALIGN_LEFT);
        document.add(titleParagraph);

        Paragraph subtitleParagraph = new Paragraph(
                rtl ? shapeArabic(subtitle) : subtitle,
                fonts.normal()
        );
        subtitleParagraph.setSpacingAfter(14f);
        subtitleParagraph.setAlignment(rtl ? Element.ALIGN_RIGHT : Element.ALIGN_LEFT);
        document.add(subtitleParagraph);
    }

    private void addCompanyHeader(Document document, Locale locale, FontSet fonts) throws DocumentException {

        boolean rtl = isArabic(locale);

        Paragraph company = new Paragraph();

        Paragraph name = new Paragraph(
                rtl ? shapeArabic("ALBELT DZ") : "ALBELT DZ",
                fonts.title()
        );
        name.setAlignment(Element.ALIGN_CENTER);

        Paragraph email = new Paragraph(
                rtl ? shapeArabic("Contact@albelt-dz.com") : "Contact@albelt-dz.com",
                fonts.normal()
        );
        email.setAlignment(Element.ALIGN_CENTER);

        Paragraph website = new Paragraph(
                rtl ? shapeArabic("https://albelt-dz.com/") : "https://albelt-dz.com/",
                fonts.normal()
        );
        website.setAlignment(Element.ALIGN_CENTER);

        company.add(name);
        company.add(email);
        company.add(website);

        company.setAlignment(Element.ALIGN_CENTER);
        company.setSpacingAfter(12f);

        document.add(company);
    }
}
