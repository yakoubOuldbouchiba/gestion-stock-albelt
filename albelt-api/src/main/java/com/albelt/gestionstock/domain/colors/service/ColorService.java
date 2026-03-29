package com.albelt.gestionstock.domain.colors.service;

import com.albelt.gestionstock.domain.colors.dto.ColorRequest;
import com.albelt.gestionstock.domain.colors.entity.Color;
import com.albelt.gestionstock.domain.colors.mapper.ColorMapper;
import com.albelt.gestionstock.domain.colors.repository.ColorRepository;
import com.albelt.gestionstock.shared.exceptions.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class ColorService {

    private final ColorRepository colorRepository;
    private final ColorMapper colorMapper;

    public Color create(ColorRequest request) {
        log.info("Creating color: {}", request.getName());

        if (colorRepository.findByNameIgnoreCase(request.getName()).isPresent()) {
            throw new IllegalArgumentException("Color with name '" + request.getName() + "' already exists");
        }

        Color color = colorMapper.toEntity(request);
        return colorRepository.save(color);
    }

    public Color update(UUID id, ColorRequest request) {
        log.info("Updating color: {}", id);

        Color existing = getById(id);

        if (request.getName() != null) {
            colorRepository.findByNameIgnoreCase(request.getName())
                    .filter(found -> !found.getId().equals(id))
                    .ifPresent(found -> {
                        throw new IllegalArgumentException("Color with name '" + request.getName() + "' already exists");
                    });
        }

        Color updated = colorMapper.updateEntity(existing, request);
        return colorRepository.save(updated);
    }

    @Transactional(readOnly = true)
    public Color getById(UUID id) {
        return colorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Color not found: " + id));
    }

    @Transactional(readOnly = true)
    public Color getByName(String name) {
        return colorRepository.findByNameIgnoreCase(name)
                .orElseThrow(() -> new ResourceNotFoundException("Color not found: " + name));
    }

    @Transactional(readOnly = true)
    public List<Color> getAll() {
        return colorRepository.findAll().stream()
                .sorted(Comparator.comparing(Color::getName))
                .toList();
    }

    public void delete(UUID id) {
        log.info("Deleting color: {}", id);
        Color color = getById(id);
        colorRepository.delete(color);
    }
}
