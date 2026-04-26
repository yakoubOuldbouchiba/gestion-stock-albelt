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
export type MaterialType = 'PU' | 'PVC' | 'CAOUTCHOUC' | 'ALL';
export type RollStatus = 'AVAILABLE' | 'OPENED' | 'EXHAUSTED' | 'ARCHIVED' | 'ALL';
export type WasteType = 'CHUTE_EXPLOITABLE' | 'DECHET';
export type WasteClassification = 'DECHET' | 'CHUTE_EXPLOITABLE';
export type CuttingOperationStatus = 'PREPARED' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD' | 'CANCELLED';
export type WasteItemStatus = 'AVAILABLE' | 'OPENED' | 'EXHAUSTED' | 'ARCHIVED';
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

export interface Article {
  id: string;
  materialType: MaterialType;
  thicknessMm: number;
  nbPlis: number;
  reference?: string | null;
  name?: string | null;
  code?: string | null;
  externalId?: string | null;
  color?: Color;
  colorId?: string;
  colorName?: string;
  colorHexCode?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ArticleRequest {
  materialType: MaterialType;
  thicknessMm: number;
  nbPlis: number;
  reference?: string | null;
  name?: string | null;
  code?: string | null;
  externalId?: string | null;
  colorId?: string | null;
}

export interface Roll {
  id: string;
  reference: string;
  articleId?: string | null;
  article?: Article | null;
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
  usedAreaM2?: number;
  availableAreaM2?: number;
  
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

export interface RollSummary {
  id: string;
  reference?: string;
  articleId?: string | null;
  article?: Article | null;
  materialType?: MaterialType;
  nbPlis?: number;
  thicknessMm?: number;
  widthMm?: number;
  widthRemainingMm?: number;
  lengthM?: number;
  lengthRemainingM?: number;
  areaM2?: number;
  usedAreaM2?: number;
  availableAreaM2?: number;
  status?: RollStatus;
  colorId?: string;
  colorName?: string;
  colorHexCode?: string;
}

export interface RollRequest {
  supplierId: string;
  altierId?: string;
  articleId?: string;
  article?: Article | null;
  reference?: string;
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
  quantity: number;
  piecesRequested: string;
  nestingResult: string;
  status: CuttingOperationStatus;
  visualizationSvg?: string;
  notes?: string;
  highEfficiency?: boolean;
  significantWaste?: boolean;
}

/**
 * Waste Piece Types
 */
export interface WastePiece {
  id: string;
  reference: string;
  articleId?: string | null;
  article?: Article | null;
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
  usedAreaM2?: number;
  availableAreaM2?: number;
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

export interface WastePieceSummary {
  id: string;
  rollId?: string | null;
  parentWastePieceId?: string | null;
  reference?: string;
  articleId?: string | null;
  article?: Article | null;
  materialType?: MaterialType;
  nbPlis?: number;
  thicknessMm?: number;
  widthMm?: number;
  widthRemainingMm?: number;
  lengthM?: number;
  lengthRemainingM?: number;
  areaM2?: number;
  usedAreaM2?: number;
  availableAreaM2?: number;
  status?: WasteStatus;
  wasteType?: WasteType;
  colorId?: string;
  colorName?: string;
  colorHexCode?: string;
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
  status?: 'AVAILABLE' | 'OPENED' | 'EXHAUSTED' | 'ARCHIVED';
}

/**
 * Placed Rectangle Types
 */
export interface PlacedRectangle {
  id: string;
  rollId?: string | null;
  wastePieceId?: string | null;
  commandeItemId?: string | null;
  roll?: RollSummary | null;
  wastePiece?: WastePieceSummary | null;
  commandeItem?: CommandeItemSummary | null;
  xMm: number;
  yMm: number;
  widthMm: number;
  heightMm: number;
  colorId?: string | null;
  colorName?: string | null;
  colorHexCode?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PlacedRectangleRequest {
  rollId?: string;
  wastePieceId?: string;
  commandeItemId?: string;
  xMm: number;
  yMm: number;
  widthMm: number;
  heightMm: number;
  colorId?: string;
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
  rollId?: string;
  wastePieceId?: string;
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
  rollId?: string;
  wastePieceId?: string;
  fromAltierID: string;  // Now required
  toAltierID: string;
  dateSortie: string;
  dateEntree?: string;
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

export type ReturnMode = 'TOTAL' | 'PARTIAL';
export type ReturnType = 'MATIERE' | 'MESURE';
export type ReturnMeasureAction = 'AJUST' | 'DECHET';

export interface ReturnBonItem {
  id: string;
  returnBonId: string;
  commandeItemId: string;
  productionItemId: string;
  quantity: number;
  returnType: ReturnType;
  measureAction?: ReturnMeasureAction | null;
  adjustedWidthMm?: number | null;
  adjustedLengthM?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReturnBon {
  id: string;
  commandeId: string;
  returnMode: ReturnMode;
  reason: string;
  reasonDetails?: string | null;
  notes?: string | null;
  createdBy?: {
    id: string;
    username: string;
    email: string;
    role: string;
  };
  createdAt: string;
  updatedAt: string;
  itemCount?: number;
  items?: ReturnBonItem[];
}

export interface ReturnBonItemRequest {
  commandeItemId: string;
  productionItemId: string;
  quantity: number;
  returnType: ReturnType;
  measureAction?: ReturnMeasureAction;
  adjustedWidthMm?: number;
  adjustedLengthM?: number;
}

export interface ReturnBonRequest {
  commandeId: string;
  returnMode: ReturnMode;
  reason: string;
  reasonDetails?: string;
  notes?: string;
  items: ReturnBonItemRequest[];
}

/**
 * Bon d'achat (PurchaseBon) Types
 */
export type PurchaseBonStatus = 'DRAFT' | 'VALIDATED';

export interface PurchaseBonItemRequest {
  articleId?: string;
  article?: Article | null;
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
  articleId?: string | null;
  article?: Article | null;
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

export interface CommandeItemSummary {
  id: string;
  lineNumber?: number;
  articleId?: string | null;
  article?: Article | null;
  materialType?: string;
  nbPlis?: number;
  thicknessMm?: number;
  longueurM?: number;
  longueurToleranceM?: number;
  largeurMm?: number;
  quantite?: number;
  status?: ItemStatus;
  typeMouvement?: TypeMouvement;
  reference?: string;
  colorId?: string;
  colorName?: string;
  colorHexCode?: string;
}

export interface CommandeItem {
  id: string;
  commandeId: string;
  articleId?: string | null;
  article?: Article | null;
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
  reference?: string;
  colorId?: string;
  colorName?: string;
  colorHexCode?: string;
  goodProduction?: boolean;
  productionMiss?: string;
  totalItemsConforme?: number;
  totalItemsNonConforme?: number;
  lineNumber: number;
  cuttingOperationId?: string;
  cutDate?: string;
  actualSurfaceCutM2?: number;
  actualPiecesCut?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CommandeItemRequest {
  articleId?: string;
  article?: Article | null;
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
  reference?: string;
  colorId?: string;
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
  altierId?: string;
  altierLibelle?: string;
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
  altierId?: string;
  status?: CommandeStatus;
  description?: string;
  notes?: string;
  items?: CommandeItemRequest[];
}

export interface AltierScore {
  altierId: string;
  altierLibelle: string;
  score: number;
  totalPieces: number;
  placedPieces: number;
  coveragePct: number;
  canFulfill: boolean;
}

export interface OptimizationMetrics {
  totalPieces: number;
  placedPieces: number;
  sourceCount: number;
  usedAreaM2: number;
  wasteAreaM2: number;
  utilizationPct: number;
}

export interface OptimizationSourceReport {
  sourceType: 'ROLL' | 'WASTE_PIECE';
  sourceId: string;
  label: 'ROLL' | 'CHUTE';
  reference?: string | null;
  nbPlis?: number | null;
  thicknessMm?: number | null;
  widthMm?: number | null;
  lengthM?: number | null;
  colorName?: string | null;
  colorHexCode?: string | null;
  qrCode?: string | null;
}

export interface OptimizationPlacementReport {
  sourceType: 'ROLL' | 'WASTE_PIECE';
  sourceId?: string | null;
  xMm: number;
  yMm: number;
  widthMm: number;
  heightMm: number;
  rotated?: boolean | null;
  pieceWidthMm?: number | null;
  pieceLengthM?: number | null;
  areaM2?: number | null;
  placementColorName?: string | null;
  placementColorHexCode?: string | null;
  qrCode?: string | null;
}

export interface OptimizationPlan {
  suggestionId: string;
  status: string;
  metrics: OptimizationMetrics;
  svg?: string | null;
  sources?: OptimizationSourceReport[];
  placements?: OptimizationPlacementReport[];
}

export interface OptimizationComparison {
  commandeItemId: string;
  actualMetrics: OptimizationMetrics;
  suggested?: OptimizationPlan | null;
  actualSvg?: string | null;
  actualSources?: OptimizationSourceReport[];
  actualPlacements?: OptimizationPlacementReport[];
  wasteSavedM2?: number;
  utilizationGainPct?: number;
}

export interface ProductionItem {
  id: string;
  placedRectangleId: string;
  placedRectangle?: PlacedRectangle | null;
  pieceLengthM: number;
  pieceWidthMm: number;
  quantity: number;
  areaPerPieceM2: number;
  totalAreaM2: number;
  notes?: string;
  goodProduction?: boolean;
  productionMiss?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductionItemRequest {
  placedRectangleId: string;
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


export interface OrderSummaryStats {
  activeOrders: number;
  waitingItems: number;
  cuttingItems: number;
  completedItems: number;
}
