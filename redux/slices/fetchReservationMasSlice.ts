// redux/slices/fetchReservationMasSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Types ---- */

export interface HotelMaster {
  hotelID: number;
  finAct: boolean;
  hotelCode: string;
  hotelName: string;
  legalName: string;
  address: string;
  phone: string;
  email: string;
  web: string;
  lastLoginOn: string;
  lastLoginBy: number;
  createdOn: string;
  createdBy: string;
  lastUpdatedBy: string;
  lastUpdatedOn: string;
  homeCurrencyCode: string;
  cM_Username: string;
  cM_Password: string;
  cM_PropertyID: string;
  toDay: string;
  isChannelManagerActive: boolean;
  occ: number;
  logoURL: string;
  vatNo: string;
  cmName: string;
  allowManualDisc: boolean;
  text1: string;
  text2: string;
  text3: string;
  text4: string;
  text5: string;
  text6: string;
  text7: string;
  text8: string;
  footer: string;
  notes: string;
  paymentTerms: string;
  cancellationPolicy: string;
  childPolicy: string;
  taxation: string;
  promotions: string;
  airportPickupDropd: string;
  attractions: string;
  coopAddress: string;
  companyRegNo: string;
  isTranLevelApprovalActive: boolean;
  roomRevenueByRoomWise: boolean;
  checkInTime: string;
  checkOutTime: string;
  saPassword: string;
  groupName: string;
  mainImageURL: string;
  ibE_LogoURL: string;
  latitude: string;
  longitude: string;
  embedMap: string;
  googleMapURL: string;
  whatsAppNo: string;
  starCat: number;
  hotelScore: number;
  hotelScoreDesc: string;
  lastBackupOn: string;
  e_SenderEmail: string;
  e_SMTP_Password: string;
  e_SMTP_SERVER: string;
  e_SMTP_Port: string;
  ibE_Webhook: string;
  grnLeadTime: number;
  recordCostForComplementRooms: boolean;
  ibE_AllowPayAtProperty: boolean;
  ibE_isIPGActive: boolean;
  ibeHeaderColour: string;
  isCancelUnpaidRes_IBE: boolean;
  periodEndDate: string;
  ibeurl: string;
  ibE_CheckInTime: string;
  ibE_CheckOutTime: string;
  ibE_CancellationPolicy: string;
  ibE_ChildPolicy: string;
  ibE_Taxes: string;
  ibE_Payments: string;
  ibE_Important: string;
  ibE_Footer: string;
  ibE_TenRes_ReleaseTimeInMin: number;
  ibE_Header: string;
  googleAnalyticsID: string;
  hotelNetworkID: string;
  exoticAuthKey: string;
  guid: string;
  childFriendly: boolean;
  ibE_Pay50: boolean;
  ibE_LogoWidth: number;
  ibE_LogoHeight: number;

  [key: string]: any;
}

export interface ReservationMaster {
  reservationID: number;
  type: string;
  reservationNo: string;
  status: string;
  title: string;
  bookerFirstName: string;
  bookerLastName: string;
  email: string;
  phone: string;
  bookerFullName: string;
  reservationPaid: number;
  hotelCode: string;
  createdBy: string;
  createdOn: string;
  sessionID: string;
  reservationTypeID: number;
  taid: number;
  resCheckIn: string;
  resCheckOut: string;
  refNo: string;
  currencyCode: string;
  conversionRate: number;
  paymentTerm: string;
  flightNo: string;
  arrivalTime: string;
  airport: string;
  airportPickup: boolean;
  reservationDate: string;
  lastUpdatedOn: string;
  lastUpdatedBy: string;
  ppNo: string;
  bookerNationality: string;
  bookerCountry: string;
  bookerAddress: string;
  bookerCity: string;
  commentAtBooking: string;
  ccNo: string;
  cardType: string;
  expMM: string;
  expYYYY: string;
  cvc: string;
  gender: string;
  bookerPP: string;
  isAllInclusiveRate: boolean;
  discountText: string;
  isNoTax: boolean;
  isGroup: boolean;
  performaInvNo: string;
  nationality: string;
  startFrom: string;
  bookingType: string;
  timeFrom: string;
  timeTo: string;
  menu: string;
  eventType: string;
  invoiceNo: string;
  promoCode: string;
  isOnApproval: boolean;
  approvedBy: string;
  approvedOn: string;
  packageID: number;
  operatorID: number;
  andromeda_ResNo: string;
  isGSTInc: boolean;
  isSCInc: boolean;
  isGTInc: boolean;
  isNoSC: boolean;
  salesRep: string;
  noGreenTaxPax: number;
  arrFlight: string;
  deptFlight: string;
  rateCodeID: number;
  discountCode: string;
  currRateAtTheBlock: number;
  currRateAtTheReserve: number;
  currRateAtTheCheckIn: number;
  currRateAtTheCheckOut: number;
  isRateNegotiated: boolean;
  negotiatedRate: number;
  originalCurrCode: string;
  isInvoiceSent: boolean;
  releaseDate: string;
  isReleased: boolean;
  releasedBy: string;
  isCancelled: boolean;
  cancelledBy: string;
  cancelledOn: string;
  cancelReason: string;
  marketID: number;
  discountID: number;
  initiatedModule: string;
  tourNo: string;
  guestProfileID: number;
  sourceOfBooking: string;
  noOfPax: string;
  venue: string;
  eventDate: string;
  groupName: string;
  addedToCityLedgerBy: string;
  addedToCityLedgerOn: string;
  noOfRooms: number;
  isAcknoledge: boolean;
  tableNo: string;
  advSetoff: number;
  isBookingClosed: boolean;
  bookingClosedBy: string;
  bookingClosedAt: string;
  refInvoiceNo: string;
  acknoOn: string;
  acknoBy: string;
  isRatesLocked: boolean;
  isInvoiceGenerated: boolean;
  invoiceGeneratedBy: string;
  invoiceGeneratedOn: string;
  remarks_Internal: string;
  remarks_Guest: string;
  checkInTimeExp: string;
  checkOutTimeExp: string;
  isRoomingListCreated: boolean;
  travePurposeID: number;
  isDayroom: boolean;
  isBlockConverted: boolean;
  blockConvertedBy: string;
  blockConvertedOn: string;
  cmid: string;
  ipG_transactionReference: string;
  ipG_orderId: string;
  ipG_transactionAmount: number;
  ipG_creditedAmount: number;
  ipG_transactionStatus: string;
  ipG_transactionMessage: string;
  ipG_transactionTimeInMillis: string;
  ipG_merchantParam1: string;
  ipG_merchantParam2: string;
  ipG_checksum: string;
  totalAMT: number;
  isNotificationSent: boolean;
  notificationSentTimeStamp: string;
  lastModType: string;
  releasedTimeStamp: string;
  country: string;
  hotelMaster?: HotelMaster;

  [key: string]: any;
}

export interface RoomMas {
  roomID: number;
  finAct: boolean;
  roomStatusID: number | null;
  roomNumber: string;
  roomTypeID: number;
  blockID: number | null;
  floorID: number | null;
  description: string | null;
  hotelCode: string;
  createdBy: string;
  createdOn: string;
  roomSizeID: number | null;
  statusColour: string | null;
  houseKeepingStatusID: number;
  remarks: string | null;
  assignTo: string | null;
  category: string | null;
  alias: string | null;
  accountID: number | null;
  apertmentOwner_Name: string | null;
  apertmentOwner_Address: string | null;
  apertmentOwner_ContactNo: string | null;
  apertmentOwner_Email: string | null;
  lockNo: string | null;
  bedType: string | null;
  lockNom: string | null;
  hotelRoomType: any | null;

  [key: string]: any;
}

export interface ReservationRoom {
  reservationDetailID: number;
  reservationID: number;
  roomID: number;
  checkIN: string;
  checkOUT: string;
  statusID: number;
  basis: string;
  adults: number;
  child: number;
  extraBed: number;
  comment: string;
  guest1: string;
  guest2: string;
  reservationStatusID: number;
  checkINat: string;
  checkedInBy: string;
  checkOutAt: string;
  checkedOutBy: string;
  market: string;
  isMiniBar: boolean;
  barInclude: string;
  isSafe: boolean;
  safeNo: string;
  isWifi: boolean;
  wifiUN: string;
  wifiPW: string;
  paidAtBooking: number;
  isAutoRate: boolean;
  avgBaseRate: number;
  netRate: number;
  extra: number;
  isAcknoledge: boolean;
  acknoOn: string;
  acknoBy: string;
  cancelledBy: string;
  cencelledOn: string;
  cancel_Reason: string;
  sc: number;
  tdl: number;
  nbt: number;
  vat: number;
  infant: number;
  childRate: number;
  exBedRate: number;
  folioNo: string;
  isDNR: boolean;
  roomType: string;
  roomListID: number;
  bedType: string;
  cancelRemarks: string;
  isOnAI: boolean;
  isGuestPayGreenTax: boolean;
  isHotelPayGreenTax: boolean;
  isCompliment: boolean;
  stopSales: boolean;
  resBlockDetailID: number;
  resvOccupancy: string;
  rateCategory: string;
  noOfRoomsBlocked: number;
  isRepeatGuest: boolean;
  guestProfileID: number;
  isFOC: boolean;
  pin: string;
  purposeOfTravel: string;
  isDayroom: boolean;
  addedBy: string;
  addedOn: string;
  roomCount: number;
  roomTypeID: number;
  roomRate: number;
  discountCodeApplied: string;
  totDiscPerRoomNight: number;
  discountType: string;
  discountVal: number;
  isBlockConvertedToRM: boolean;
  isBlock: boolean;
  discountRemakrs: string;
  block_ReservationDetailID: number;
  exBed: boolean;
  exBedCount: number;
  gssKey: string;
  reservationMaster?: ReservationMaster;
  roomMas?: RoomMas;

  [key: string]: any;
}

/**
 * Top-level ReservationMas from /api/ReservationMas
 */
export interface ReservationMas extends ReservationMaster {
  rooms?: ReservationRoom[];

  // keep index signature for any future fields
  [key: string]: any;
}

interface FetchReservationMasState {
  loading: boolean;
  error: string | null;
  data: ReservationMas[];
}

const initialState: FetchReservationMasState = {
  loading: false,
  error: null,
  data: [],
};

/** ---- Thunk: GET /api/ReservationMas ---- */

export interface FetchReservationMasArgs {
  hotelCode?: string;
  reservationId?: number;
  status?: string;
}

export const fetchReservationMas = createAsyncThunk<
  ReservationMas[],
  FetchReservationMasArgs | void,
  { rejectValue: string }
>("reservationMas/fetch", async (args, { rejectWithValue }) => {
  try {
    const params: Record<string, any> = {};

    if (args?.hotelCode) params.hotelCode = args.hotelCode;
    if (typeof args?.reservationId === "number")
      params.reservationId = args.reservationId;
    if (args?.status) params.status = args.status;

    const response = await axios.get(`${API_BASE_URL}/api/ReservationMas`, {
      params,
    });

    return response.data as ReservationMas[];
  } catch (err: any) {
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "Failed to fetch reservations.";
    return rejectWithValue(msg);
  }
});

/** ---- Slice ---- */

const fetchReservationMasSlice = createSlice({
  name: "fetchReservationMas",
  initialState,
  reducers: {
    clearReservationMas(state) {
      state.data = [];
      state.error = null;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchReservationMas.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchReservationMas.fulfilled,
        (state, action: PayloadAction<ReservationMas[]>) => {
          state.loading = false;
          state.data = action.payload;
        }
      )
      .addCase(fetchReservationMas.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) || "Failed to fetch reservations.";
      });
  },
});

/** ---- Exports ---- */
export const { clearReservationMas } = fetchReservationMasSlice.actions;
export default fetchReservationMasSlice.reducer;

/** ---- Selectors ---- */
export const selectReservationMasLoading = (state: any) =>
  state.fetchReservationMas?.loading ?? false;

export const selectReservationMasError = (state: any) =>
  state.fetchReservationMas?.error ?? null;

export const selectReservationMasData = (state: any) =>
  state.fetchReservationMas?.data ?? [];