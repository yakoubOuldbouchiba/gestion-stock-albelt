/**
 * API Response Types
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
  timestamp: string;
}

/**
 * Paged API Response
 */
export interface PagedResponse<T> {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

/**
 * Supplier Types
 */
export interface Supplier {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  contactPerson: string;
  email: string;
  phone: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierRequest {
  name: string;
  address: string;
  city: string;
  country: string;
  contactPerson: string;
  email: string;
  phone: string;
}

/**
 * Altier Types
 */
export interface Altier {
  id: string;
  libelle: string;
  adresse: string;
  createdAt: string;
  updatedAt: string;
}

export interface AltierRequest {
  libelle: string;
  adresse: string;
}

/**
 * Roll Types
 */
export type MaterialType = 'PU' | 'PVC' | 'CAOUTCHOUC';
export type RollStatus = 'AVAILABLE' | 'OPENED' | 'EXHAUSTED' | 'ARCHIVED';
export type WasteType = 'CHUTE_EXPLOITABLE' | 'DECHET';
export type WasteClassification = 'DECHET' | 'CHUTE_EXPLOITABLE';
export type CuttingOperationStatus = 'PREPARED' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD' | 'CANCELLED';
export type WasteItemStatus = 'AVAILABLE' | 'USED_IN_ORDER' | 'SCRAP' | 'RESERVED';
export type WasteStatus = WasteItemStatus; // Alias for backend compatibility

/**
 * Settings / Configuration Types
 */
export interface MaterialChuteThreshold {
  id: string;
  materialType: MaterialType;
  minWidthMm: number;
  minLengthM: number;
  createdAt: string;
  updatedAt: string;
}

export interface Color {
  id: string;
  name: string;
  hexCode: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Roll {
  id: string;
  reference: string;
  receivedDate: string;
  supplierId: string;
  supplierName?: string;
  altierId?: string;
  altierLibelle?: string;
  altier?: {
    id: string;
    libelle: string;
    adresse: string;
  };
  materialType: MaterialType;
  nbPlis: number;
  thicknessMm: number;
  
  // Dimensions (current state - no "initial" suffix)
  widthMm: number;
  widthRemainingMm?: number;
  lengthM: number;
  lengthRemainingM?: number;
  areaM2: number;
  
  status: RollStatus;
  qrCode?: string;
  colorId?: string;
  colorName?: string;
  colorHexCode?: string;
  
  // Processing tracking
  totalCuts: number;
  totalWasteAreaM2: number;
  lastProcessingDate?: string;
  
  // Convenience flags
  availableForCutting?: boolean;
  
  // Audit
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RollRequest {
  supplierId: string;
  altierId?: string;
  reference?:string;
  materialType: MaterialType;
  nbPlis: number;
  thicknessMm: number;
  widthMm: number;
  widthRemainingMm?: number;
  lengthM: number;
  lengthRemainingM?: number;
  areaM2: number;
  status: RollStatus;
  qrCode?: string;
  colorId?: string;
  receivedDate: string;
}

/**
 * Cutting Operation Types
 */
export interface CuttingOperation {
  id: string;
  rollId: string;
  operatorId: string;
  commandeItemId?: string;
  quantity: number;
  finalUtilizationPct: number;
  finalWasteAreaMm2: number;
  finalWasteAreaM2: number;
  finalWasteKg?: number;
  piecesRequested: string;
  nestingResult: string;
  status: CuttingOperationStatus;
  visualizationSvg?: string;
  notes?: string;
  highEfficiency: boolean;
  significantWaste: boolean;
  timestamp: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CuttingOperationRequest {
  commandeItemId: string;
  rollId: string;
  plannedSurfaceM2?: number;
  plannedPieces?: number;
  status?: CuttingOperationStatus;
  notes?: string;
  operatorId?: string;
  quantity?: number;
  utilization?: number;
  wasteArea?: number;
  nestingResults?: Record<string, unknown>;
  visualizationSvg?: string;
}

/**
 * Waste Piece Types
 */
export interface WastePiece {
  id: string;
  reference: string;
  rollId: string;
  supplierId?: string;
  supplierName?: string;
  parentWastePieceId?: string | null;
  commandeItemId?: string | null;
  createdBy: string;
  materialType: MaterialType;
  nbPlis: number;
  thicknessMm: number;
  widthMm: number;
  widthRemainingMm?: number;
  lengthM: number;
  lengthRemainingM?: number;
  areaM2: number;
  status: WasteItemStatus;
  wasteType?: WasteType;
  altierId?: string;
  altierLibelle?: string;
  qrCode?: string;
  colorId?: string;
  colorName?: string;
  colorHexCode?: string;
  totalCuts: number;
  totalWasteAreaM2: number;
  lastProcessingDate?: string | null;
  classificationDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WastePieceRequest {
  rollId?: string;
  parentWastePieceId?: string;
  commandeItemId?: string;
  materialType: MaterialType;
  widthMm: number;
  lengthM: number;
  colorId?: string;
  wasteType?: WasteType;
  quantityPieces?: number;
  weightKg?: number;
  notes?: string;
  status?: 'AVAILABLE';
}

/**
 * User Types
 */
export type UserRole = 'ADMIN' | 'OPERATOR' | 'READONLY';

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  altierId?: string;  // Primary altier assignment
  altierIds?: string[];  // All altiers user has access to
  lastLoginDate: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * User-Altier Mapping Types (Multi-location access)
 */
export interface UserAltier {
  id: string;
  user: {
    id: string;
    username: string;
    email: string;
    role: UserRole;
  };
  altier: {
    id: string;
    libelle: string;
    adresse: string;
  };
  assignedBy: {
    id: string;
    username: string;
  };
  assignedAt: string;
}

export interface UserAltierRequest {
  userId: string;
  altierId: string;
}

/**
 * Dashboard Metrics
 */
export interface InventoryMetrics {
  totalRolls: number;
  totalArea: number;
  byMaterial: {
    material: MaterialType;
    count: number;
    area: number;
  }[];
}

export interface WasteMetrics {
  totalWaste: number;
  totalArea: number;
  reuseEfficiency: number;
  byStatus: {
    status: WasteItemStatus;
    count: number;
    area: number;
  }[];
}

export interface OperatorMetrics {
  operatorId: string;
  operatorName: string;
  operationCount: number;
  averageUtilization: number;
  totalWaste: number;
}

/**
 * Roll Movement Types
 */
export interface RollMovement {
  id: string;
  rollId: string;
  transferBonId?: string;
  fromAltier: Altier;
  toAltier: Altier;
  dateSortie: string;
  dateEntree: string;
  statusSortie?: boolean;  // true when item exits from_altier
  statusEntree?: boolean;  // true when item enters to_altier
  reason?: string;
  operator: {
    id: string;
    username: string;
    email: string;
    role: string;
  };
  notes?: string;
  durationHours: number;
  createdAt: string;
  updatedAt: string;
}

export interface RollMovementRequest {
  rollId: string;
  fromAltierID: string;  // Now required
  toAltierID: string;
  dateSortie: string;
  dateEntree: string;
  transferBonId?: string;
  reason?: string;
  notes?: string;
}

/**
 * Bon de Transfert (TransferBon) Types
 */
export interface TransferBon {
  id: string;
  fromAltier: Altier;
  toAltier: Altier;
  dateSortie: string;
  dateEntree?: string;
  statusSortie?: boolean;
  statusEntree?: boolean;
  operator: {
    id: string;
    username: string;
    email: string;
    role: string;
  };
  notes?: string;
  createdAt: string;
  updatedAt: string;
  movementCount?: number;
}

/**
 * Bon d'achat (PurchaseBon) Types
 */
export type PurchaseBonStatus = 'DRAFT' | 'VALIDATED';

export interface PurchaseBonItemRequest {
  materialType: MaterialType;
  nbPlis: number;
  thicknessMm: number;
  widthMm: number;
  lengthM: number;
  areaM2: number;
  quantity: number;
  colorId?: string;
  altierId?: string;
  qrCode?: string;
}

export interface PurchaseBonItem {
  id: string;
  lineNumber: number;
  materialType: MaterialType;
  nbPlis: number;
  thicknessMm: number;
  widthMm: number;
  lengthM: number;
  areaM2: number;
  quantity: number;
  colorId?: string;
  colorName?: string;
  colorHexCode?: string;
  altierId?: string;
  altierLibelle?: string;
  qrCode?: string;
}

export interface PurchaseBonRequest {
  reference: string;
  bonDate: string;
  supplierId: string;
  notes?: string;
  items: PurchaseBonItemRequest[];
}

export interface PurchaseBon {
  id: string;
  reference: string;
  bonDate: string;
  supplierId: string;
  supplierName?: string;
  status: PurchaseBonStatus;
  notes?: string;
  createdBy?: {
    id: string;
    username: string;
    email: string;
    role: string;
  };
  validatedAt?: string;
  createdAt: string;
  updatedAt: string;
  itemCount?: number;
  items?: PurchaseBonItem[];
}

/**
 * Client Management Types
 */
export interface ClientPhone {
  id: string;
  phoneNumber: string;
  isMain: boolean;
  phoneType: 'MOBILE' | 'LANDLINE' | 'OTHER';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClientPhoneRequest {
  phoneNumber: string;
  isMain?: boolean;
  phoneType?: string;
  notes?: string;
}

export interface ClientEmail {
  id: string;
  emailAddress: string;
  isMain: boolean;
  emailType: 'BUSINESS' | 'PERSONAL' | 'OTHER';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClientEmailRequest {
  emailAddress: string;
  isMain?: boolean;
  emailType?: string;
  notes?: string;
}

export interface ClientAddress {
  id: string;
  streetAddress: string;
  city?: string;
  postalCode?: string;
  country: string;
  isMain: boolean;
  addressType: 'BUSINESS' | 'BILLING' | 'SHIPPING' | 'OTHER';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClientAddressRequest {
  streetAddress: string;
  city?: string;
  postalCode?: string;
  country?: string;
  isMain?: boolean;
  addressType?: string;
  notes?: string;
}

export interface ClientRepresentative {
  id: string;
  name: string;
  position?: string;
  phone?: string;
  email?: string;
  isPrimary: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClientRepresentativeRequest {
  name: string;
  position?: string;
  phone?: string;
  email?: string;
  isPrimary?: boolean;
  notes?: string;
}

export interface Client {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  phones: ClientPhone[];
  emails: ClientEmail[];
  addresses: ClientAddress[];
  representatives: ClientRepresentative[];
  createdAt: string;
  updatedAt: string;
}

export interface ClientRequest {
  name: string;
  description?: string;
  isActive?: boolean;
  phones?: ClientPhoneRequest[];
  emails?: ClientEmailRequest[];
  addresses?: ClientAddressRequest[];
  representatives?: ClientRepresentativeRequest[];
}

/**
 * Order (Commande) Types
 */
export type CommandeStatus = 'PENDING' | 'ENCOURS' | 'COMPLETED' | 'CANCELLED' | 'ON_HOLD';
export type ItemStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type TypeMouvement = 'ENCOURS' | 'COUPE' | 'SORTIE' | 'RETOUR';

export interface CommandeItem {
  id: string;
  commandeId: string;
  materialType: MaterialType;
  nbPlis: number;
  thicknessMm: number;
  longueurM: number;
  longueurToleranceM: number;
  largeurMm: number;
  quantite: number;
  surfaceConsommeeM2: number;
  typeMouvement: TypeMouvement;
  status: ItemStatus;
  observations?: string;
  lineNumber: number;
  cuttingOperationId?: string;
  cutDate?: string;
  actualSurfaceCutM2?: number;
  actualPiecesCut?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CommandeItemRequest {
  materialType: MaterialType;
  nbPlis: number;
  thicknessMm: number;
  longueurM: number;
  longueurToleranceM?: number;
  largeurMm: number;
  quantite: number;
  surfaceConsommeeM2: number;
  typeMouvement: TypeMouvement;
  status?: ItemStatus;
  observations?: string;
  lineNumber: number;
  cuttingOperationId?: string;
  actualSurfaceCutM2?: number;
  actualPiecesCut?: number;
}

export interface Commande {
  id: string;
  numeroCommande: string;
  clientId: string;
  clientName: string;
  status: CommandeStatus;
  description?: string;
  notes?: string;
  createdBy: string;
  createdByName: string;
  updatedBy?: string;
  updatedByName?: string;
  items: CommandeItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CommandeRequest {
  numeroCommande: string;
  clientId: string;
  status?: CommandeStatus;
  description?: string;
  notes?: string;
  items?: CommandeItemRequest[];
}

export interface ProductionItem {
  id: string;
  commandeItemId: string;
  rollId?: string | null;
  wastePieceId?: string | null;
  pieceLengthM: number;
  pieceWidthMm: number;
  quantity: number;
  areaPerPieceM2: number;
  totalAreaM2: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductionItemRequest {
  commandeItemId: string;
  rollId?: string;
  wastePieceId?: string;
  pieceLengthM: number;
  pieceWidthMm: number;
  quantity: number;
  notes?: string;
}

export interface RollGroupedStatsResponse {
  colorId: string | null;
  colorName: string | null;
  colorHexCode: string | null;
  nbPlis: number;
  thicknessMm: number;
  materialType: MaterialType;
  supplierId: string | null;
  supplierName: string | null;
  altierId: string | null;
  status: RollStatus;
  rollCount: number;
  totalAreaM2: number;
}

