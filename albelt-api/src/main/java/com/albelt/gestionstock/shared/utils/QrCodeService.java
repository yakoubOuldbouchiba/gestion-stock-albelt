package com.albelt.gestionstock.shared.utils;

import com.albelt.gestionstock.domain.rolls.entity.Roll;
import com.albelt.gestionstock.domain.waste.entity.WastePiece;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.MultiFormatWriter;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
@Slf4j
public class QrCodeService {

    private static final int QR_SIZE = 280;
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE;

    public String generateForRoll(Roll roll) {
        return generateDataUrl(buildRollPayload(roll));
    }

    public String generateForWastePiece(WastePiece wastePiece) {
        return generateDataUrl(buildWastePayload(wastePiece));
    }

    public String generateForPlacement(String sourceType,
                                       Object sourceId,
                                       Integer xMm,
                                       Integer yMm,
                                       Integer widthMm,
                                       Integer heightMm,
                                       Boolean rotated,
                                       Integer pieceWidthMm,
                                       BigDecimal pieceLengthM,
                                       BigDecimal areaM2,
                                       String colorName,
                                       String colorHexCode) {
        Map<String, Object> values = new LinkedHashMap<>();
        values.put("entityType", "PLACED_RECTANGLE");
        values.put("sourceType", sourceType);
        values.put("sourceId", sourceId);
        values.put("xMm", xMm);
        values.put("yMm", yMm);
        values.put("widthMm", widthMm);
        values.put("heightMm", heightMm);
        values.put("rotated", rotated);
        values.put("pieceWidthMm", pieceWidthMm);
        values.put("pieceLengthM", normalizeDecimal(pieceLengthM));
        values.put("areaM2", normalizeDecimal(areaM2));
        values.put("color", colorName);
        values.put("colorHexCode", colorHexCode);
        return generateDataUrl(toPayload(values));
    }

    private String generateDataUrl(String payload) {
        try {
            Map<EncodeHintType, Object> hints = Map.of(
                    EncodeHintType.CHARACTER_SET, StandardCharsets.UTF_8.name(),
                    EncodeHintType.MARGIN, 1
            );
            BitMatrix bitMatrix = new MultiFormatWriter()
                    .encode(payload, BarcodeFormat.QR_CODE, QR_SIZE, QR_SIZE, hints);
            BufferedImage image = MatrixToImageWriter.toBufferedImage(bitMatrix);

            try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
                ImageIO.write(image, "PNG", outputStream);
                String base64 = Base64.getEncoder().encodeToString(outputStream.toByteArray());
                return "data:image/png;base64," + base64;
            }
        } catch (Exception ex) {
            log.error("Failed to generate QR code", ex);
            throw new IllegalStateException("Failed to generate QR code", ex);
        }
    }

    private String buildRollPayload(Roll roll) {
        Map<String, Object> values = new LinkedHashMap<>();
        values.put("entityType", "ROLL");
        values.put("id", roll.getId());
        values.put("reference", roll.getReference());
        values.put("receivedDate", roll.getReceivedDate() != null ? roll.getReceivedDate().format(DATE_FORMATTER) : null);
        values.put("materialType", roll.getMaterialType());
        values.put("supplier", roll.getSupplier() != null ? roll.getSupplier().getName() : null);
        values.put("altier", roll.getAltier() != null ? roll.getAltier().getLibelle() : null);
        values.put("color", roll.getColor() != null ? roll.getColor().getName() : null);
        values.put("nbPlis", roll.getNbPlis());
        values.put("thicknessMm", roll.getThicknessMm());
        values.put("widthMm", roll.getWidthMm());
        values.put("lengthM", roll.getLengthM());
        values.put("areaM2", normalizeDecimal(roll.getAreaM2()));
        values.put("status", roll.getStatus());
        return toPayload(values);
    }

    private String buildWastePayload(WastePiece wastePiece) {
        Map<String, Object> values = new LinkedHashMap<>();
        values.put("entityType", "WASTE");
        values.put("id", wastePiece.getId());
        values.put("reference", wastePiece.getReference());
        values.put("rollId", wastePiece.getRoll() != null ? wastePiece.getRoll().getId() : null);
        values.put("parentWastePieceId", wastePiece.getParentWastePiece() != null ? wastePiece.getParentWastePiece().getId() : null);
        values.put("materialType", wastePiece.getMaterialType());
        values.put("supplier", wastePiece.getRoll() != null && wastePiece.getRoll().getSupplier() != null
                ? wastePiece.getRoll().getSupplier().getName()
                : null);
        values.put("altier", wastePiece.getAltier() != null ? wastePiece.getAltier().getLibelle() : null);
        values.put("color", wastePiece.getColor() != null ? wastePiece.getColor().getName() : null);
        values.put("nbPlis", wastePiece.getNbPlis());
        values.put("thicknessMm", wastePiece.getThicknessMm());
        values.put("widthMm", wastePiece.getWidthMm());
        values.put("lengthM", wastePiece.getLengthM());
        values.put("areaM2", normalizeDecimal(wastePiece.getAreaM2()));
        values.put("wasteType", wastePiece.getWasteType());
        values.put("status", wastePiece.getStatus());
        return toPayload(values);
    }

    private String toPayload(Map<String, Object> values) {
        StringBuilder payload = new StringBuilder();
        values.forEach((key, value) -> {
            if (value != null) {
                payload.append(key).append(": ").append(value).append('\n');
            }
        });
        return payload.toString().trim();
    }

    private String normalizeDecimal(BigDecimal value) {
        return value != null ? value.stripTrailingZeros().toPlainString() : null;
    }
}
