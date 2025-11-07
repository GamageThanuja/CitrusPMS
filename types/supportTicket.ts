export interface SupportTicket {
  supportTicketDetailId: number;
  supportTicketId: number;
  createdOn: string;
  createdBy: string;
  ticketUpdateText: string;
  attachmentUrl: string;
  ticketID: number;
  hotelId: number;
  subject: string;
  ticketType: string;
  priority: string;
  assignedTo: string;
  isClosed: boolean;
  closedBy: string;
  closedOn: string;
  conclusion: string;
  isReplied: boolean;
}
