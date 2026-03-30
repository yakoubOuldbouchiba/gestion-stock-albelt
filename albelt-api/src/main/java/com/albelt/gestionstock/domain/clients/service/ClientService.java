package com.albelt.gestionstock.domain.clients.service;

import com.albelt.gestionstock.shared.exceptions.ResourceNotFoundException;
import com.albelt.gestionstock.domain.clients.dto.*;
import com.albelt.gestionstock.domain.clients.entity.*;
import com.albelt.gestionstock.domain.clients.mapper.ClientMapper;
import com.albelt.gestionstock.domain.clients.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Client Service - Business logic for client management
 */
@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class ClientService {

    private final ClientRepository clientRepository;
    private final ClientPhoneRepository phoneRepository;
    private final ClientEmailRepository emailRepository;
    private final ClientAddressRepository addressRepository;
    private final ClientRepresentativeRepository representativeRepository;
    private final ClientMapper clientMapper;

    // ==================== CLIENT CRUD ====================

    /**
     * Create a new client
     */
    public Client create(ClientRequest request) {
        log.info("Creating new client: {}", request.getName());
        
        Client client = clientMapper.toEntity(request);
        
        // Set the client reference for all nested entities
        if (client.getPhones() != null) {
            client.getPhones().forEach(phone -> phone.setClient(client));
        }
        if (client.getEmails() != null) {
            client.getEmails().forEach(email -> email.setClient(client));
        }
        if (client.getAddresses() != null) {
            client.getAddresses().forEach(address -> address.setClient(client));
        }
        if (client.getRepresentatives() != null) {
            client.getRepresentatives().forEach(rep -> rep.setClient(client));
        }
        
        return clientRepository.save(client);
    }

    /**
     * Get client by ID
     */
    @Transactional(readOnly = true)
    public Client getById(UUID id) {
        log.info("Fetching client with ID: {}", id);
        return clientRepository.findById(id)
                .orElseThrow(() -> {
                    log.warn("Client not found: {}", id);
                    return new ResourceNotFoundException("Client not found with id: " + id);
                });
    }

    /**
     * Get all clients
     */
    @Transactional(readOnly = true)
    public List<Client> getAll() {
        log.info("Fetching all clients");
        return clientRepository.findAll();
    }

    /**
     * Get clients with pagination and optional filters
     */
    @Transactional(readOnly = true)
    public Page<Client> getAllPaged(String search, Boolean isActive, java.time.LocalDateTime fromDate,
                                    java.time.LocalDateTime toDate, int page, int size) {
        String normalizedSearch = normalizeSearch(search);
        java.time.LocalDateTime safeFromDate = fromDate != null ? fromDate : java.time.LocalDateTime.of(1970, 1, 1, 0, 0);
        java.time.LocalDateTime safeToDate = toDate != null ? toDate : java.time.LocalDateTime.of(2100, 1, 1, 0, 0);
        var pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return clientRepository.findFiltered(normalizedSearch, isActive, safeFromDate, safeToDate, pageable);
    }

    /**
     * Get all active clients
     */
    @Transactional(readOnly = true)
    public List<Client> getAllActive() {
        log.info("Fetching all active clients");
        return clientRepository.findAllActive();
    }

    /**
     * Search clients by name
     */
    @Transactional(readOnly = true)
    public List<Client> searchByName(String namePattern) {
        log.info("Searching clients by name pattern: {}", namePattern);
        return clientRepository.searchByNamePattern(namePattern);
    }

    /**
     * Update client
     */
    public Client update(UUID id, ClientRequest request) {
        log.info("Updating client with ID: {}", id);
        
        Client existing = getById(id);
        Client updated = clientMapper.updateEntity(existing, request);
        
        // Set the client reference for all nested entities
        if (updated.getPhones() != null) {
            updated.getPhones().forEach(phone -> phone.setClient(updated));
        }
        if (updated.getEmails() != null) {
            updated.getEmails().forEach(email -> email.setClient(updated));
        }
        if (updated.getAddresses() != null) {
            updated.getAddresses().forEach(address -> address.setClient(updated));
        }
        if (updated.getRepresentatives() != null) {
            updated.getRepresentatives().forEach(rep -> rep.setClient(updated));
        }
        
        return clientRepository.save(updated);
    }

    /**
     * Delete client (soft delete by marking as inactive)
     */
    public void deactivate(UUID id) {
        log.info("Deactivating client with ID: {}", id);
        
        Client client = getById(id);
        client.setIsActive(false);
        clientRepository.save(client);
    }

    /**
     * Activate a deactivated client
     */
    public void activate(UUID id) {
        log.info("Activating client with ID: {}", id);
        
        Client client = getById(id);
        client.setIsActive(true);
        clientRepository.save(client);
    }

    /**
     * Hard delete client (only if no related transactions)
     */
    public void delete(UUID id) {
        log.info("Deleting client with ID: {}", id);
        
        Client client = getById(id);
        clientRepository.delete(client);
    }

    private String normalizeSearch(String value) {
        if (value == null) return "";
        String trimmed = value.trim();
        return trimmed.isEmpty() ? "" : trimmed.toLowerCase();
    }

    // ==================== PHONE MANAGEMENT ====================

    /**
     * Add phone to client
     */
    public ClientPhone addPhone(UUID clientId, ClientPhoneRequest request) {
        log.info("Adding phone to client: {}", clientId);
        
        Client client = getById(clientId);
        ClientPhone phone = clientMapper.toPhoneEntity(request);
        phone.setClient(client);
        
        // If marking as main, unmark others
        if (request.getIsMain() != null && request.getIsMain()) {
            client.getPhones().forEach(p -> p.setIsMain(false));
        }
        
        return phoneRepository.save(phone);
    }

    /**
     * Update phone
     */
    public ClientPhone updatePhone(UUID clientId, UUID phoneId, ClientPhoneRequest request) {
        log.info("Updating phone {} for client {}", phoneId, clientId);
        
        getById(clientId); // Verify client exists
        ClientPhone phone = phoneRepository.findById(phoneId)
                .orElseThrow(() -> new ResourceNotFoundException("ClientPhone not found with id: " + phoneId));
        
        phone.setPhoneNumber(request.getPhoneNumber());
        phone.setPhoneType(request.getPhoneType());
        phone.setNotes(request.getNotes());
        
        // If marking as main, unmark others
        if (request.getIsMain() != null && request.getIsMain()) {
            phoneRepository.findByClientId(clientId).forEach(p -> {
                if (!p.getId().equals(phoneId)) {
                    p.setIsMain(false);
                    phoneRepository.save(p);
                }
            });
        }
        
        phone.setIsMain(request.getIsMain() != null ? request.getIsMain() : phone.getIsMain());
        return phoneRepository.save(phone);
    }

    /**
     * Delete phone
     */
    public void deletePhone(UUID clientId, UUID phoneId) {
        log.info("Deleting phone {} for client {}", phoneId, clientId);
        
        getById(clientId); // Verify client exists
        phoneRepository.deleteById(phoneId);
    }

    /**
     * Get all phones for client
     */
    @Transactional(readOnly = true)
    public List<ClientPhone> getClientPhones(UUID clientId) {
        getById(clientId);
        return phoneRepository.findByClientId(clientId);
    }

    // ==================== EMAIL MANAGEMENT ====================

    /**
     * Add email to client
     */
    public ClientEmail addEmail(UUID clientId, ClientEmailRequest request) {
        log.info("Adding email to client: {}", clientId);
        
        Client client = getById(clientId);
        ClientEmail email = clientMapper.toEmailEntity(request);
        email.setClient(client);
        
        // If marking as main, unmark others
        if (request.getIsMain() != null && request.getIsMain()) {
            client.getEmails().forEach(e -> e.setIsMain(false));
        }
        
        return emailRepository.save(email);
    }

    /**
     * Update email
     */
    public ClientEmail updateEmail(UUID clientId, UUID emailId, ClientEmailRequest request) {
        log.info("Updating email {} for client {}", emailId, clientId);
        
        getById(clientId); // Verify client exists
        ClientEmail email = emailRepository.findById(emailId)
                .orElseThrow(() -> new ResourceNotFoundException("ClientEmail not found with id: " + emailId));
        
        email.setEmailAddress(request.getEmailAddress());
        email.setEmailType(request.getEmailType());
        email.setNotes(request.getNotes());
        
        // If marking as main, unmark others
        if (request.getIsMain() != null && request.getIsMain()) {
            emailRepository.findByClientId(clientId).forEach(e -> {
                if (!e.getId().equals(emailId)) {
                    e.setIsMain(false);
                    emailRepository.save(e);
                }
            });
        }
        
        email.setIsMain(request.getIsMain() != null ? request.getIsMain() : email.getIsMain());
        return emailRepository.save(email);
    }

    /**
     * Delete email
     */
    public void deleteEmail(UUID clientId, UUID emailId) {
        log.info("Deleting email {} for client {}", emailId, clientId);
        
        getById(clientId); // Verify client exists
        emailRepository.deleteById(emailId);
    }

    /**
     * Get all emails for client
     */
    @Transactional(readOnly = true)
    public List<ClientEmail> getClientEmails(UUID clientId) {
        getById(clientId);
        return emailRepository.findByClientId(clientId);
    }

    // ==================== ADDRESS MANAGEMENT ====================

    /**
     * Add address to client
     */
    public ClientAddress addAddress(UUID clientId, ClientAddressRequest request) {
        log.info("Adding address to client: {}", clientId);
        
        Client client = getById(clientId);
        ClientAddress address = clientMapper.toAddressEntity(request);
        address.setClient(client);
        
        // If marking as main, unmark others
        if (request.getIsMain() != null && request.getIsMain()) {
            client.getAddresses().forEach(a -> a.setIsMain(false));
        }
        
        return addressRepository.save(address);
    }

    /**
     * Update address
     */
    public ClientAddress updateAddress(UUID clientId, UUID addressId, ClientAddressRequest request) {
        log.info("Updating address {} for client {}", addressId, clientId);
        
        getById(clientId); // Verify client exists
        ClientAddress address = addressRepository.findById(addressId)
                .orElseThrow(() -> new ResourceNotFoundException("ClientAddress not found with id: " + addressId));
        
        address.setStreetAddress(request.getStreetAddress());
        address.setCity(request.getCity());
        address.setPostalCode(request.getPostalCode());
        address.setCountry(request.getCountry());
        address.setAddressType(request.getAddressType());
        address.setNotes(request.getNotes());
        
        // If marking as main, unmark others
        if (request.getIsMain() != null && request.getIsMain()) {
            addressRepository.findByClientId(clientId).forEach(a -> {
                if (!a.getId().equals(addressId)) {
                    a.setIsMain(false);
                    addressRepository.save(a);
                }
            });
        }
        
        address.setIsMain(request.getIsMain() != null ? request.getIsMain() : address.getIsMain());
        return addressRepository.save(address);
    }

    /**
     * Delete address
     */
    public void deleteAddress(UUID clientId, UUID addressId) {
        log.info("Deleting address {} for client {}", addressId, clientId);
        
        getById(clientId); // Verify client exists
        addressRepository.deleteById(addressId);
    }

    /**
     * Get all addresses for client
     */
    @Transactional(readOnly = true)
    public List<ClientAddress> getClientAddresses(UUID clientId) {
        getById(clientId);
        return addressRepository.findByClientId(clientId);
    }

    // ==================== REPRESENTATIVE MANAGEMENT ====================

    /**
     * Add representative to client
     */
    public ClientRepresentative addRepresentative(UUID clientId, ClientRepresentativeRequest request) {
        log.info("Adding representative to client: {}", clientId);
        
        Client client = getById(clientId);
        ClientRepresentative rep = clientMapper.toRepresentativeEntity(request);
        rep.setClient(client);
        
        // If marking as primary, unmark others
        if (request.getIsPrimary() != null && request.getIsPrimary()) {
            client.getRepresentatives().forEach(r -> r.setIsPrimary(false));
        }
        
        return representativeRepository.save(rep);
    }

    /**
     * Update representative
     */
    public ClientRepresentative updateRepresentative(UUID clientId, UUID repId, ClientRepresentativeRequest request) {
        log.info("Updating representative {} for client {}", repId, clientId);
        
        getById(clientId); // Verify client exists
        ClientRepresentative rep = representativeRepository.findById(repId)
                .orElseThrow(() -> new ResourceNotFoundException("ClientRepresentative not found with id: " + repId));
        
        rep.setName(request.getName());
        rep.setPosition(request.getPosition());
        rep.setPhone(request.getPhone());
        rep.setEmail(request.getEmail());
        rep.setNotes(request.getNotes());
        
        // If marking as primary, unmark others
        if (request.getIsPrimary() != null && request.getIsPrimary()) {
            representativeRepository.findByClientId(clientId).forEach(r -> {
                if (!r.getId().equals(repId)) {
                    r.setIsPrimary(false);
                    representativeRepository.save(r);
                }
            });
        }
        
        rep.setIsPrimary(request.getIsPrimary() != null ? request.getIsPrimary() : rep.getIsPrimary());
        return representativeRepository.save(rep);
    }

    /**
     * Delete representative
     */
    public void deleteRepresentative(UUID clientId, UUID repId) {
        log.info("Deleting representative {} for client {}", repId, clientId);
        
        getById(clientId); // Verify client exists
        representativeRepository.deleteById(repId);
    }

    /**
     * Get all representatives for client
     */
    @Transactional(readOnly = true)
    public List<ClientRepresentative> getClientRepresentatives(UUID clientId) {
        getById(clientId);
        return representativeRepository.findByClientId(clientId);
    }

    // ==================== STATISTICS ====================

    /**
     * Get total number of active clients
     */
    @Transactional(readOnly = true)
    public long getActiveClientCount() {
        return clientRepository.countByIsActiveTrue();
    }
}
