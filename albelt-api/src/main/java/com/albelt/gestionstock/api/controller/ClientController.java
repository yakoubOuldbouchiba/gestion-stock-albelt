package com.albelt.gestionstock.api.controller;

import com.albelt.gestionstock.api.response.ApiResponse;
import com.albelt.gestionstock.api.response.PagedResponse;
import com.albelt.gestionstock.domain.clients.dto.*;
import com.albelt.gestionstock.domain.clients.mapper.ClientMapper;
import com.albelt.gestionstock.domain.clients.service.ClientService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Client Controller - REST endpoints for client management
 */
@RestController
@RequestMapping("/api/clients")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Clients", description = "Client management API")
public class ClientController {

    private final ClientService clientService;
    private final ClientMapper clientMapper;

    // ==================== CLIENT CRUD ====================

    @PostMapping
    @Operation(summary = "Create a new client", description = "Creates a new client with phone numbers, emails, addresses, and representatives")
    public ResponseEntity<ApiResponse<ClientResponse>> create(@Valid @RequestBody ClientRequest request) {
        log.info("POST /api/clients - Create new client: {}", request.getName());
        try {
            var client = clientService.create(request);
            var response = clientMapper.toResponse(client);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success(response, "Client created successfully"));
        } catch (Exception e) {
            log.error("Error creating client", e);
            throw e;
        }
    }

    @GetMapping
    @Operation(summary = "Get all clients", description = "Retrieves all clients including active and inactive ones")
    public ResponseEntity<ApiResponse<PagedResponse<ClientResponse>>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo) {
        log.info("GET /api/clients - Get all clients");
        try {
            Boolean isActive = parseStatus(status);
            var fromDate = parseDateStart(dateFrom);
            var toDate = parseDateEnd(dateTo);
            var clients = clientService.getAllPaged(search, isActive, fromDate, toDate, page, size);
            var responses = clientMapper.toResponseList(clients.getContent());
            var paged = PagedResponse.<ClientResponse>builder()
                    .items(responses)
                    .page(clients.getNumber())
                    .size(clients.getSize())
                    .totalElements(clients.getTotalElements())
                    .totalPages(clients.getTotalPages())
                    .build();
            return ResponseEntity.ok(ApiResponse.success(paged, "Clients retrieved successfully"));
        } catch (Exception e) {
            log.error("Error retrieving clients", e);
            throw e;
        }
    }

    @GetMapping("/active")
    @Operation(summary = "Get all active clients", description = "Retrieves only active clients")
    public ResponseEntity<ApiResponse<List<ClientResponse>>> getAllActive() {
        log.info("GET /api/clients/active - Get all active clients");
        try {
            var clients = clientService.getAllActive();
            var responses = clientMapper.toResponseList(clients);
            return ResponseEntity.ok(ApiResponse.success(responses, "Active clients retrieved successfully"));
        } catch (Exception e) {
            log.error("Error retrieving active clients", e);
            throw e;
        }
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get client by ID", description = "Retrieves a specific client with all details")
    public ResponseEntity<ApiResponse<ClientResponse>> getById(@PathVariable UUID id) {
        log.info("GET /api/clients/{} - Get client by ID", id);
        try {
            var client = clientService.getById(id);
            var response = clientMapper.toResponse(client);
            return ResponseEntity.ok(ApiResponse.success(response));
        } catch (Exception e) {
            log.error("Error retrieving client", e);
            throw e;
        }
    }

    @GetMapping("/search/name")
    @Operation(summary = "Search clients by name", description = "Searches clients using a name pattern")
    public ResponseEntity<ApiResponse<List<ClientResponse>>> searchByName(@RequestParam String name) {
        log.info("GET /api/clients/search/name?name={} - Search clients", name);
        try {
            var clients = clientService.searchByName(name);
            var responses = clientMapper.toResponseList(clients);
            return ResponseEntity.ok(ApiResponse.success(responses, "Search results retrieved successfully"));
        } catch (Exception e) {
            log.error("Error searching clients", e);
            throw e;
        }
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update client", description = "Updates an existing client and all its details")
    public ResponseEntity<ApiResponse<ClientResponse>> update(@PathVariable UUID id,
                                                              @Valid @RequestBody ClientRequest request) {
        log.info("PUT /api/clients/{} - Update client", id);
        try {
            var client = clientService.update(id, request);
            var response = clientMapper.toResponse(client);
            return ResponseEntity.ok(ApiResponse.success(response, "Client updated successfully"));
        } catch (Exception e) {
            log.error("Error updating client", e);
            throw e;
        }
    }

    @PutMapping("/{id}/deactivate")
    @Operation(summary = "Deactivate client", description = "Marks a client as inactive (soft delete)")
    public ResponseEntity<ApiResponse<String>> deactivate(@PathVariable UUID id) {
        log.info("PUT /api/clients/{}/deactivate - Deactivate client", id);
        try {
            clientService.deactivate(id);
            return ResponseEntity.ok(ApiResponse.success("Client deactivated successfully"));
        } catch (Exception e) {
            log.error("Error deactivating client", e);
            throw e;
        }
    }

    @PutMapping("/{id}/activate")
    @Operation(summary = "Activate client", description = "Marks a previously inactive client as active")
    public ResponseEntity<ApiResponse<String>> activate(@PathVariable UUID id) {
        log.info("PUT /api/clients/{}/activate - Activate client", id);
        try {
            clientService.activate(id);
            return ResponseEntity.ok(ApiResponse.success("Client activated successfully"));
        } catch (Exception e) {
            log.error("Error activating client", e);
            throw e;
        }
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete client", description = "Permanently deletes a client")
    public ResponseEntity<ApiResponse<String>> delete(@PathVariable UUID id) {
        log.info("DELETE /api/clients/{} - Delete client", id);
        try {
            clientService.delete(id);
            return ResponseEntity.ok(ApiResponse.success("Client deleted successfully"));
        } catch (Exception e) {
            log.error("Error deleting client", e);
            throw e;
        }
    }

    private Boolean parseStatus(String status) {
        if (status == null || status.trim().isEmpty()) return null;
        String normalized = status.trim().toUpperCase();
        if ("ACTIVE".equals(normalized)) return true;
        if ("INACTIVE".equals(normalized)) return false;
        return null;
    }

    private java.time.LocalDateTime parseDateStart(String value) {
        if (value == null || value.trim().isEmpty()) return null;
        return java.time.LocalDate.parse(value.trim()).atStartOfDay();
    }

    private java.time.LocalDateTime parseDateEnd(String value) {
        if (value == null || value.trim().isEmpty()) return null;
        return java.time.LocalDate.parse(value.trim()).atTime(23, 59, 59);
    }

    // ==================== PHONE MANAGEMENT ====================

    @PostMapping("/{clientId}/phones")
    @Operation(summary = "Add phone to client", description = "Adds a new phone number to a client")
    public ResponseEntity<ApiResponse<ClientPhoneResponse>> addPhone(@PathVariable UUID clientId,
                                                                     @Valid @RequestBody ClientPhoneRequest request) {
        log.info("POST /api/clients/{}/phones - Add phone", clientId);
        try {
            var phone = clientService.addPhone(clientId, request);
            var response = clientMapper.toPhoneResponse(phone);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success(response, "Phone added successfully"));
        } catch (Exception e) {
            log.error("Error adding phone", e);
            throw e;
        }
    }

    @GetMapping("/{clientId}/phones")
    @Operation(summary = "Get all phones for client", description = "Retrieves all phone numbers for a client")
    public ResponseEntity<ApiResponse<List<ClientPhoneResponse>>> getClientPhones(@PathVariable UUID clientId) {
        log.info("GET /api/clients/{}/phones - Get client phones", clientId);
        try {
            var phones = clientService.getClientPhones(clientId);
            var responses = phones.stream()
                    .map(clientMapper::toPhoneResponse)
                    .toList();
            return ResponseEntity.ok(ApiResponse.success(responses, "Client phones retrieved successfully"));
        } catch (Exception e) {
            log.error("Error retrieving client phones", e);
            throw e;
        }
    }

    @PutMapping("/{clientId}/phones/{phoneId}")
    @Operation(summary = "Update phone", description = "Updates a phone number for a client")
    public ResponseEntity<ApiResponse<ClientPhoneResponse>> updatePhone(@PathVariable UUID clientId,
                                                                        @PathVariable UUID phoneId,
                                                                        @Valid @RequestBody ClientPhoneRequest request) {
        log.info("PUT /api/clients/{}/phones/{} - Update phone", clientId, phoneId);
        try {
            var phone = clientService.updatePhone(clientId, phoneId, request);
            var response = clientMapper.toPhoneResponse(phone);
            return ResponseEntity.ok(ApiResponse.success(response, "Phone updated successfully"));
        } catch (Exception e) {
            log.error("Error updating phone", e);
            throw e;
        }
    }

    @DeleteMapping("/{clientId}/phones/{phoneId}")
    @Operation(summary = "Delete phone", description = "Removes a phone number from a client")
    public ResponseEntity<ApiResponse<String>> deletePhone(@PathVariable UUID clientId,
                                                           @PathVariable UUID phoneId) {
        log.info("DELETE /api/clients/{}/phones/{} - Delete phone", clientId, phoneId);
        try {
            clientService.deletePhone(clientId, phoneId);
            return ResponseEntity.ok(ApiResponse.success("Phone deleted successfully"));
        } catch (Exception e) {
            log.error("Error deleting phone", e);
            throw e;
        }
    }

    // ==================== EMAIL MANAGEMENT ====================

    @PostMapping("/{clientId}/emails")
    @Operation(summary = "Add email to client", description = "Adds a new email address to a client")
    public ResponseEntity<ApiResponse<ClientEmailResponse>> addEmail(@PathVariable UUID clientId,
                                                                     @Valid @RequestBody ClientEmailRequest request) {
        log.info("POST /api/clients/{}/emails - Add email", clientId);
        try {
            var email = clientService.addEmail(clientId, request);
            var response = clientMapper.toEmailResponse(email);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success(response, "Email added successfully"));
        } catch (Exception e) {
            log.error("Error adding email", e);
            throw e;
        }
    }

    @GetMapping("/{clientId}/emails")
    @Operation(summary = "Get all emails for client", description = "Retrieves all email addresses for a client")
    public ResponseEntity<ApiResponse<List<ClientEmailResponse>>> getClientEmails(@PathVariable UUID clientId) {
        log.info("GET /api/clients/{}/emails - Get client emails", clientId);
        try {
            var emails = clientService.getClientEmails(clientId);
            var responses = emails.stream()
                    .map(clientMapper::toEmailResponse)
                    .toList();
            return ResponseEntity.ok(ApiResponse.success(responses, "Client emails retrieved successfully"));
        } catch (Exception e) {
            log.error("Error retrieving client emails", e);
            throw e;
        }
    }

    @PutMapping("/{clientId}/emails/{emailId}")
    @Operation(summary = "Update email", description = "Updates an email address for a client")
    public ResponseEntity<ApiResponse<ClientEmailResponse>> updateEmail(@PathVariable UUID clientId,
                                                                        @PathVariable UUID emailId,
                                                                        @Valid @RequestBody ClientEmailRequest request) {
        log.info("PUT /api/clients/{}/emails/{} - Update email", clientId, emailId);
        try {
            var email = clientService.updateEmail(clientId, emailId, request);
            var response = clientMapper.toEmailResponse(email);
            return ResponseEntity.ok(ApiResponse.success(response, "Email updated successfully"));
        } catch (Exception e) {
            log.error("Error updating email", e);
            throw e;
        }
    }

    @DeleteMapping("/{clientId}/emails/{emailId}")
    @Operation(summary = "Delete email", description = "Removes an email address from a client")
    public ResponseEntity<ApiResponse<String>> deleteEmail(@PathVariable UUID clientId,
                                                           @PathVariable UUID emailId) {
        log.info("DELETE /api/clients/{}/emails/{} - Delete email", clientId, emailId);
        try {
            clientService.deleteEmail(clientId, emailId);
            return ResponseEntity.ok(ApiResponse.success("Email deleted successfully"));
        } catch (Exception e) {
            log.error("Error deleting email", e);
            throw e;
        }
    }

    // ==================== ADDRESS MANAGEMENT ====================

    @PostMapping("/{clientId}/addresses")
    @Operation(summary = "Add address to client", description = "Adds a new address to a client")
    public ResponseEntity<ApiResponse<ClientAddressResponse>> addAddress(@PathVariable UUID clientId,
                                                                         @Valid @RequestBody ClientAddressRequest request) {
        log.info("POST /api/clients/{}/addresses - Add address", clientId);
        try {
            var address = clientService.addAddress(clientId, request);
            var response = clientMapper.toAddressResponse(address);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success(response, "Address added successfully"));
        } catch (Exception e) {
            log.error("Error adding address", e);
            throw e;
        }
    }

    @GetMapping("/{clientId}/addresses")
    @Operation(summary = "Get all addresses for client", description = "Retrieves all addresses for a client")
    public ResponseEntity<ApiResponse<List<ClientAddressResponse>>> getClientAddresses(@PathVariable UUID clientId) {
        log.info("GET /api/clients/{}/addresses - Get client addresses", clientId);
        try {
            var addresses = clientService.getClientAddresses(clientId);
            var responses = addresses.stream()
                    .map(clientMapper::toAddressResponse)
                    .toList();
            return ResponseEntity.ok(ApiResponse.success(responses, "Client addresses retrieved successfully"));
        } catch (Exception e) {
            log.error("Error retrieving client addresses", e);
            throw e;
        }
    }

    @PutMapping("/{clientId}/addresses/{addressId}")
    @Operation(summary = "Update address", description = "Updates an address for a client")
    public ResponseEntity<ApiResponse<ClientAddressResponse>> updateAddress(@PathVariable UUID clientId,
                                                                            @PathVariable UUID addressId,
                                                                            @Valid @RequestBody ClientAddressRequest request) {
        log.info("PUT /api/clients/{}/addresses/{} - Update address", clientId, addressId);
        try {
            var address = clientService.updateAddress(clientId, addressId, request);
            var response = clientMapper.toAddressResponse(address);
            return ResponseEntity.ok(ApiResponse.success(response, "Address updated successfully"));
        } catch (Exception e) {
            log.error("Error updating address", e);
            throw e;
        }
    }

    @DeleteMapping("/{clientId}/addresses/{addressId}")
    @Operation(summary = "Delete address", description = "Removes an address from a client")
    public ResponseEntity<ApiResponse<String>> deleteAddress(@PathVariable UUID clientId,
                                                             @PathVariable UUID addressId) {
        log.info("DELETE /api/clients/{}/addresses/{} - Delete address", clientId, addressId);
        try {
            clientService.deleteAddress(clientId, addressId);
            return ResponseEntity.ok(ApiResponse.success("Address deleted successfully"));
        } catch (Exception e) {
            log.error("Error deleting address", e);
            throw e;
        }
    }

    // ==================== REPRESENTATIVE MANAGEMENT ====================

    @PostMapping("/{clientId}/representatives")
    @Operation(summary = "Add representative to client", description = "Adds a new representative/contact person to a client")
    public ResponseEntity<ApiResponse<ClientRepresentativeResponse>> addRepresentative(@PathVariable UUID clientId,
                                                                                       @Valid @RequestBody ClientRepresentativeRequest request) {
        log.info("POST /api/clients/{}/representatives - Add representative", clientId);
        try {
            var rep = clientService.addRepresentative(clientId, request);
            var response = clientMapper.toRepresentativeResponse(rep);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success(response, "Representative added successfully"));
        } catch (Exception e) {
            log.error("Error adding representative", e);
            throw e;
        }
    }

    @GetMapping("/{clientId}/representatives")
    @Operation(summary = "Get all representatives for client", description = "Retrieves all representatives for a client")
    public ResponseEntity<ApiResponse<List<ClientRepresentativeResponse>>> getClientRepresentatives(@PathVariable UUID clientId) {
        log.info("GET /api/clients/{}/representatives - Get client representatives", clientId);
        try {
            var reps = clientService.getClientRepresentatives(clientId);
            var responses = reps.stream()
                    .map(clientMapper::toRepresentativeResponse)
                    .toList();
            return ResponseEntity.ok(ApiResponse.success(responses, "Client representatives retrieved successfully"));
        } catch (Exception e) {
            log.error("Error retrieving client representatives", e);
            throw e;
        }
    }

    @PutMapping("/{clientId}/representatives/{repId}")
    @Operation(summary = "Update representative", description = "Updates a representative for a client")
    public ResponseEntity<ApiResponse<ClientRepresentativeResponse>> updateRepresentative(@PathVariable UUID clientId,
                                                                                          @PathVariable UUID repId,
                                                                                          @Valid @RequestBody ClientRepresentativeRequest request) {
        log.info("PUT /api/clients/{}/representatives/{} - Update representative", clientId, repId);
        try {
            var rep = clientService.updateRepresentative(clientId, repId, request);
            var response = clientMapper.toRepresentativeResponse(rep);
            return ResponseEntity.ok(ApiResponse.success(response, "Representative updated successfully"));
        } catch (Exception e) {
            log.error("Error updating representative", e);
            throw e;
        }
    }

    @DeleteMapping("/{clientId}/representatives/{repId}")
    @Operation(summary = "Delete representative", description = "Removes a representative from a client")
    public ResponseEntity<ApiResponse<String>> deleteRepresentative(@PathVariable UUID clientId,
                                                                    @PathVariable UUID repId) {
        log.info("DELETE /api/clients/{}/representatives/{} - Delete representative", clientId, repId);
        try {
            clientService.deleteRepresentative(clientId, repId);
            return ResponseEntity.ok(ApiResponse.success("Representative deleted successfully"));
        } catch (Exception e) {
            log.error("Error deleting representative", e);
            throw e;
        }
    }
}
