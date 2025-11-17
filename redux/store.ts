import fetchAvailableRoomTypesReducer from "./slices/fetchAvailableRoomTypesSlice";
import userMasAuthReducer from "./slices/userMasAuthSlice";
import frontdeskReducer from "./slices/frontdeskSlice";
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import categoryReducer from "./slices/categorySlice";
import cartReducer from "./slices/cartSlice";
import itemReducer from "./slices/itemSlice";
import createHotelTaxSlice from "./slices/hotelTaxSlice";
import hotelTaxByHotelIdSlice from "./slices/hotelTaxByHotelIdSlice";
import updateHotelTaxSlice from "./slices/updateHotelTaxSlice";
import rateDetailsReducer from "./slices/rateDetailsSlice";
import mealPlanReducer from "./slices/mealPlanSlice";
import transactionCodeReducer from "./slices/transactionCodeSlice";
import postChargesReducer from "./slices/postChargesSlice";
import folioReducer from "./slices/folioSlice";
import reservationReducer from "./slices/reservationSlice";
import transactionSlice from "./slices/transactionSlice";
import guestProfileReducer from "./slices/guestProfileSlice";
import posOrderReducer from "./slices/posOrderSlice";
import fetchReservationReducer from "./slices/fetchReservationSlice";
import hotelCurrencySlice from "./slices/hotelCurrencySlice";
import createPosInvoiceReducer from "./slices/createPosInvoiceSlice";
import posTableSlice from "./slices/posTableSlice";
import itemMasterSlice from "./slices/itemMasterSlice";
import hotelPosCenterSlice from "./slices/hotelPosCenterSlice";
import availableRoomsReducer from "./slices/availableRoomsSlice";
import checkInSlice from "./slices/checkInSlice";
import createCheckInReducer from "./slices/createCheckInSlice";
import createCheckOutReducer from "./slices/createCheckOutSlice";
import glAccountSlice from "./slices/glAccountSlice";
import glAccountTypeSlice from "./slices/glAccountTypeSlice";
import transactionListSlice from "./slices/transactionListSlice";
import purchaseBillSummarySlice from "./slices/purchaseBillSummarySlice";
import recordExpenseSlice from "./slices/recordExpenseSlice";
import glAccountsByTypeSlice from "./slices/glAccountsByTypeSlice";
import hotelRoomTypesSlice from "./slices/hotelRoomTypesSlice";
import reservationListSlice from "./slices/reservationListSlice";
import occupancyRateSlice from "./slices/occupancyRateSlice";
import dashboardReducer from "./slices/dashboardSlice";
import hotelRoomNumberReducer from "./slices/hotelRoomNumberSlice";
import reservationAttachmentSlice from "./slices/reservationAttachmentSlice";
import fetchReservationAttachmentSlice from "./slices/fetchReservationAttachmentSlice";
import systemDateSlice from "./slices/systemDateSlice";
import hotelGuestProfileSlice from "./slices/fetchGuestProfileSlice";
import hotelImageSlice from "./slices/hotelImageSlice";
import fetchHotelImageSlice from "./slices/fetchHotelImageSlice";
import updateHotelImageSlice from "./slices/updateHotelImageSlice";
import hotelImageDeleteSlice from "./slices/hotelImageDeleteSlice";
import updateHotelSlice from "./slices/updateHotelSlice";
import updateHotelRoomTypeImageSlice from "./slices/updateHotelRoomTypeImageSlice";
import hotelRoomTypeImageSlice from "./slices/createHotelRoomTypeImageSlice";
import extendReservationReducer from "./slices/extendReservationSlice";
import cancelReservationSlice from "./slices/cancelReservationSlice";
import updateHotelRoomTypeSlice from "./slices/updateHotelRoomTypeSlice";
import reservationRemarkSlice from "./slices/reservationRemarkSlice";
import guestProfileRemarkSlice from "./slices/createGuestProfileRemarkSlice";
import fetchReservationRemarksSlice from "./slices/fetchReservationRemarksByDetailIdSlice";
import fetchuGestProfileRemarkSlice from "./slices/getGuestProfileRemarkSlice";
import shortenReservationSlice from "./slices/shortenReservationSlice";
import availabilitySlice from "./slices/availabilitySlice";
import rateAvailabilityReducer from "./slices/availabilitySlice";
import rateCodeSlice from "./slices/rateCodeSlice";
import nameMasterSlice from "./slices/nameMasterSlice";
import nightAuditSlice from "./slices/nightAuditSlice";
import deleteHotelImageSlice from "./slices/deleteHotelImageSlice";
import calculateRateReducer from "@/redux/slices/calculateRateSlice";
import hotelRatePlanSlice from "./slices/hotelRatePlanSlice";
import fetchHotelMealAllocationSlice from "./slices/fetchHotelMealAllocationSlice";
import createHotelMealAllocationSlice from "./slices/createHotelMealAllocationSlice";
import updateHotelMealAllocationSlice from "./slices/updateHotelMealAllocationSlice";
import deleteHotelMealAllocationSlice from "./slices/deleteHotelMealAllocationSlice";
import guestProfileByHotelIdSlice from "./slices/guestProfileByHotelIdSlice";
import performanceByAgentSlice from "./slices/performanceByAgentSlice";
import createHotelIPGSlice from "./slices/createHotelIPGSlice";
import fetchHotelIPGSlice from "./slices/fetchHotelIPGSlice";
import updateHotelIPGSlice from "./slices/updateHotelIPGSlice";
import deleteHotelIPGSlice from "./slices/deleteHotelIPGSlice";
import updateGuestProfileByRoomSlice from "./slices/updateGuestProfileByRoomSlice";
import updateGuestProfileSlice from "./slices/updateGuestProfileSlice";
import cancelReservationDetailSlice from "./slices/cancelReservationDetailSlice";
import createGuestProfileByRoomSlice from "./slices/createGuestProfileByRoomSlice";
import reservationByIdSlice from "./slices/reservationByIdSlice";
import updateReservationSlice from "./slices/updateReservationSlice";
import cancelReservationByRoomSlice from "./slices/cancelReservationByRoomSlice";
import housekeepingStatusSlice from "./slices/housekeepingStatusSlice";
import hotelImageUploadSlice from "./slices/hotelImageUploadSlice";
import fetchCategorySlice from "./slices/fetchCategorySlice";
import createHotelTaxConfigSlice from "./slices/createHotelTaxConfigSlice";
import fetchHotelTaxConfigSlice from "./slices/fetchHotelTaxConfigSlice";
import updateHotelTaxConfigSlice from "./slices/updateHotelTaxConfig";
import deleteHotelTaxConfigSlice from "./slices/deleteHotelTaxConfigSlice";
import createHotelPosCenterTaxConfigSlice from "./slices/createHotelPosCenterTaxConfigSlice";
import deletePosCenterTaxConfigSlice from "./slices/deletePosCenterTaxConfigSlice";
import fetchHotelPosCenterTaxConfigSlice from "./slices/fetchHotelPosCenterTaxConfigSlice";
import updatePosCenterTaxConfigSlice from "./slices/updatePosCenterTaxConfigSlice";
import updateHotelPosCenterSlice from "./slices/updateHotelPosCenterSlice";
import fetchCategoriesSlice from "./slices/fetchCategoriesSlice";
import fetchHotelByGuidSlice from "./slices/fetchHotelByGuidSlice";
import changeReservationDateSlice from "./slices/changeReservationDateSlice";
import reservationAddRoomSlice from "./slices/reservationAddRoomSlice";
import reportMasterSlice from "./slices/reportMasterSlice";
import emailSendSlice from "./slices/emailSendSlice";
import baseCategoryMasterReducer from "./slices/baseCategoryMasterSlice";
import createCategoryReducer from "./slices/createCategorySlice";
import fetchedReservationActivityLogReducer from "./slices/fetchedReservationActivityLogSlice";
import currencyExchangeSlice from "./slices/currencyExchangeSlice";
import nightAuditRateCheckerReducer from "./slices/nightAuditRateCheckerSlice";
import createBusinessBlockReducer from "./slices/createBusinessBlockSlice";
import { fetchReservationsReducer } from "@/redux/slices/fetchReservationsSlice";
import createHotelEmployeeSlice from "./slices/createHotelEmployeeSlice";
import hotelEmployeesByHotelSlice from "./slices/hotelEmployeesByHotelSlice";
import updateHotelEmployeeSlice from "./slices/updateHotelEmployeeSlice";
import deleteHotelEmployeeSlice from "./slices/deleteHotelEmployeeSlice";
import createHousekeepingLogReducer from "./slices/createHousekeepingLogSlice";
import noShowSlice from "./slices/noShowSlice";
import updatePasswordReducer from "./slices/updatePasswordSlice";
import reservationStatusSlice from "./slices/updateStatusByReservationDetailID";
import createPosCenterReducer from "./slices/createPosCenterSlice";
import updateItemMasterSlice from "./slices/updateItemMasterSlice";
import deleteItemMasterReducer from "./slices/deleteItemMasterSlice";
import takeReservationPaymentSlice from "./slices/takeReservationPaymentSlice";
import postHotelRatePlanSlice from "./slices/postHotelRatePlanSlice";
import currencyReducer from "@/redux/slices/currencySlice";
import checkoutFlowReducer from "@/redux/slices/checkoutFlowSlice";
import updateTransactionFinActReducer from "./slices/updateTransactionFinActSlice";
import updateHotelRatePlanSlice from "./slices/updateHotelRatePlanSlice";
import supportTicketSlice from "@/redux/slices/supportTicketSlice";
import updateNameMasterReducer from "./slices/updateNameMasterSlice";
import nameMasterDeleteReducer from "./slices/nameMasterDeleteSlice";
import glTransactionCreateReducer from "./slices/glTransactionCreateSlice";
import fetchFolioByReservationIdSlice from "./slices/fetchFolioByReservationIdSlice";
import postHotelTaxConfigReducer from "./slices/postHotelTaxConfigSlice";
import hotelTaxConfigSlice from "./slices/hotelTaxConfigSlice";
import taxConfigByCountryReducer from "./slices/taxConfigByCountrySlice";
import transactionHeadersSlice from "./slices/transactionHeadersSlice";
import glAccountCreateSlice from "./slices/glAccountCreateSlice";
import todoCreateReducer from "./slices/todoCreateSlice";
import todoListReducer from "./slices/todoListSlice";
import todoUpdateReducer from "./slices/todoUpdateSlice";
import todoDeleteReducer from "./slices/todoDeleteSlice";
import tutorialsByModuleSlice from "./slices/tutorialsByModuleSlice";
import cityLedgerReducer from "@/redux/slices/cityLedgerSlice";
import updateUserPhoneReducer from "./slices/updateUserPhoneSlice";
import getEmailTemplateSlice from "@/redux/slices/fetchEmailTemplateSlice";
import payablesReducer from "./slices/payableSlice";
import roomMasReducer from "./slices/roomMasSlice";
import roomTypeMasReducer from "./slices/roomTypeMasSlice";
import reservationDetailSlice from "./slices/fetchReservationDetailSlice";
import editReservationMasSlice from "./slices/editReservationMasSlice";
import editRoomMasSlice from "./slices/editRoomMasSlice";
import reservationRateDetailReducer from "./slices/reservationRateDetailSlice";
import fetchHotelMasByHotelCodeReducer from "./slices/fetchHotelMasByHotelCode";
import fetchCountryMasReducer from "./slices/fetchCountryMasSlice";
import fetchCategoryMasReducer from "./slices/fetchCategoryMasSlice";
import fetchCurrencyMasReducer from "./slices/fetchCurrencyMasSlice";
import guestMasReducer from "./slices/fetchGuestMasSlice";
import createFileUploadReducer from "./slices/createFileUploadSlice";
import fetchFileUploadByFolioIdReducer from "./slices/fetchFileUploadByFolioIdSlice";
import auditMasByIdReducer from "./slices/fetchAuditMasByIdSlice";
import fetchAuditMasByHotelCodeReducer from "@/redux/slices/fetchAuditMasByHotelCodeSlice";
import fetchBasisMasReducer from "./slices/fetchBasisMasSlice";
import createBasisMasReducer from "./slices/createBasisMasSlice";
import editBasisMasByBasisKeyReducer from "./slices/editBasisMasByBasisKeySlice";
import fetchMealAllocationReducer from "./slices/fetchMealAllocationSlice";
import createCategoryMasReducer from "./slices/createCategoryMasSlice";
import updateCategoryMasReducer from "./slices/updateCategoryMasSlice";
import fetchNameMasReducer from "./slices/fetchNameMasSlice"; 
import fetchNationalityMasReducer from "./slices/fetchNationalityMasSlice";
import createNameMasReducer from "./slices/createNameMasSlice";
import updateNameMasReducer from "./slices/updateNameMasSlice";
import updateGuestMasReducer from "./slices/updateGuestMasSlice";
import categoryTypeMasReducer from "./slices/fetchCategoryTypeMasSlice";
import createCategoryTypeMasReducer from "./slices/createCategoryTypeMasSlice";
import fetchPMSModuleMasReducer from "./slices/fetchPMSModuleMasSlice";
import createPMSModuleMasReducer from "./slices/createPMSModuleMasSlice";
import fetchPMSUserPermissionReducer from "./slices/fetchPMSUserPermissionSlice";
import createPMSUserPermissionReducer from "./slices/createPMSUserPermissionSlice";
import fetchItemMasReducer from "./slices/fetchItemMasSlice";
import createItemMasReducer from "./slices/createItemMasSlice";
import fetchItemsByPOSCenterReducer from "./slices/fetchItemsByPOSCenterSlice";
import createItemsByPOSCenterReducer from "./slices/createItemsByPOSCenterSlice";
import fetchMarketMasReducer from "./slices/fetchMarketMasSlice";
import createMarketMasReducer from "./slices/createMarketMasSlice";
import fetchEventTypeMasReducer from "./slices/fetchEventTypeMasSlice";
import createEventTypeMasReducer from "./slices/createEventTypeMasSlice";
import fetchControlNumberMasReducer from "./slices/fetchControlNumberMasSlice";
import updateCategoryTypeMasReducer from "./slices/updateCategoryTypeMasSlice";
import updatePMSModuleMasReducer from "./slices/updatePMSModuleMasSlice";
import updatePMSUserPermissionReducer from "./slices/updatePMSUserPermissionSlice";
import updateItemMasReducer from "./slices/updateItemMasSlice";
import updateItemsByPOSCenterReducer from "./slices/updateItemsByPOSCenterSlice";
import updateMarketMasReducer from "./slices/updateMarketMasSlice";
import updateEventTypeMasReducer from "./slices/updateEventTypeMasSlice";
import fetchHotelPOSCenterMasReducer from "./slices/fetchHotelPOSCenterMasSlice";
import createHotelPOSCenterMasReducer from "./slices/createHotelPOSCenterMasSlice";
import updateHotelPOSCenterMasReducer from "./slices/updateHotelPOSCenterMasSlice";
import fetchReservationDetailsReducer from "./slices/fetchReservationDetailsSlice";
import updateReservationDetailsReducer from "./slices/updateReservationDetailsSlice";
import createReservationDetailsReducer from "./slices/createReservationDetailsSlice";
import fetchReservationRateDetailsReducer from "./slices/fetchReservationRateDetailsSlice";
import createReservationRateDetailsReducer from "./slices/createReservationRateDetailsSlice";
import updateReservationRateDetailsReducer from "./slices/updateReservationRateDetailsSlice";
import fetchReservationSourceReducer from "./slices/fetchReservationSourceSlice";
import createReservationSourceReducer from "./slices/createReservationSourceSlice";
import updateReservationSourceReducer from "./slices/updateReservationSourceSlice";
import fetchSalesExecutiveMasReducer from "./slices/fetchSalesExecutiveMasSlice"
import createSalesExecutiveMasReducer from "./slices/createSalesExecutiveMasSlice";
import updateSalesExecutiveMasReducer from "./slices/updateSalesExecutiveMasSlice";
import fetchSeasonMasReducer from "./slices/fetchSeasonMasSlice";
import createSeasonMasReducer from "./slices/createSeasonMasSlice";
import updateSeasonMasReducer from "./slices/updateSeasonMasSlice";
import fetchTaxTableReducer from "./slices/fetchTaxTableSlice";
import createTaxTableReducer from "./slices/createTaxTableSlice";
import updateTaxTableReducer from "./slices/updateTaxTableSlice";
import fetchVenueMasReducer from "./slices/fetchVenueMasSlice";
import updateVenueMasReducer from "./slices/updateVenueMasSlice";
import createVenueMasReducer from "./slices/createVenueMasSlice";
import createMealAllocationReducer from "./slices/createMealAllocationSlice";
import updateMealAllocationReducer from "./slices/updateMealAllocationSlice";
import createNationalityMasReducer from "./slices/createNationalityMasSlice";
import updateNationalityMasReducer from "./slices/updateNationalityMasSlice";
import fetchUserMasReducer from "./slices/fetchUserMasSlice";
import fetchMealPlanByFolioByDateReducer from "./slices/fetchMealPlanByFolioByDateSlice";
import createMealPlanByFolioByDateReducer from "./slices/createMealPlanByFolioByDateSlice";
import updateMealPlanByFolioByDateReducer from "./slices/updateMealPlanByFolioByDateSlice";
import updateHotelMasReducer from "./slices/updateHotelMasSlice";
import fetchRateCodesReducer from "./slices/fetchRateCodesSlice";
import fetchRateMasAvailabilityReducer from "./slices/fetchRateMasAvailabilitySlice";
import fetchRateMasReducer from "./slices/fetchRateMasSlice";
import fetchHotelRatePlansReducer from "./slices/fetchHotelRatePlanSlice";
import fetchReservationDetailsByIdReducer from "@/redux/slices/fetchreservtaionByIdSlice";
import createHotelRatePlansReducer from "./slices/createHotelRatePlansSlice";

import addRoomTypeMasReducer from './slices/addRoomTypeMasSlice';
import updateRoomTypeMasReducer from './slices/updateRoomTypeMasSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    categories: categoryReducer,
    cart: cartReducer,
    items: itemReducer,
    createHotelTax: createHotelTaxSlice,
    hotelTaxByHotelId: hotelTaxByHotelIdSlice,
    updateHotelTax: updateHotelTaxSlice,
    rateDetails: rateDetailsReducer,
    mealPlan: mealPlanReducer,
    transactionCode: transactionCodeReducer,
    postCharges: postChargesReducer,
    folio: folioReducer,
    reservation: reservationReducer,
    transaction: transactionSlice,
    guestProfile: guestProfileReducer,
    hotelCurrency: hotelCurrencySlice,
    posOrder: posOrderReducer,
    reservations: fetchReservationReducer,
    createPosInvoice: createPosInvoiceReducer,
    posTable: posTableSlice,
    itemMaster: itemMasterSlice,
    hotelPosCenter: hotelPosCenterSlice,
    availableRooms: availableRoomsReducer,
    checkIn: checkInSlice,
    createCheckIn: createCheckInReducer,
    createCheckOut: createCheckOutReducer,
    frontdesk: frontdeskReducer,
    glAccount: glAccountSlice,
    glAccountType: glAccountTypeSlice,
    transactionList: transactionListSlice,
    purchaseBillSummary: purchaseBillSummarySlice,
    recordExpense: recordExpenseSlice,
    glAccountsByType: glAccountsByTypeSlice,
    hotelRoomTypes: hotelRoomTypesSlice,
    reservationList: reservationListSlice,
    occupancyRate: occupancyRateSlice,
    dashboard: dashboardReducer,
    hotelRoomNumbers: hotelRoomNumberReducer,
    reservationAttachment: reservationAttachmentSlice,
    fetchReservationAttachment: fetchReservationAttachmentSlice,
    systemDate: systemDateSlice,
    hotelGuestProfile: hotelGuestProfileSlice,
    hotelImage: hotelImageSlice,
    fetchHotelImage: fetchHotelImageSlice,
    updateHotelImage: updateHotelImageSlice,
    hotelImageDelete: hotelImageDeleteSlice,
    updateHotel: updateHotelSlice,
    updateHotelRoomTypeImage: updateHotelRoomTypeImageSlice,
    hotelRoomTypeImage: hotelRoomTypeImageSlice,
    extendReservation: extendReservationReducer,
    cancelReservation: cancelReservationSlice,
    updateHotelRoomType: updateHotelRoomTypeSlice,
    reservationRemark: reservationRemarkSlice,
    guestProfileRemark: guestProfileRemarkSlice,
    fetchReservationRemarks: fetchReservationRemarksSlice,
    fetchuGestProfileRemark: fetchuGestProfileRemarkSlice,
    shortenReservation: shortenReservationSlice,
    availability: availabilitySlice,
    rateAvailability: rateAvailabilityReducer,
    rateCode: rateCodeSlice,
    nameMaster: nameMasterSlice,
    nightAudit: nightAuditSlice,
    deleteHotelImage: deleteHotelImageSlice,
    calculateRate: calculateRateReducer,
    hotelRatePlan: hotelRatePlanSlice,
    fetchHotelMealAllocation: fetchHotelMealAllocationSlice,
    createHotelMealAllocation: createHotelMealAllocationSlice,
    updateHotelMealAllocation: updateHotelMealAllocationSlice,
    deleteHotelMealAllocation: deleteHotelMealAllocationSlice,
    guestProfileByHotelId: guestProfileByHotelIdSlice,
    performanceByAgent: performanceByAgentSlice,
    createHotelIPG: createHotelIPGSlice,
    hotelIPGList: fetchHotelIPGSlice,
    updateHotelIPG: updateHotelIPGSlice,
    deleteHotelIPG: deleteHotelIPGSlice,
    updateGuestProfileByRoom: updateGuestProfileByRoomSlice,
    updateGuestProfile: updateGuestProfileSlice,
    cancelReservationDetail: cancelReservationDetailSlice,
    createGuestProfileByRoom: createGuestProfileByRoomSlice,
    reservationById: reservationByIdSlice,
    updateReservation: updateReservationSlice,
    cancelReservationByRoom: cancelReservationByRoomSlice,
    housekeepingStatus: housekeepingStatusSlice,
    hotelImageUpload: hotelImageUploadSlice,
    fetchCategory: fetchCategorySlice,
    createHotelTaxConfig: createHotelTaxConfigSlice,
    fetchHotelTaxConfig: fetchHotelTaxConfigSlice,
    updateHotelTaxConfig: updateHotelTaxConfigSlice,
    deleteHotelTaxConfig: deleteHotelTaxConfigSlice,
    createHotelPosCenterTaxConfig: createHotelPosCenterTaxConfigSlice,
    deletePosCenterTaxConfig: deletePosCenterTaxConfigSlice,
    fetchHotelPosCenterTaxConfig: fetchHotelPosCenterTaxConfigSlice,
    updatePosCenterTaxConfig: updatePosCenterTaxConfigSlice,
    updateHotelPosCenter: updateHotelPosCenterSlice,
    fetchCategories: fetchCategoriesSlice,
    hotelByGuid: fetchHotelByGuidSlice,
    changeReservationDate: changeReservationDateSlice,
    reservationAddRoom: reservationAddRoomSlice,
    reportMaster: reportMasterSlice,
    emailSend: emailSendSlice,
    baseCategoryMaster: baseCategoryMasterReducer,
    createCategory: createCategoryReducer,
    fetchedReservationActivityLogs: fetchedReservationActivityLogReducer,
    currencyExchange: currencyExchangeSlice,
    nightAuditRateChecker: nightAuditRateCheckerReducer,
    createBusinessBlock: createBusinessBlockReducer,
    fetchReservations: fetchReservationsReducer,
    createHotelEmployee: createHotelEmployeeSlice,
    hotelEmployeesByHotel: hotelEmployeesByHotelSlice,
    updateHotelEmployee: updateHotelEmployeeSlice,
    deleteHotelEmployee: deleteHotelEmployeeSlice,
    createHousekeepingLog: createHousekeepingLogReducer,
    noShow: noShowSlice,
    updatePassword: updatePasswordReducer,
    reservationStatus: reservationStatusSlice,
    createPosCenter: createPosCenterReducer,
    updateItemMaster: updateItemMasterSlice,
    deleteItemMaster: deleteItemMasterReducer,
    takeReservationPayment: takeReservationPaymentSlice,
    postHotelRatePlan: postHotelRatePlanSlice,
    currency: currencyReducer,
    checkoutFlow: checkoutFlowReducer,
    updateTransactionFinAct: updateTransactionFinActReducer,
    updateHotelRatePlan: updateHotelRatePlanSlice,
    supportTicket: supportTicketSlice,
    updateNameMaster: updateNameMasterReducer,
    nameMasterDelete: nameMasterDeleteReducer,
    glTransactionCreate: glTransactionCreateReducer,
    fetchFolioByReservationId: fetchFolioByReservationIdSlice,
    postHotelTaxConfig: postHotelTaxConfigReducer,
    hotelTaxConfig: hotelTaxConfigSlice,
    taxConfigByCountry: taxConfigByCountryReducer,
    transactionHeaders: transactionHeadersSlice,
    glAccountCreate: glAccountCreateSlice,
    todoCreate: todoCreateReducer,
    todoList: todoListReducer,
    todoUpdate: todoUpdateReducer,
    todoDelete: todoDeleteReducer,
    tutorialsByModule: tutorialsByModuleSlice,
    cityLedger: cityLedgerReducer,
    updateUserPhone: updateUserPhoneReducer,
    emailTemplate: getEmailTemplateSlice,
    payables: payablesReducer,
    roomMas: roomMasReducer,
    roomTypeMas: roomTypeMasReducer,
    reservationDetail: reservationDetailSlice,
    editReservationMas: editReservationMasSlice,
    editRoomMas: editRoomMasSlice,
    reservationRateDetail: reservationRateDetailReducer,
    fetchHotelMasByHotelCode: fetchHotelMasByHotelCodeReducer,
    fetchCountryMas: fetchCountryMasReducer,
    fetchCategoryMas: fetchCategoryMasReducer,
    fetchCurrencyMas: fetchCurrencyMasReducer,
    userMasAuth: userMasAuthReducer,
    createFileUpload: createFileUploadReducer,
    fetchFileUploadByFolioId: fetchFileUploadByFolioIdReducer,
    fetchGuestMas: guestMasReducer,
    updateGuestMas: updateGuestMasReducer,
    auditMasById: auditMasByIdReducer,
    fetchAuditMasByHotelCode: fetchAuditMasByHotelCodeReducer,
    fetchBasisMas: fetchBasisMasReducer,
    createBasisMas: createBasisMasReducer,
    editBasisMasByBasisKey: editBasisMasByBasisKeyReducer,
    createCategoryMas: createCategoryMasReducer,
    updateCategoryMas: updateCategoryMasReducer,
    fetchMealAllocation: fetchMealAllocationReducer,
    fetchNameMas: fetchNameMasReducer,
    fetchNationalityMas: fetchNationalityMasReducer,
    fetchAvailableRoomTypes: fetchAvailableRoomTypesReducer,
    createNameMas: createNameMasReducer,
    updateNameMas: updateNameMasReducer,
    categoryTypeMas: categoryTypeMasReducer,
    createCategoryTypeMas: createCategoryTypeMasReducer,
    fetchPMSModuleMas: fetchPMSModuleMasReducer,
    createPMSModuleMas: createPMSModuleMasReducer,
    fetchPMSUserPermission: fetchPMSUserPermissionReducer,
    createPMSUserPermission: createPMSUserPermissionReducer,
    fetchItemMas: fetchItemMasReducer,
    createItemMas: createItemMasReducer,
    fetchItemsByPOSCenter: fetchItemsByPOSCenterReducer,
    createItemsByPOSCenter: createItemsByPOSCenterReducer,
    fetchMarketMas: fetchMarketMasReducer,
    createMarketMas: createMarketMasReducer,
    fetchEventTypeMas: fetchEventTypeMasReducer,
    createEventTypeMas: createEventTypeMasReducer,
    fetchControlNumberMas: fetchControlNumberMasReducer,
    updateCategoryTypeMas: updateCategoryTypeMasReducer,
    updatePMSModuleMas: updatePMSModuleMasReducer,
    updatePMSUserPermission: updatePMSUserPermissionReducer,
    updateItemMas: updateItemMasReducer,
    updateItemsByPOSCenter: updateItemsByPOSCenterReducer,
    updateMarketMas: updateMarketMasReducer,
    updateEventTypeMas: updateEventTypeMasReducer,
    fetchHotelPOSCenterMas: fetchHotelPOSCenterMasReducer,
    createHotelPOSCenterMas: createHotelPOSCenterMasReducer,
    updateHotelPOSCenterMas: updateHotelPOSCenterMasReducer,
    fetchReservationDetails: fetchReservationDetailsReducer,
    updateReservationDetails: updateReservationDetailsReducer,
    createReservationDetails: createReservationDetailsReducer,
    fetchReservationRateDetails: fetchReservationRateDetailsReducer,
    createReservationRateDetails: createReservationRateDetailsReducer,
    updateReservationRateDetails: updateReservationRateDetailsReducer,
    reservationSource: fetchReservationSourceReducer,
    createReservationSource: createReservationSourceReducer,
    updateReservationSource: updateReservationSourceReducer,
    fetchSalesExecutiveMas: fetchSalesExecutiveMasReducer,
    createSalesExecutiveMas: createSalesExecutiveMasReducer,
    updateSalesExecutiveMas: updateSalesExecutiveMasReducer,
    fetchSeasonMas: fetchSeasonMasReducer,
    createSeasonMas: createSeasonMasReducer,
    updateSeasonMas: updateSeasonMasReducer,
    fetchTaxTable: fetchTaxTableReducer,
    createTaxTable: createTaxTableReducer,
    updateTaxTable: updateTaxTableReducer,
    fetchVenueMas: fetchVenueMasReducer,
    updateVenueMas: updateVenueMasReducer,
    createVenueMas: createVenueMasReducer,
    createMealAllocation: createMealAllocationReducer,
    updateMealAllocation: updateMealAllocationReducer,
    createNationalityMas: createNationalityMasReducer,
    updateNationalityMas: updateNationalityMasReducer,
    fetchUserMas: fetchUserMasReducer,
    fetchMealPlanByFolioByDate: fetchMealPlanByFolioByDateReducer,
    createMealPlanByFolioByDate: createMealPlanByFolioByDateReducer,
    updateMealPlanByFolioByDate: updateMealPlanByFolioByDateReducer,
    updateHotelMas: updateHotelMasReducer,
    fetchRateCodes: fetchRateCodesReducer,
    fetchRateMasAvailability: fetchRateMasAvailabilityReducer,
    fetchRateMas: fetchRateMasReducer,
    fetchHotelRatePlans: fetchHotelRatePlansReducer,
    fetchReservationDetailsById: fetchReservationDetailsByIdReducer,
     createHotelRatePlans: createHotelRatePlansReducer,
    addRoomTypeMas: addRoomTypeMasReducer,
    updateRoomTypeMas: updateRoomTypeMasReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
