/**
 * GraphQL documents for the FarmYantra admin API.
 *
 * Mutations return `{ success, message, code, data }`; most queries return
 * JSON payloads shaped by the backend services (see farmyantra_backend
 * docs/API.md). Every operation is permission-checked on the server.
 */
import { gql } from '@apollo/client'

const RESULT = 'success message code data'
const PAGE = 'items pagination { total page totalPages limit offset hasMore } meta'

// ── Auth & team ─────────────────────────────────────────
export const LOGIN = gql`mutation Login($email: String!, $password: String!) { login(email: $email, password: $password) { success message code token member } }`
export const CHANGE_PASSWORD = gql`mutation ChangeOwnPassword($currentPassword: String!, $newPassword: String!) { changeOwnPassword(currentPassword: $currentPassword, newPassword: $newPassword) { success message code token } }`
export const ME = gql`query Me { me }`
export const PERMISSION_CATALOG = gql`query PermissionCatalog { permissionCatalog }`
export const TEAM_MEMBERS = gql`query TeamMembers($search: String, $status: String, $roleId: ID) { teamMembers(search: $search, status: $status, roleId: $roleId) }`
export const TEAM_MEMBER = gql`query TeamMember($id: ID!) { teamMember(id: $id) }`
export const ROLES = gql`query Roles { roles }`
export const CREATE_TEAM_MEMBER = gql`mutation CreateTeamMember($input: JSON!) { createTeamMember(input: $input) { ${RESULT} } }`
export const UPDATE_TEAM_MEMBER = gql`mutation UpdateTeamMember($id: ID!, $input: JSON!) { updateTeamMember(id: $id, input: $input) { ${RESULT} } }`
export const RESET_MEMBER_PASSWORD = gql`mutation ResetTeamMemberPassword($id: ID!, $password: String!) { resetTeamMemberPassword(id: $id, password: $password) { ${RESULT} } }`
export const DELETE_TEAM_MEMBER = gql`mutation DeleteTeamMember($id: ID!) { deleteTeamMember(id: $id) { ${RESULT} } }`
export const SAVE_ROLE = gql`mutation SaveRole($id: ID, $input: JSON!) { saveRole(id: $id, input: $input) { ${RESULT} } }`
export const DELETE_ROLE = gql`mutation DeleteRole($id: ID!) { deleteRole(id: $id) { ${RESULT} } }`
export const AUDIT_LOGS = gql`query AuditLogs($entity: String, $entityId: String, $action: String, $search: String, $from: String, $to: String, $page: Int, $limit: Int) { auditLogs(entity: $entity, entityId: $entityId, action: $action, search: $search, from: $from, to: $to, page: $page, limit: $limit) { ${PAGE} } }`
export const ADMIN_NOTIFICATIONS = gql`query AdminNotifications { adminNotifications }`
export const MARK_ADMIN_NOTIFICATIONS_READ = gql`mutation MarkAdminNotificationsRead($ids: [ID!]!) { markAdminNotificationsRead(ids: $ids) { ${RESULT} } }`

// ── Dashboard & reports ─────────────────────────────────
export const DASHBOARD = gql`query Dashboard { dashboard }`
export const ENQUIRY_TREND = gql`query EnquiryTrend($days: Int) { enquiryTrend(days: $days) }`
export const CONVERSION_FUNNEL = gql`query ConversionFunnel($days: Int) { conversionFunnel(days: $days) }`
export const PRODUCT_INTEREST = gql`query ProductInterest($limit: Int) { productInterest(limit: $limit) }`

// ── Catalogue ───────────────────────────────────────────
export const PRODUCTS = gql`query Products($search: String, $status: String, $categoryId: ID, $availability: String, $customisable: Boolean, $missingHindi: Boolean, $page: Int, $limit: Int) { products(search: $search, status: $status, categoryId: $categoryId, availability: $availability, customisable: $customisable, missingHindi: $missingHindi, page: $page, limit: $limit) { ${PAGE} } }`
export const PRODUCT = gql`query Product($id: ID!) { product(id: $id) }`
export const CATEGORIES = gql`query Categories { categories }`
export const TAX_RULES = gql`query TaxRules { taxRules }`
export const CREATE_PRODUCT = gql`mutation CreateProduct($input: JSON!) { createProduct(input: $input) { ${RESULT} } }`
export const UPDATE_PRODUCT = gql`mutation UpdateProduct($id: ID!, $input: JSON!) { updateProduct(id: $id, input: $input) { ${RESULT} } }`
export const SET_PRODUCT_STATUS = gql`mutation SetProductStatus($id: ID!, $status: String!) { setProductStatus(id: $id, status: $status) { ${RESULT} } }`
export const DUPLICATE_PRODUCT = gql`mutation DuplicateProduct($id: ID!) { duplicateProduct(id: $id) { ${RESULT} } }`
export const SAVE_TRANSLATION = gql`mutation SaveProductTranslation($productId: ID!, $language: String!, $input: JSON!) { saveProductTranslation(productId: $productId, language: $language, input: $input) { ${RESULT} } }`
export const SAVE_SPECS = gql`mutation SaveProductSpecs($productId: ID!, $specs: [JSON!]!) { saveProductSpecs(productId: $productId, specs: $specs) { ${RESULT} } }`
export const ADD_MEDIA = gql`mutation AddProductMedia($productId: ID!, $mediaType: String!, $file: Upload, $embedUrl: String, $alt: I18nInput, $caption: I18nInput, $colourId: ID, $isPrimary: Boolean) { addProductMedia(productId: $productId, mediaType: $mediaType, file: $file, embedUrl: $embedUrl, alt: $alt, caption: $caption, colourId: $colourId, isPrimary: $isPrimary) { ${RESULT} } }`
export const UPDATE_MEDIA = gql`mutation UpdateProductMedia($id: ID!, $input: JSON!, $poster: Upload) { updateProductMedia(id: $id, input: $input, poster: $poster) { ${RESULT} } }`
export const REORDER_MEDIA = gql`mutation ReorderProductMedia($productId: ID!, $orderedIds: [ID!]!) { reorderProductMedia(productId: $productId, orderedIds: $orderedIds) { ${RESULT} } }`
export const DELETE_MEDIA = gql`mutation DeleteProductMedia($id: ID!) { deleteProductMedia(id: $id) { ${RESULT} } }`
export const ADD_DOCUMENT = gql`mutation AddProductDocument($productId: ID!, $file: Upload!, $docType: String!, $title: I18nInput!, $language: String, $isPublic: Boolean) { addProductDocument(productId: $productId, file: $file, docType: $docType, title: $title, language: $language, isPublic: $isPublic) { ${RESULT} } }`
export const DELETE_DOCUMENT = gql`mutation DeleteProductDocument($id: ID!) { deleteProductDocument(id: $id) { ${RESULT} } }`
export const UPLOAD_3D = gql`mutation UploadProduct3dModel($productId: ID!, $file: Upload!, $poster: Upload, $settings: JSON) { uploadProduct3dModel(productId: $productId, file: $file, poster: $poster, settings: $settings) { ${RESULT} } }`
export const UPDATE_3D = gql`mutation UpdateProduct3dSettings($productId: ID!, $settings: JSON!) { updateProduct3dSettings(productId: $productId, settings: $settings) { ${RESULT} } }`
export const REMOVE_3D = gql`mutation RemoveProduct3dModel($productId: ID!) { removeProduct3dModel(productId: $productId) { ${RESULT} } }`
export const SAVE_RELATIONS = gql`mutation SaveProductRelations($productId: ID!, $relations: [JSON!]!) { saveProductRelations(productId: $productId, relations: $relations) { ${RESULT} } }`
export const SAVE_CATEGORY = gql`mutation SaveCategory($id: ID, $input: JSON!, $image: Upload) { saveCategory(id: $id, input: $input, image: $image) { ${RESULT} } }`
export const DELETE_CATEGORY = gql`mutation DeleteCategory($id: ID!) { deleteCategory(id: $id) { ${RESULT} } }`
export const SAVE_COLOUR = gql`mutation SaveProductColour($productId: ID!, $input: JSON!) { saveProductColour(productId: $productId, input: $input) { ${RESULT} } }`
export const SAVE_ADDON = gql`mutation SaveProductAddon($productId: ID!, $input: JSON!) { saveProductAddon(productId: $productId, input: $input) { ${RESULT} } }`
export const SAVE_PERSONALISATION = gql`mutation SaveProductPersonalisation($productId: ID!, $input: JSON!) { saveProductPersonalisation(productId: $productId, input: $input) { ${RESULT} } }`
export const SAVE_PLACEMENT = gql`mutation SaveProductPlacement($productId: ID!, $input: JSON!) { saveProductPlacement(productId: $productId, input: $input) { ${RESULT} } }`
export const SET_OPTION_ACTIVE = gql`mutation SetProductOptionActive($productId: ID!, $kind: String!, $id: ID!, $isActive: Boolean!) { setProductOptionActive(productId: $productId, kind: $kind, id: $id, isActive: $isActive) { ${RESULT} } }`
export const UPLOAD_OPTION_IMAGE = gql`mutation UploadOptionImage($productId: ID!, $file: Upload!) { uploadOptionImage(productId: $productId, file: $file) { ${RESULT} } }`
export const SAVE_TAX_RULE = gql`mutation SaveTaxRule($id: ID, $input: JSON!) { saveTaxRule(id: $id, input: $input) { ${RESULT} } }`

// ── Enquiries ───────────────────────────────────────────
export const ENQUIRIES = gql`query Enquiries($filter: JSON, $page: Int, $limit: Int, $sortBy: String, $sortOrder: String) { enquiries(filter: $filter, page: $page, limit: $limit, sortBy: $sortBy, sortOrder: $sortOrder) { ${PAGE} } }`
export const ENQUIRY = gql`query Enquiry($id: ID!) { enquiry(id: $id) }`
export const CHANGE_ENQUIRY_STATUS = gql`mutation ChangeEnquiryStatus($id: ID!, $status: String!, $note: String) { changeEnquiryStatus(id: $id, status: $status, note: $note) { ${RESULT} } }`
export const ASSIGN_ENQUIRY = gql`mutation AssignEnquiry($id: ID!, $memberId: ID) { assignEnquiry(id: $id, memberId: $memberId) { ${RESULT} } }`
export const LOG_CALL = gql`mutation LogEnquiryCall($id: ID!, $outcome: String!, $note: String, $nextCallbackAt: String) { logEnquiryCall(id: $id, outcome: $outcome, note: $note, nextCallbackAt: $nextCallbackAt) { ${RESULT} } }`
export const SET_REQUEST_TYPE = gql`mutation SetEnquiryRequestType($id: ID!, $requestType: String!, $note: String) { setEnquiryRequestType(id: $id, requestType: $requestType, note: $note) { ${RESULT} } }`
export const ADD_ENQUIRY_MESSAGE = gql`mutation AddEnquiryMessage($id: ID!, $body: String!, $visibility: String!) { addEnquiryMessage(id: $id, body: $body, visibility: $visibility) { ${RESULT} } }`
export const RESEND_NOTIFICATION = gql`mutation ResendNotification($deliveryId: ID!) { resendNotification(deliveryId: $deliveryId) { ${RESULT} } }`
export const CONTACT_MESSAGES = gql`query ContactMessages($status: String, $search: String, $page: Int, $limit: Int) { contactMessages(status: $status, search: $search, page: $page, limit: $limit) { ${PAGE} } }`
export const SET_CONTACT_STATUS = gql`mutation SetContactMessageStatus($id: ID!, $status: String!) { setContactMessageStatus(id: $id, status: $status) { ${RESULT} } }`

// ── Quotations & orders ─────────────────────────────────
export const QUOTATIONS = gql`query Quotations($status: String, $search: String, $expiringWithinDays: Int, $page: Int, $limit: Int) { quotations(status: $status, search: $search, expiringWithinDays: $expiringWithinDays, page: $page, limit: $limit) { ${PAGE} } }`
export const QUOTATION = gql`query Quotation($id: ID!) { quotation(id: $id) }`
export const CREATE_QUOTATION = gql`mutation CreateQuotation($enquiryId: ID!) { createQuotation(enquiryId: $enquiryId) { ${RESULT} } }`
export const UPDATE_QUOTATION_DRAFT = gql`mutation UpdateQuotationDraft($versionId: ID!, $input: JSON!) { updateQuotationDraft(versionId: $versionId, input: $input) { ${RESULT} } }`
export const SEND_QUOTATION = gql`mutation SendQuotation($versionId: ID!) { sendQuotation(versionId: $versionId) { ${RESULT} } }`
export const REVISE_QUOTATION = gql`mutation ReviseQuotation($quotationId: ID!) { reviseQuotation(quotationId: $quotationId) { ${RESULT} } }`
export const CANCEL_QUOTATION = gql`mutation CancelQuotation($quotationId: ID!, $reason: String!) { cancelQuotation(quotationId: $quotationId, reason: $reason) { ${RESULT} } }`
export const CONVERT_TO_ORDER = gql`mutation ConvertQuotationToOrder($versionId: ID!) { convertQuotationToOrder(versionId: $versionId) { ${RESULT} } }`
export const ORDERS = gql`query Orders($status: String, $paymentStatus: String, $search: String, $page: Int, $limit: Int) { orders(status: $status, paymentStatus: $paymentStatus, search: $search, page: $page, limit: $limit) { ${PAGE} } }`
export const ORDER = gql`query Order($id: ID!) { order(id: $id) }`
export const CHANGE_ORDER_STATUS = gql`mutation ChangeOrderStatus($id: ID!, $status: String!, $note: String) { changeOrderStatus(id: $id, status: $status, note: $note) { ${RESULT} } }`
export const UPDATE_ORDER = gql`mutation UpdateOrder($id: ID!, $input: JSON!) { updateOrder(id: $id, input: $input) { ${RESULT} } }`

// ── Customers & reviews ─────────────────────────────────
export const CUSTOMERS = gql`query Customers($search: String, $status: String, $city: String, $page: Int, $limit: Int) { customers(search: $search, status: $status, city: $city, page: $page, limit: $limit) { ${PAGE} } }`
export const CUSTOMER = gql`query Customer($id: ID!) { customer(id: $id) }`
export const UPDATE_CUSTOMER = gql`mutation UpdateCustomer($id: ID!, $input: JSON!) { updateCustomer(id: $id, input: $input) { ${RESULT} } }`
export const REVIEWS = gql`query Reviews($queue: Boolean, $productId: ID, $rating: Int, $verificationStatus: String, $moderationStatus: String, $search: String, $page: Int, $limit: Int) { reviews(queue: $queue, productId: $productId, rating: $rating, verificationStatus: $verificationStatus, moderationStatus: $moderationStatus, search: $search, page: $page, limit: $limit) { ${PAGE} } }`
export const REVIEW = gql`query Review($id: ID!) { review(id: $id) }`
export const MODERATE_REVIEW = gql`mutation ModerateReview($id: ID!, $action: String!, $reason: String, $customerFeedback: String, $flags: [String!]) { moderateReview(id: $id, action: $action, reason: $reason, customerFeedback: $customerFeedback, flags: $flags) { ${RESULT} } }`

// ── Offers ──────────────────────────────────────────────
export const PROMOTIONS = gql`query Promotions($status: String, $search: String) { promotions(status: $status, search: $search) }`
export const PROMOTION = gql`query Promotion($id: ID!) { promotion(id: $id) }`
export const PREVIEW_CART = gql`query PreviewCart($input: JSON!) { previewCart(input: $input) }`
export const SAVE_PROMOTION = gql`mutation SavePromotion($id: ID, $input: JSON!, $banner: Upload) { savePromotion(id: $id, input: $input, banner: $banner) { ${RESULT} } }`
export const SET_PROMOTION_STATUS = gql`mutation SetPromotionStatus($id: ID!, $status: String!) { setPromotionStatus(id: $id, status: $status) { ${RESULT} } }`
export const CREATE_COUPONS = gql`mutation CreateCoupons($promotionId: ID!, $codes: [String!], $generate: Int, $prefix: String, $usageLimit: Int) { createCoupons(promotionId: $promotionId, codes: $codes, generate: $generate, prefix: $prefix, usageLimit: $usageLimit) { ${RESULT} } }`
export const SET_COUPON_ACTIVE = gql`mutation SetCouponActive($id: ID!, $isActive: Boolean!) { setCouponActive(id: $id, isActive: $isActive) { ${RESULT} } }`

// ── Catalogues, content, settings ───────────────────────
export const CATALOGUE_VERSIONS = gql`query CatalogueVersions { catalogueVersions }`
export const GENERATE_CATALOGUE = gql`mutation GenerateCatalogue($title: String, $categoryId: ID, $language: String, $includePrices: Boolean) { generateCatalogue(title: $title, categoryId: $categoryId, language: $language, includePrices: $includePrices) { ${RESULT} } }`
export const REGENERATE_CATALOGUE = gql`mutation RegenerateCatalogue($id: ID!) { regenerateCatalogue(id: $id) { ${RESULT} } }`
export const SET_CATALOGUE_PUBLISHED = gql`mutation SetCataloguePublished($id: ID!, $published: Boolean!) { setCataloguePublished(id: $id, published: $published) { ${RESULT} } }`
export const DELETE_CATALOGUE = gql`mutation DeleteCatalogue($id: ID!) { deleteCatalogue(id: $id) { ${RESULT} } }`
export const CONTENT_PAGES = gql`query ContentPages { contentPages }`
export const SAVE_CONTENT_PAGE = gql`mutation SaveContentPage($id: ID, $input: JSON!) { saveContentPage(id: $id, input: $input) { ${RESULT} } }`
export const DELETE_CONTENT_PAGE = gql`mutation DeleteContentPage($id: ID!) { deleteContentPage(id: $id) { ${RESULT} } }`
export const UPLOAD_CONTENT_IMAGE = gql`mutation UploadContentImage($file: Upload!) { uploadContentImage(file: $file) { ${RESULT} } }`
export const SETTINGS = gql`query Settings { settings }`
export const UPDATE_SETTINGS = gql`mutation UpdateSettings($section: String!, $value: JSON!) { updateSettings(section: $section, value: $value) { ${RESULT} } }`
export const UPLOAD_BRAND_ASSET = gql`mutation UploadBrandAsset($file: Upload!) { uploadBrandAsset(file: $file) { ${RESULT} } }`
export const ASSIGNABLE_MEMBERS = gql`query AssignableMembers { assignableMembers }`

// ── v2.1: orders, production, logistics, documents, invoices, rewards (§23–§31) ──
export const ORDER_VERSIONS = gql`query OrderVersions($orderId: ID!) { orderVersions(orderId: $orderId) }`
export const CUSTOMER_LOOKUP = gql`query CustomerLookup($search: String!) { customerLookup(search: $search) }`
export const ACCEPT_ORDER = gql`mutation AcceptOrder($id: ID!) { acceptOrder(id: $id) { ${RESULT} } }`
export const CREATE_ORDER_FOR_CUSTOMER = gql`mutation CreateOrderForCustomer($input: JSON!) { createOrderForCustomer(input: $input) { ${RESULT} } }`
export const PROPOSE_ORDER_REVISION = gql`mutation ProposeOrderRevision($orderId: ID!, $changes: JSON!, $reason: String!, $idempotencyKey: String!) { proposeOrderRevision(orderId: $orderId, changes: $changes, reason: $reason, idempotencyKey: $idempotencyKey) { ${RESULT} } }`
export const WITHDRAW_ORDER_REVISION = gql`mutation WithdrawOrderRevision($versionId: ID!, $reason: String!) { withdrawOrderRevision(versionId: $versionId, reason: $reason) { ${RESULT} } }`
export const RECORD_PHONE_CONFIRMATION = gql`mutation RecordPhoneConfirmation($versionId: ID!, $reason: String!) { recordPhoneConfirmation(versionId: $versionId, reason: $reason) { ${RESULT} } }`
export const CANCEL_ORDER = gql`mutation CancelOrder($id: ID!, $reason: String!) { cancelOrder(id: $id, reason: $reason) { ${RESULT} } }`
export const COMPLETE_ORDER = gql`mutation CompleteOrder($id: ID!) { completeOrder(id: $id) { ${RESULT} } }`

export const ABANDONED_CARTS = gql`query AbandonedCarts($consentOnly: Boolean, $minValuePaise: Int, $search: String, $page: Int, $limit: Int) { abandonedCarts(consentOnly: $consentOnly, minValuePaise: $minValuePaise, search: $search, page: $page, limit: $limit) { ${PAGE} } }`
export const CUSTOMER_CART = gql`query CustomerCart($customerId: ID!) { customerCart(customerId: $customerId) }`
export const LOG_CART_FOLLOW_UP = gql`mutation LogCartFollowUp($cartId: ID!, $outcome: String!, $note: String) { logCartFollowUp(cartId: $cartId, outcome: $outcome, note: $note) { ${RESULT} } }`

export const MANUFACTURING_TEMPLATES = gql`query ManufacturingTemplates { manufacturingTemplates }`
export const MANUFACTURING_JOBS = gql`query ManufacturingJobs($status: String, $delayed: Boolean, $search: String, $page: Int, $limit: Int) { manufacturingJobs(status: $status, delayed: $delayed, search: $search, page: $page, limit: $limit) { ${PAGE} } }`
export const MANUFACTURING_JOB = gql`query ManufacturingJob($id: ID!) { manufacturingJob(id: $id) }`
export const SAVE_MANUFACTURING_TEMPLATE = gql`mutation SaveManufacturingTemplate($id: ID, $input: JSON!) { saveManufacturingTemplate(id: $id, input: $input) { ${RESULT} } }`
export const UPDATE_MANUFACTURING_STAGE = gql`mutation UpdateManufacturingStage($jobStageId: ID!, $status: String!, $note: String, $visibility: String, $skipReason: String, $media: [Upload!]) { updateManufacturingStage(jobStageId: $jobStageId, status: $status, note: $note, visibility: $visibility, skipReason: $skipReason, media: $media) { ${RESULT} } }`
export const ADD_MANUFACTURING_UPDATE = gql`mutation AddManufacturingUpdate($jobId: ID!, $note: String!, $visibility: String, $media: [Upload!]) { addManufacturingUpdate(jobId: $jobId, note: $note, visibility: $visibility, media: $media) { ${RESULT} } }`
export const REVISE_ITEM_ESTIMATE = gql`mutation ReviseItemEstimate($orderItemId: ID!, $minDate: String!, $maxDate: String!, $reason: String!, $customerVisible: Boolean) { reviseItemEstimate(orderItemId: $orderItemId, minDate: $minDate, maxDate: $maxDate, reason: $reason, customerVisible: $customerVisible) { ${RESULT} } }`
export const SET_MANUFACTURING_DELAY = gql`mutation SetManufacturingDelay($jobId: ID!, $delayed: Boolean!, $reason: String, $customerVisible: Boolean) { setManufacturingDelay(jobId: $jobId, delayed: $delayed, reason: $reason, customerVisible: $customerVisible) { ${RESULT} } }`

export const DRIVERS = gql`query Drivers($status: String, $search: String) { drivers(status: $status, search: $search) }`
export const DRIVER = gql`query Driver($id: ID!) { driver(id: $id) }`
export const SAVE_DRIVER = gql`mutation SaveDriver($id: ID, $input: JSON!, $vehiclePhoto: Upload) { saveDriver(id: $id, input: $input, vehiclePhoto: $vehiclePhoto) { ${RESULT} } }`
export const SET_DRIVER_STATUS = gql`mutation SetDriverStatus($id: ID!, $status: String!) { setDriverStatus(id: $id, status: $status) { ${RESULT} } }`
export const UPLOAD_DRIVER_IDENTITY = gql`mutation UploadDriverIdentity($driverId: ID!, $kind: String!, $licenceNumber: String, $file: Upload!) { uploadDriverIdentity(driverId: $driverId, kind: $kind, licenceNumber: $licenceNumber, file: $file) { ${RESULT} } }`
export const SHIPMENTS = gql`query Shipments($status: String, $search: String, $delayed: Boolean, $page: Int, $limit: Int) { shipments(status: $status, search: $search, delayed: $delayed, page: $page, limit: $limit) { ${PAGE} } }`
export const SHIPMENT = gql`query Shipment($id: ID!) { shipment(id: $id) }`
export const PENDING_DELIVERY_CONFIRMATIONS = gql`query PendingDeliveryConfirmations { pendingDeliveryConfirmations }`
export const CREATE_SHIPMENT = gql`mutation CreateShipment($orderId: ID!, $input: JSON!) { createShipment(orderId: $orderId, input: $input) { ${RESULT} } }`
export const UPDATE_SHIPMENT = gql`mutation UpdateShipment($id: ID!, $input: JSON!) { updateShipment(id: $id, input: $input) { ${RESULT} } }`
export const ADD_SHIPMENT_EVENT = gql`mutation AddShipmentEvent($shipmentId: ID!, $input: JSON!, $media: [Upload!]) { addShipmentEvent(shipmentId: $shipmentId, input: $input, media: $media) { ${RESULT} } }`
export const CHANGE_SHIPMENT_ASSIGNMENT = gql`mutation ChangeShipmentAssignment($shipmentId: ID!, $driverId: ID, $vehicleRegistration: String, $vehicleType: String, $reason: String!, $customerVisible: Boolean) { changeShipmentAssignment(shipmentId: $shipmentId, driverId: $driverId, vehicleRegistration: $vehicleRegistration, vehicleType: $vehicleType, reason: $reason, customerVisible: $customerVisible) { ${RESULT} } }`
export const CANCEL_SHIPMENT = gql`mutation CancelShipment($id: ID!, $reason: String!) { cancelShipment(id: $id, reason: $reason) { ${RESULT} } }`
export const MARK_SHIPMENT_DELIVERED = gql`mutation MarkShipmentDelivered($id: ID!, $reason: String!) { markShipmentDelivered(id: $id, reason: $reason) { ${RESULT} } }`
export const DELIVERY_ISSUES = gql`query DeliveryIssues($status: String, $search: String) { deliveryIssues(status: $status, search: $search) }`
export const DELIVERY_ISSUE = gql`query DeliveryIssue($id: ID!) { deliveryIssue(id: $id) }`
export const UPDATE_DELIVERY_ISSUE = gql`mutation UpdateDeliveryIssue($id: ID!, $input: JSON!) { updateDeliveryIssue(id: $id, input: $input) { ${RESULT} } }`
export const ADD_DELIVERY_ISSUE_MESSAGE = gql`mutation AddDeliveryIssueMessage($id: ID!, $body: String!, $visibility: String) { addDeliveryIssueMessage(id: $id, body: $body, visibility: $visibility) { ${RESULT} } }`
export const TODAY_BOARD = gql`query TodayBoard { todayBoard }`

export const ORDER_DOCUMENT_LINK = gql`query OrderDocumentLink($id: ID!) { orderDocumentLink(id: $id) }`
export const ADD_ORDER_DOCUMENT = gql`mutation AddOrderDocument($orderId: ID!, $input: JSON!, $file: Upload!) { addOrderDocument(orderId: $orderId, input: $input, file: $file) { ${RESULT} } }`
export const REPLACE_ORDER_DOCUMENT = gql`mutation ReplaceOrderDocument($id: ID!, $input: JSON, $file: Upload!) { replaceOrderDocument(id: $id, input: $input, file: $file) { ${RESULT} } }`
export const WITHDRAW_ORDER_DOCUMENT = gql`mutation WithdrawOrderDocument($id: ID!, $reason: String!) { withdrawOrderDocument(id: $id, reason: $reason) { ${RESULT} } }`
export const SET_ORDER_DOCUMENT_VISIBILITY = gql`mutation SetOrderDocumentVisibility($id: ID!, $visibility: String!) { setOrderDocumentVisibility(id: $id, visibility: $visibility) { ${RESULT} } }`
export const ORDER_PAYMENTS = gql`query OrderPayments($orderId: ID!) { orderPayments(orderId: $orderId) }`
export const RECORD_PAYMENT = gql`mutation RecordPayment($orderId: ID!, $input: JSON!) { recordPayment(orderId: $orderId, input: $input) { ${RESULT} } }`
export const VOID_PAYMENT = gql`mutation VoidPayment($id: ID!, $reason: String!) { voidPayment(id: $id, reason: $reason) { ${RESULT} } }`

export const INVOICES = gql`query Invoices($documentType: String, $status: String, $search: String, $from: String, $to: String, $page: Int, $limit: Int) { invoices(documentType: $documentType, status: $status, search: $search, from: $from, to: $to, page: $page, limit: $limit) { ${PAGE} } }`
export const INVOICE = gql`query Invoice($id: ID!) { invoice(id: $id) }`
export const INVOICE_TEMPLATES = gql`query InvoiceTemplates { invoiceTemplates }`
export const INVOICE_TEMPLATE_PREVIEW = gql`query InvoiceTemplatePreview($layout: JSON!) { invoiceTemplatePreview(layout: $layout) }`
export const CREATE_INVOICE_DRAFT = gql`mutation CreateInvoiceDraft($orderId: ID!, $documentType: String, $templateId: ID) { createInvoiceDraft(orderId: $orderId, documentType: $documentType, templateId: $templateId) { ${RESULT} } }`
export const UPDATE_INVOICE_DRAFT = gql`mutation UpdateInvoiceDraft($id: ID!, $input: JSON!) { updateInvoiceDraft(id: $id, input: $input) { ${RESULT} } }`
export const ISSUE_INVOICE = gql`mutation IssueInvoice($id: ID!, $send: Boolean) { issueInvoice(id: $id, send: $send) { ${RESULT} } }`
export const SEND_INVOICE = gql`mutation SendInvoice($id: ID!) { sendInvoice(id: $id) { ${RESULT} } }`
export const CANCEL_INVOICE = gql`mutation CancelInvoice($id: ID!, $reason: String!) { cancelInvoice(id: $id, reason: $reason) { ${RESULT} } }`
export const CREATE_CREDIT_NOTE = gql`mutation CreateCreditNote($invoiceId: ID!, $reason: String!, $items: [JSON!]) { createCreditNote(invoiceId: $invoiceId, reason: $reason, items: $items) { ${RESULT} } }`
export const SAVE_INVOICE_TEMPLATE = gql`mutation SaveInvoiceTemplate($id: ID, $input: JSON!) { saveInvoiceTemplate(id: $id, input: $input) { ${RESULT} } }`
export const UPDATE_INVOICE_SETTINGS = gql`mutation UpdateInvoiceSettings($value: JSON!) { updateInvoiceSettings(value: $value) { ${RESULT} } }`

export const REWARD_SETTINGS = gql`query RewardSettings { rewardSettings }`
export const CUSTOMER_POINTS = gql`query CustomerPoints($customerId: ID!) { customerPoints(customerId: $customerId) }`
export const REWARD_CAMPAIGNS = gql`query RewardCampaigns { rewardCampaigns }`
export const POINTS_REPORT = gql`query PointsReport { pointsReport }`
export const POINTS_ABUSE_SIGNALS = gql`query PointsAbuseSignals { pointsAbuseSignals }`
export const UPDATE_REWARD_SETTINGS = gql`mutation UpdateRewardSettings($value: JSON!) { updateRewardSettings(value: $value) { ${RESULT} } }`
export const ADJUST_POINTS = gql`mutation AdjustPoints($customerId: ID!, $points: Int!, $reason: String!, $idempotencyKey: String!) { adjustPoints(customerId: $customerId, points: $points, reason: $reason, idempotencyKey: $idempotencyKey) { ${RESULT} } }`
export const SAVE_REWARD_CAMPAIGN = gql`mutation SaveRewardCampaign($id: ID, $input: JSON!) { saveRewardCampaign(id: $id, input: $input) { ${RESULT} } }`

export const BANNERS = gql`query Banners($placement: String) { banners(placement: $placement) }`
export const SAVE_BANNER = gql`mutation SaveBanner($id: ID, $input: JSON!) { saveBanner(id: $id, input: $input) { ${RESULT} } }`
export const SAVE_BANNER_VARIANT = gql`mutation SaveBannerVariant($bannerId: ID!, $input: JSON!, $image: Upload) { saveBannerVariant(bannerId: $bannerId, input: $input, image: $image) { ${RESULT} } }`
export const DELETE_BANNER_VARIANT = gql`mutation DeleteBannerVariant($bannerId: ID!, $language: String!, $device: String!) { deleteBannerVariant(bannerId: $bannerId, language: $language, device: $device) { ${RESULT} } }`
export const TRUST_STATS = gql`query TrustStats { trustStats }`
export const CERTIFICATIONS = gql`query Certifications { certifications }`
export const CONSENTED_DELIVERIES = gql`query ConsentedDeliveries { consentedDeliveries }`
export const DELIVERY_PHOTOS = gql`query DeliveryPhotos { deliveryPhotos }`
export const SAVE_TRUST_OVERRIDE = gql`mutation SaveTrustOverride($key: String!, $value: Int, $asOf: String, $note: String) { saveTrustOverride(key: $key, value: $value, asOf: $asOf, note: $note) { ${RESULT} } }`
export const REFRESH_TRUST_STATS = gql`mutation RefreshTrustStats { refreshTrustStats { ${RESULT} } }`
export const SAVE_CERTIFICATION = gql`mutation SaveCertification($id: ID, $input: JSON!, $document: Upload, $logo: Upload) { saveCertification(id: $id, input: $input, document: $document, logo: $logo) { ${RESULT} } }`
export const ADD_DELIVERY_PHOTO = gql`mutation AddDeliveryPhoto($confirmationId: ID!, $input: JSON!, $image: Upload!) { addDeliveryPhoto(confirmationId: $confirmationId, input: $input, image: $image) { ${RESULT} } }`
export const SET_DELIVERY_PHOTO_PUBLISHED = gql`mutation SetDeliveryPhotoPublished($id: ID!, $published: Boolean!) { setDeliveryPhotoPublished(id: $id, published: $published) { ${RESULT} } }`
export const SET_REVIEW_FEATURED = gql`mutation SetReviewFeatured($reviewId: ID!, $featured: Boolean!) { setReviewFeatured(reviewId: $reviewId, featured: $featured) { ${RESULT} } }`
